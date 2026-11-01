// ============================================================
// TMDB API CLIENT
// All communication with TMDB goes through this file.
// No other part of the app should call TMDB directly.
// Turning raw responses into app shapes lives in tmdb-mappers.ts.
// ============================================================

import { db } from "@/db";
import { tmdbCache } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  mapSearchResult,
  mapTitle,
  type MediaType,
  type RawMovie,
  type RawSearchResult,
  type RawTv,
  type SearchResult,
  type TitleMeta,
} from "@/lib/tmdb-mappers";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Every request to TMDB needs an authorization header
// with your API token.
function getHeaders() {
  const token = process.env.TMDB_API_TOKEN;
  if (!token) {
    throw new Error("TMDB_API_TOKEN environment variable is not set");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function tmdbGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const query = new URLSearchParams({ language: "en-US", ...params });
  const response = await fetch(`${TMDB_BASE_URL}${path}?${query}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`TMDB request to ${path} failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ------------------------------------------------------------
// SEARCH
// "multi" searches movies and TV together (people are filtered out).
// TMDB returns up to 20 results per page, ranked by relevance.
// ------------------------------------------------------------

export type SearchType = MediaType | "multi";

export async function searchTitles(query: string, type: SearchType): Promise<SearchResult[]> {
  const data = await tmdbGet<{ results: RawSearchResult[] }>(`/search/${type}`, {
    query,
    include_adult: "false",
    page: "1",
  });

  const fallbackType = type === "multi" ? undefined : type;
  return data.results
    .map((raw) => mapSearchResult(raw, fallbackType))
    .filter((result): result is SearchResult => result !== null);
}

// ------------------------------------------------------------
// DETAILS
// One request per title: credits and external IDs ride along
// via append_to_response.
// ------------------------------------------------------------

export async function fetchTitle(mediaType: MediaType, tmdbId: number): Promise<TitleMeta> {
  const raw = await tmdbGet<RawMovie | RawTv>(`/${mediaType}/${tmdbId}`, {
    append_to_response: "credits,external_ids",
  });
  return mapTitle(mediaType, raw);
}

// ============================================================
// CACHING
// Before calling TMDB, check if we already have the data
// in our database. If the cache is fresh (less than 7 days old),
// use it. Otherwise, fetch from TMDB and update the cache.
// Movie and TV IDs overlap, so the cache is keyed on both.
// ============================================================

const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// This is what the rest of the app should call instead of fetchTitle directly.
export async function getCachedTitle(mediaType: MediaType, tmdbId: number): Promise<TitleMeta> {
  const [cached] = await db
    .select()
    .from(tmdbCache)
    .where(and(eq(tmdbCache.mediaType, mediaType), eq(tmdbCache.tmdbId, tmdbId)))
    .limit(1);

  if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_MAX_AGE_MS) {
    const payload = JSON.parse(cached.payloadJson) as TitleMeta;
    // Entries written before TV support have no mediaType; treat them as stale.
    if (payload.mediaType === mediaType) return payload;
  }

  const payload = await fetchTitle(mediaType, tmdbId);
  const payloadJson = JSON.stringify(payload);

  await db
    .insert(tmdbCache)
    .values({ mediaType, tmdbId, payloadJson, fetchedAt: new Date() })
    .onConflictDoUpdate({
      target: [tmdbCache.mediaType, tmdbCache.tmdbId],
      set: { payloadJson, fetchedAt: new Date() },
    });

  return payload;
}
