import { searchTitles } from "@/lib/tmdb";
import { getAuthenticatedUserId } from "@/lib/get-user";
import { parseSearchParams, serverError, unauthorized } from "@/lib/api";
import { tmdbSearchQuerySchema } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

// Visit /api/tmdb/search?q=inception (while signed in) to test this.
// Optional &type=movie (default), tv, or multi (both together).
// The "q" is called a query parameter — it's how the browser
// passes your search term to the server.
export async function GET(request: NextRequest) {
  // Signed-in users only, so strangers can't spend our TMDB quota
  const userId = await getAuthenticatedUserId();
  if (!userId) return unauthorized();

  const parsed = parseSearchParams(request.nextUrl.searchParams, tmdbSearchQuerySchema);
  if (!parsed.ok) return parsed.response;
  const { q: query, type } = parsed.data;

  try {
    const results = await searchTitles(query, type);

    return NextResponse.json({
      query,
      resultCount: results.length,
      results,
    });
  } catch (error) {
    return serverError(error);
  }
}
