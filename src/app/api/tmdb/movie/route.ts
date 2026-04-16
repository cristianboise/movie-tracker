import { getCachedMovieData } from "@/lib/tmdb";
import { NextRequest, NextResponse } from "next/server";

// Visit /api/tmdb/movie?id=27205 to get full details for Inception.
export async function GET(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");

  if (!idParam) {
    return NextResponse.json(
      { error: "Missing 'id' query parameter. Example: /api/tmdb/movie?id=27205" },
      { status: 400 }
    );
  }

  const tmdbId = parseInt(idParam, 10);

  if (isNaN(tmdbId)) {
    return NextResponse.json(
      { error: "'id' must be a number" },
      { status: 400 }
    );
  }

  try {
    const data = await getCachedMovieData(tmdbId);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}