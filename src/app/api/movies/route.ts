import { db } from "@/db";
import { movies, moviePlatforms } from "@/db/schema";
import { getCachedMovieData } from "@/lib/tmdb";
import { getAuthenticatedUserId } from "@/lib/get-user";
import { parseJsonBody, serverError, unauthorized } from "@/lib/api";
import { createMovieSchema } from "@/lib/schemas";
import { and, eq, desc, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const ALREADY_IN_COLLECTION = "This movie is already in your collection";

// ===================
// POST /api/movies
// ===================
export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return unauthorized();

  try {
    const parsed = await parseJsonBody(request, createMovieSchema);
    if (!parsed.ok) return parsed.response;
    const { tmdbId, platforms, notes } = parsed.data;

    // Cheap duplicate check first so we don't spend a TMDB call on it.
    const [existing] = await db
      .select({ id: movies.id })
      .from(movies)
      .where(and(eq(movies.userId, userId), eq(movies.tmdbId, tmdbId)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: ALREADY_IN_COLLECTION }, { status: 409 });
    }

    const tmdbData = await getCachedMovieData(tmdbId);

    // If two requests race past the check above, the unique index
    // decides the winner and the loser gets no row back.
    const [newMovie] = await db
      .insert(movies)
      .values({
        userId,
        tmdbId,
        title: tmdbData.title,
        year: tmdbData.year ? parseInt(tmdbData.year) : null,
        runtimeMin: tmdbData.runtime,
        posterUrl: tmdbData.posterUrl,
        tmdbMetadataJson: JSON.stringify(tmdbData),
        notes,
      })
      .onConflictDoNothing({ target: [movies.userId, movies.tmdbId] })
      .returning();

    if (!newMovie) {
      return NextResponse.json({ error: ALREADY_IN_COLLECTION }, { status: 409 });
    }

    try {
      await db.insert(moviePlatforms).values(
        platforms.map((p) => ({
          movieId: newMovie.id,
          platform: p.platform,
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
      message: "Movie added to collection",
      movie: {
        id: newMovie.id,
        tmdbId: newMovie.tmdbId,
        title: newMovie.title,
        year: newMovie.year,
        runtime: newMovie.runtimeMin,
        posterUrl: newMovie.posterUrl,
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

    const userMovies = await db
      .select()
      .from(movies)
      .where(eq(movies.userId, userId))
      .orderBy(desc(movies.addedAt));

    // One query for every movie's platforms instead of one per movie
    const platformRows = userMovies.length
      ? await db
          .select()
          .from(moviePlatforms)
          .where(inArray(moviePlatforms.movieId, userMovies.map((m) => m.id)))
      : [];

    const platformsByMovie = new Map<number, typeof platformRows>();
    for (const row of platformRows) {
      const list = platformsByMovie.get(row.movieId);
      if (list) list.push(row);
      else platformsByMovie.set(row.movieId, [row]);
    }

    const moviesWithPlatforms = userMovies.map((movie) => {
      // Parse metadata stored at insert time — always present, always has genres/cast
      const metadata = movie.tmdbMetadataJson
        ? JSON.parse(movie.tmdbMetadataJson)
        : null;

      return {
        id: movie.id,
        tmdbId: movie.tmdbId,
        title: movie.title,
        year: movie.year,
        runtime: movie.runtimeMin,
        posterUrl: movie.posterUrl,
        notes: movie.notes,
        addedAt: movie.addedAt,
        genres: metadata?.genres ?? [],
        cast: metadata?.cast?.map((c: { name: string }) => c.name) ?? [],
        director: metadata?.director ?? null,
        platforms: (platformsByMovie.get(movie.id) ?? []).map((p) => ({
          id: p.id,
          platform: p.platform,
          resolution: p.resolution,
          notes: p.notes,
        })),
      };
    });

    const filtered = platformFilter
      ? moviesWithPlatforms.filter((m) =>
          m.platforms.some((p) => p.platform === platformFilter)
        )
      : moviesWithPlatforms;

    return NextResponse.json({
      count: filtered.length,
      movies: filtered,
    });

  } catch (error) {
    return serverError(error);
  }
}
