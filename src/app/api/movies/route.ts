import { db } from "@/db";
import { movies, moviePlatforms } from "@/db/schema";
import { getCachedTitle } from "@/lib/tmdb";
import { getPosterUrl } from "@/lib/tmdb-mappers";
import { findSeasonError } from "@/lib/titles";
import { getLibrary } from "@/lib/library-data";
import { getAuthenticatedUserId } from "@/lib/get-user";
import { badRequest, parseJsonBody, serverError, unauthorized } from "@/lib/api";
import { createMovieSchema } from "@/lib/schemas";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

function alreadyInCollection(mediaType: string) {
  return `This ${mediaType === "tv" ? "show" : "movie"} is already in your collection`;
}

// ===================
// POST /api/movies
// ===================
export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return unauthorized();

  try {
    const parsed = await parseJsonBody(request, createMovieSchema);
    if (!parsed.ok) return parsed.response;
    const { mediaType, tmdbId, platforms, notes } = parsed.data;

    // Movies can't have seasons; reject before spending a TMDB call
    const seasonError = findSeasonError(mediaType, platforms);
    if (seasonError) return badRequest(seasonError);

    // Cheap duplicate check first so we don't spend a TMDB call on it.
    const [existing] = await db
      .select({ id: movies.id })
      .from(movies)
      .where(
        and(
          eq(movies.userId, userId),
          eq(movies.mediaType, mediaType),
          eq(movies.tmdbId, tmdbId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: alreadyInCollection(mediaType) }, { status: 409 });
    }

    const tmdbData = await getCachedTitle(mediaType, tmdbId);

    if (tmdbData.mediaType === "tv") {
      const knownSeasons = tmdbData.seasons.map((s) => s.seasonNumber);
      const unknownSeason = findSeasonError(mediaType, platforms, knownSeasons);
      if (unknownSeason) return badRequest(unknownSeason);
    }

    // If two requests race past the check above, the unique index
    // decides the winner and the loser gets no row back.
    const [newMovie] = await db
      .insert(movies)
      .values({
        userId,
        mediaType,
        tmdbId,
        title: tmdbData.title,
        year: tmdbData.year ? parseInt(tmdbData.year) : null,
        runtimeMin: tmdbData.runtime,
        posterPath: tmdbData.posterPath,
        tmdbMetadataJson: JSON.stringify(tmdbData),
        notes,
      })
      .onConflictDoNothing({ target: [movies.userId, movies.mediaType, movies.tmdbId] })
      .returning();

    if (!newMovie) {
      return NextResponse.json({ error: alreadyInCollection(mediaType) }, { status: 409 });
    }

    try {
      await db.insert(moviePlatforms).values(
        platforms.map((p) => ({
          movieId: newMovie.id,
          platform: p.platform,
          seasonNumber: p.seasonNumber ?? null,
          resolution: p.resolution || null,
          notes: p.notes || null,
        }))
      );
    } catch (error) {
      // Don't leave a movie with no platforms behind
      await db.delete(movies).where(eq(movies.id, newMovie.id));
      throw error;
    }

    return NextResponse.json({
      message: mediaType === "tv" ? "Show added to collection" : "Movie added to collection",
      movie: {
        id: newMovie.id,
        mediaType: newMovie.mediaType,
        tmdbId: newMovie.tmdbId,
        title: newMovie.title,
        year: newMovie.year,
        runtime: newMovie.runtimeMin,
        posterUrl: getPosterUrl(newMovie.posterPath),
        platforms,
      },
    }, { status: 201 });

  } catch (error) {
    return serverError(error);
  }
}

// ===================
// GET /api/movies
// ===================
export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return unauthorized();

  try {
    const platformFilter = request.nextUrl.searchParams.get("platform");

    const library = await getLibrary(userId);

    const filtered = platformFilter
      ? library.filter((m) => m.platforms.some((p) => p.platform === platformFilter))
      : library;

    return NextResponse.json({
      count: filtered.length,
      movies: filtered,
    });

  } catch (error) {
    return serverError(error);
  }
}
