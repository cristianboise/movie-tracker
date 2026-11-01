import { db } from "@/db";
import { movies, moviePlatforms } from "@/db/schema";
import { getAuthenticatedUserId } from "@/lib/get-user";
import { badRequest, parseJsonBody, serverError, unauthorized } from "@/lib/api";
import { findSeasonError } from "@/lib/titles";
import { updateMovieSchema } from "@/lib/schemas";
import { eq, and } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { NextRequest, NextResponse } from "next/server";

async function getOwnedMovie(movieId: number, userId: string) {
  const [movie] = await db
    .select()
    .from(movies)
    .where(and(eq(movies.id, movieId), eq(movies.userId, userId)))
    .limit(1);

  return movie || null;
}

// ===================
// PUT /api/movies/[id]
// ===================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return unauthorized();

  try {
    const { id } = await params;
    const movieId = parseInt(id, 10);

    if (isNaN(movieId)) return badRequest("Invalid movie ID");

    const movie = await getOwnedMovie(movieId, userId);
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const parsed = await parseJsonBody(request, updateMovieSchema);
    if (!parsed.ok) return parsed.response;
    const { platforms, notes } = parsed.data;

    if (platforms) {
      // Season numbers come from the stored TMDB metadata for TV shows
      const stored = movie.tmdbMetadataJson ? JSON.parse(movie.tmdbMetadataJson) : null;
      const knownSeasons: number[] | undefined = stored?.seasons?.map(
        (s: { seasonNumber: number }) => s.seasonNumber
      );
      const seasonError = findSeasonError(movie.mediaType, platforms, knownSeasons);
      if (seasonError) return badRequest(seasonError);
    }

    // Replacing platforms is a delete + insert. Run everything as one
    // batch so a failed insert can't leave the movie with no platforms.
    const writes: BatchItem<"pg">[] = [];

    if (platforms) {
      writes.push(
        db.delete(moviePlatforms).where(eq(moviePlatforms.movieId, movieId)),
        db.insert(moviePlatforms).values(
          platforms.map((p) => ({
            movieId,
            platform: p.platform,
            seasonNumber: p.seasonNumber ?? null,
            resolution: p.resolution || null,
            notes: p.notes || null,
          }))
        )
      );
    }

    if (notes !== undefined) {
      writes.push(
        db
          .update(movies)
          .set({ notes, updatedAt: new Date() })
          .where(eq(movies.id, movieId))
      );
    }

    if (writes.length > 0) {
      await db.batch(writes as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
    }

    const updatedPlatforms = await db
      .select()
      .from(moviePlatforms)
      .where(eq(moviePlatforms.movieId, movieId));

    return NextResponse.json({
      message: "Movie updated",
      movie: {
        id: movie.id,
        title: movie.title,
        platforms: updatedPlatforms.map((p) => ({
          platform: p.platform,
          seasonNumber: p.seasonNumber,
          resolution: p.resolution,
          notes: p.notes,
        })),
        notes: notes !== undefined ? notes : movie.notes,
      },
    });

  } catch (error) {
    return serverError(error);
  }
}

// ===================
// DELETE /api/movies/[id]
// ===================
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return unauthorized();

  try {
    const { id } = await params;
    const movieId = parseInt(id, 10);

    if (isNaN(movieId)) return badRequest("Invalid movie ID");

    const movie = await getOwnedMovie(movieId, userId);
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    await db.delete(movies).where(eq(movies.id, movieId));

    return NextResponse.json({
      message: `"${movie.title}" removed from collection`,
    });

  } catch (error) {
    return serverError(error);
  }
}
