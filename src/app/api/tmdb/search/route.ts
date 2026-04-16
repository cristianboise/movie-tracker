import { searchMovies, getPosterUrl } from "@/lib/tmdb";
import { NextRequest, NextResponse } from "next/server";

// Visit /api/tmdb/search?q=inception to test this.
// The "q" is called a query parameter — it's how the browser
// passes your search term to the server.
export async function GET(request: NextRequest) {
  // Pull the "q" parameter out of the URL
  const query = request.nextUrl.searchParams.get("q");

  // If no search term was provided, return an error
  if (!query) {
    return NextResponse.json(
      { error: "Missing 'q' query parameter. Example: /api/tmdb/search?q=inception" },
      { status: 400 }
    );
  }

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
