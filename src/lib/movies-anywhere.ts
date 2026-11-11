import { moviesAnywhereSlug } from "@/lib/store-links";

// Finds a movie's real page on Movies Anywhere.
//
// Movies Anywhere names each page itself: usually the title ("inception"),
// sometimes the title plus the year ("the-abyss-1989"). A wrong name is
// harmless on the website (it sends you to the home page) but the iPhone app
// shows "This page is not currently available", so we ask the site which
// name exists before a badge uses it.

export const MOVIES_ANYWHERE_HOME = "https://moviesanywhere.com/";

type Fetcher = (url: string, init: RequestInit) => Promise<{ status: number }>;

// Page names to try, most specific first: with a remake ("dune-2021" next to
// "dune"), the name with the year is the one that is surely this film.
export function moviesAnywhereCandidates(title: string, year: number | null): string[] {
  const slug = moviesAnywhereSlug(title);
  if (!slug) return [];
  return year ? [`${slug}-${year}`, slug] : [slug];
}

// True if the page exists, false if Movies Anywhere sends us elsewhere.
// Anything else (blocked, down) throws: we don't know.
async function pageExists(url: string, fetcher: Fetcher): Promise<boolean> {
  const response = await fetcher(url, {
    method: "HEAD",
    redirect: "manual",
    signal: AbortSignal.timeout(5000),
  });
  if (response.status === 200) return true;
  if (response.status === 404 || (response.status >= 300 && response.status < 400)) return false;
  throw new Error(`Movies Anywhere answered ${response.status} for ${url}`);
}

// The movie's page, or the home page when Movies Anywhere has no page for it
// under any name we can guess (better than the app's error screen).
export async function findMoviesAnywhereUrl(
  title: string,
  year: number | null,
  fetcher: Fetcher = fetch
): Promise<string> {
  const urls = moviesAnywhereCandidates(title, year).map(
    (slug) => `https://moviesanywhere.com/movie/${slug}`
  );
  const found = await Promise.all(urls.map((url) => pageExists(url, fetcher)));
  const index = found.indexOf(true);
  return index === -1 ? MOVIES_ANYWHERE_HOME : urls[index];
}
