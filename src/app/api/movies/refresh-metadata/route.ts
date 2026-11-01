import { db } from "@/db";
import { movies } from "@/db/schema";
import { fetchTitle } from "@/lib/tmdb";
import { getAuthenticatedUserId } from "@/lib/get-user";
import { unauthorized } from "@/lib/api";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// ===================
// POST /api/movies/refresh-metadata
// ===================
// Utility: re-fetches fresh TMDB data for every title in the
// authenticated user's collection and updates the stored metadata in place.
// Bypasses the tmdb_cache. Run it once after the TV-support migration so
// existing movies get the newer metadata shape.
export async function POST() {
  const userId = await getAuthenticatedUserId();
  if (!userId) return unauthorized();

  const userMovies = await db
    .select({
      id: movies.id,
      mediaType: movies.mediaType,
      tmdbId: movies.tmdbId,
      title: movies.title,
    })
    .from(movies)
    .where(eq(movies.userId, userId));

  const results: { title: string; status: "ok" | "error"; error?: string }[] = [];

  for (const movie of userMovies) {
    try {
      const meta = await fetchTitle(movie.mediaType, movie.tmdbId);

      await db
        .update(movies)
        .set({
          tmdbMetadataJson: JSON.stringify(meta),
          posterPath: meta.posterPath,
        })
        .where(eq(movies.id, movie.id));

      results.push({ title: movie.title, status: "ok" });
    } catch (err) {
      console.error(`refresh-metadata failed for "${movie.title}"`, err);
      results.push({
        title: movie.title,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const succeeded = results.filter((r) => r.status === "ok").length;
  const failed = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    message: `Refreshed ${succeeded} title(s). ${failed} failed.`,
    results,
  });
}
