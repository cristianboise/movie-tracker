import { searchMovies, getPosterUrl } from "@/lib/tmdb";
import { getAuthenticatedUserId } from "@/lib/get-user";
import { parseSearchParams, serverError, unauthorized } from "@/lib/api";
import { tmdbSearchQuerySchema } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

// Visit /api/tmdb/search?q=inception (while signed in) to test this.
// The "q" is called a query parameter — it's how the browser
// passes your search term to the server.
export async function GET(request: NextRequest) {
  // Signed-in users only, so strangers can't spend our TMDB quota
  const userId = await getAuthenticatedUserId();
  if (!userId) return unauthorized();

  const parsed = parseSearchParams(request.nextUrl.searchParams, tmdbSearchQuerySchema);
  if (!parsed.ok) return parsed.response;
  const { q: query } = parsed.data;

  try {
    const results = await searchMovies(query);

    // Reshape the results to only include what we care about,
    // and build full poster URLs while we're at it.
    const simplified = results.map((movie) => ({
      tmdbId: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.substring(0, 4) : null,
      overview: movie.overview,
      posterUrl: getPosterUrl(movie.poster_path),
      rating: movie.vote_average,
    }));

    return NextResponse.json({
      query,
      resultCount: simplified.length,
      results: simplified,
    });
  } catch (error) {
    return serverError(error);
  }
}
