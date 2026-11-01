import { getCachedMovieData } from "@/lib/tmdb";
import { getAuthenticatedUserId } from "@/lib/get-user";
import { parseSearchParams, serverError, unauthorized } from "@/lib/api";
import { tmdbIdQuerySchema } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

// Visit /api/tmdb/movie?id=27205 (while signed in) to get full details for Inception.
export async function GET(request: NextRequest) {
  // Signed-in users only, so strangers can't spend our TMDB quota
  const userId = await getAuthenticatedUserId();
  if (!userId) return unauthorized();

  const parsed = parseSearchParams(request.nextUrl.searchParams, tmdbIdQuerySchema);
  if (!parsed.ok) return parsed.response;

  try {
    const data = await getCachedMovieData(parsed.data.id);
    return NextResponse.json(data);
  } catch (error) {
    return serverError(error);
  }
}
