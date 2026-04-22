import { db } from "@/db";
import { movies, moviePlatforms } from "@/db/schema";
import { getCachedMovieData } from "@/lib/tmdb";
import { getAuthenticatedUserId } from "@/lib/get-user";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const VALID_PLATFORMS = ["apple", "fandango", "amazon", "movies_anywhere"];
const VALID_RESOLUTIONS = ["4K", "HD", "SD"];

// ===================
// POST /api/movies
// ===================
export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tmdbId, platforms, notes } = body;

    if (!tmdbId || typeof tmdbId !== "number") {
      return NextResponse.json(
        { error: "tmdbId is required and must be a number" },
        { status: 400 }
      );
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: "platforms is required and must be a non-empty array" },
        { status: 400 }
      );
    }

    for (const p of platforms) {
      if (!VALID_PLATFORMS.includes(p.platform)) {
        return NextResponse.json(
          { error: `Invalid platform: "${p.platform}". Must be one of: ${VALID_PLATFORMS.join(", ")}` },
          { status: 400 }
        );
      }
      if (p.resolution && !VALID_RESOLUTIONS.includes(p.resolution)) {
        return NextResponse.json(
          { error: `Invalid resolution: "${p.resolution}". Must be one of: ${VALID_RESOLUTIONS.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const tmdbData = await getCachedMovieData(tmdbId);

    const existing = await db
      .select()
      .from(movies)
      .where(eq(movies.tmdbId, tmdbId))
      .limit(1);

    if (existing.length > 0 && existing[0].userId === userId) {
      return NextResponse.json(
        { error: "This movie is already in your collection" },
        { status: 409 }
      );
    }

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
        notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      })
      .returning();

    const platformRows = platforms.map((p: { platform: string; resolution?: string; notes?: string }) => ({
      movieId: newMovie.id,
      platform: p.platform,
      resolution: p.resolution || null,
      notes: p.notes || null,
    }));

    await db.insert(moviePlatforms).values(platformRows);

    return NextResponse.json({
      message: "Movie added to collection",
      movie: {
        id: newMovie.id,
        tmdbId: newMovie.tmdbId,
        title: newMovie.title,
        year: newMovie.year,
        runtime: newMovie.runtimeMin,
        posterUrl: newMovie.posterUrl,
        platforms: platforms,
      },
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// ===================
// GET /api/movies
// ===================
export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const platformFilter = request.nextUrl.searchParams.get("platform");

    let userMovies = await db
      .select()
      .from(movies)
      .where(eq(movies.userId, userId))
      .orderBy(desc(movies.addedAt));

    const moviesWithPlatforms = await Promise.all(
      userMovies.map(async (movie) => {
        const platforms = await db
          .select()
          .from(moviePlatforms)
          .where(eq(moviePlatforms.movieId, movie.id));

        return {
          id: movie.id,
          tmdbId: movie.tmdbId,
          title: movie.title,
          year: movie.year,
          runtime: movie.runtimeMin,
          posterUrl: movie.posterUrl,
          notes: movie.notes,
          addedAt: movie.addedAt,
          platforms: platforms.map((p) => ({
            id: p.id,
            platform: p.platform,
            resolution: p.resolution,
            notes: p.notes,
          })),
        };
      })
    );

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}