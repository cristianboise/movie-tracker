import { db } from "@/db";
import { movies, moviePlatforms } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const TEMP_USER_ID = "temp-user-1";
const VALID_PLATFORMS = ["apple", "fandango", "amazon", "movies_anywhere"];
const VALID_RESOLUTIONS = ["4K", "HD", "SD"];

// Helper: get a movie and verify it belongs to the current user.
// Used by both PUT and DELETE to avoid repeating this logic.
async function getOwnedMovie(movieId: number) {
  const [movie] = await db
    .select()
    .from(movies)
    .where(and(eq(movies.id, movieId), eq(movies.userId, TEMP_USER_ID)))
    .limit(1);

  return movie || null;
}

// ===================
// PUT /api/movies/[id]
// Replace all platform tags for a movie.
// This is a "full replace" — you send the complete new list
// of platforms, and it replaces whatever was there before.
// Simpler and less error-prone than add/remove individual tags.
// ===================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movieId = parseInt(id, 10);

    if (isNaN(movieId)) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
    }

    const movie = await getOwnedMovie(movieId);
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const body = await request.json();
    const { platforms, notes } = body;

    // Validate platforms if provided
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

      // Delete all existing platform tags for this movie
      await db
        .delete(moviePlatforms)
        .where(eq(moviePlatforms.movieId, movieId));

      // Insert the new ones
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

    // Update notes on the movie itself if provided
    if (notes !== undefined) {
      await db
        .update(movies)
        .set({ notes, updatedAt: new Date() })
        .where(eq(movies.id, movieId));
    }

    // Return the updated movie
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
// Remove a movie from the collection.
// Platform tags are deleted automatically because of
// "onDelete: cascade" in the schema.
// ===================
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movieId = parseInt(id, 10);

    if (isNaN(movieId)) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
    }

    const movie = await getOwnedMovie(movieId);
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    // Delete the movie. Platform tags are automatically
    // deleted by the database because of "onDelete: cascade"
    // in the schema — no need to delete them manually.
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