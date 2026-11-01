import { db } from "@/db";
import { movies, moviePlatforms } from "@/db/schema";
import { toLibraryMovie } from "@/lib/library-mapping";
import type { Movie } from "@/lib/movie-types";
import { desc, eq, inArray } from "drizzle-orm";

// A user's whole library, newest first. Used by the page (so the movies
// arrive with the HTML) and by GET /api/movies (for refreshes).
export async function getLibrary(userId: string): Promise<Movie[]> {
  const userMovies = await db
    .select()
    .from(movies)
    .where(eq(movies.userId, userId))
    .orderBy(desc(movies.addedAt));

  if (userMovies.length === 0) return [];

  // One query for every title's platforms instead of one per title
  const platformRows = await db
    .select()
    .from(moviePlatforms)
    .where(inArray(moviePlatforms.movieId, userMovies.map((m) => m.id)));

  const platformsByMovie = new Map<number, typeof platformRows>();
  for (const row of platformRows) {
    const list = platformsByMovie.get(row.movieId);
    if (list) list.push(row);
    else platformsByMovie.set(row.movieId, [row]);
  }

  return userMovies.map((movie) => toLibraryMovie(movie, platformsByMovie.get(movie.id) ?? []));
}
