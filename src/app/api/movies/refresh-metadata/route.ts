import { db } from "@/db";
import { movies } from "@/db/schema";
import {
  getMovieDetail,
  getMovieCredits,
  getMovieExternalIds,
  getPosterUrl,
  getBackdropUrl,
} from "@/lib/tmdb";
import { getAuthenticatedUserId } from "@/lib/get-user";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// ===================
// POST /api/movies/refresh-metadata
// ===================
// One-time utility: re-fetches fresh TMDB data for every movie in the
// authenticated user's collection and updates tmdbMetadataJson in place.
// Bypasses the tmdb_cache so older rows without "director" get it immediately.
export async function POST() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userMovies = await db
    .select({ id: movies.id, tmdbId: movies.tmdbId, title: movies.title })
    .from(movies)
    .where(eq(movies.userId, userId));

  const results: { title: string; status: "ok" | "error"; error?: string }[] = [];

  for (const movie of userMovies) {
    try {
      const [detail, credits, externalIds] = await Promise.all([
        getMovieDetail(movie.tmdbId),
        getMovieCredits(movie.tmdbId),
        getMovieExternalIds(movie.tmdbId),
      ]);

      const payload = {
        tmdbId: detail.id,
        title: detail.title,
        year: detail.release_date ? detail.release_date.substring(0, 4) : null,
        runtime: detail.runtime,
        overview: detail.overview,
        tagline: detail.tagline,
        genres: detail.genres.map((g) => g.name),
        rating: detail.vote_average,
        posterUrl: getPosterUrl(detail.poster_path),
        backdropUrl: getBackdropUrl(detail.backdrop_path),
        cast: credits.cast.map((c) => ({ name: c.name, character: c.character })),
        director: credits.director,
        imdbId: externalIds.imdb_id ?? null,
      };

      await db
        .update(movies)
        .set({ tmdbMetadataJson: JSON.stringify(payload) })
        .where(eq(movies.id, movie.id));

      results.push({ title: movie.title, status: "ok" });
    } catch (err) {
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
    message: `Refreshed ${succeeded} movie(s). ${failed} failed.`,
    results,
  });
}
