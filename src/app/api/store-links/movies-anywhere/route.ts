import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/get-user";
import { parseSearchParams, serverError, unauthorized } from "@/lib/api";
import { findMoviesAnywhereUrl } from "@/lib/movies-anywhere";
import { moviesAnywhereLinkQuerySchema } from "@/lib/schemas";

// Page names rarely change, so remember each answer for a month. A failed
// check throws and is not remembered.
const findCached = unstable_cache(
  (title: string, year: number | null) => findMoviesAnywhereUrl(title, year),
  ["movies-anywhere-url"],
  { revalidate: 60 * 60 * 24 * 30 }
);

// GET /api/store-links/movies-anywhere?title=The%20Abyss&year=1989
// -> { url: "https://moviesanywhere.com/movie/the-abyss-1989" }
export async function GET(request: NextRequest) {
  // Signed-in users only, so strangers can't use us to query Movies Anywhere
  const userId = await getAuthenticatedUserId();
  if (!userId) return unauthorized();

  const parsed = parseSearchParams(request.nextUrl.searchParams, moviesAnywhereLinkQuerySchema);
  if (!parsed.ok) return parsed.response;

  try {
    const url = await findCached(parsed.data.title, parsed.data.year ?? null);
    return NextResponse.json({ url });
  } catch (error) {
    return serverError(error);
  }
}
