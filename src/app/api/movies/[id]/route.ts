import { db } from "@/db";
import { movies, moviePlatforms } from "@/db/schema";
import { getAuthenticatedUserId } from "@/lib/get-user";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const VALID_PLATFORMS = ["apple", "fandango", "amazon", "movies_anywhere"];
const VALID_RESOLUTIONS = ["4K", "HD", "SD"];

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
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const movieId = parseInt(id, 10);

    if (isNaN(movieId)) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
    }

    const movie = await getOwnedMovie(movieId, userId);
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const body = await request.json();
    const { platforms, notes } = body;

    if (platforms) {
      if (!Array.isArray(platforms) || platforms.length === 0) {
        return NextResponse.json(
          { error: "platforms must be a non-empty array" },
          { status: 400 }
        );
      }

      for (const p of platforms) {
        if (!VALID_PLATFORMS.includes(p.platform)) {
          return NextResponse.json(
            { error: `Invalid platform: "${p.platform}"` },
            { status: 400 }
          );
        }
        if (p.resolution && !VALID_RESOLUTIONS.includes(p.resolution)) {
          return NextResponse.json(
            { error: `Invalid resolution: "${p.resolution}"` },
            { status: 400 }
          );
        }
      }

      await db
        .delete(moviePlatforms)
        .where(eq(moviePlatforms.movieId, movieId));

      const platformRows = platforms.map(
        (p: { platform: string; resolution?: string; notes?: string }) => ({
          movieId,
          platform: p.platform,
          resolution: p.resolution || null,
          notes: p.notes || null,
        })
      );

      await db.insert(moviePlatforms).values(platformRows);
    }

    if (notes !== undefined) {
      await db
        .update(movies)
        .set({ notes, updatedAt: new Date() })
        .where(eq(movies.id, movieId));
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
          resolution: p.resolution,
          notes: p.notes,
        })),
        notes: notes !== undefined ? notes : movie.notes,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
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
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const movieId = parseInt(id, 10);

    if (isNaN(movieId)) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
    }

    const movie = await getOwnedMovie(movieId, userId);
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    await db.delete(movies).where(eq(movies.id, movieId));

    return NextResponse.json({
      message: `"${movie.title}" removed from collection`,
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}