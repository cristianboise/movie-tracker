// ============================================================
// TMDB API CLIENT
// All communication with TMDB goes through this file.
// No other part of the app should call TMDB directly.
// ============================================================

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Every request to TMDB needs an authorization header
// with your API token. This helper builds the headers
// so we don't repeat ourselves in every function.
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

// ------------------------------------------------------------
// TYPE DEFINITIONS
// These describe the shape of the data TMDB sends back.
// TypeScript uses these to catch mistakes at compile time —
// for example, if you try to access "movie.titl" (typo),
// TypeScript will warn you before you even run the code.
// ------------------------------------------------------------

export type TmdbSearchResult = {
  id: number;
  title: string;
  release_date: string;       // e.g. "2010-07-16"
  overview: string;
  poster_path: string | null; // e.g. "/poster123.jpg"
  vote_average: number;
};

export type TmdbMovieDetail = {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null; // e.g. "/backdrop123.jpg"
  runtime: number | null;     // in minutes
  genres: { id: number; name: string }[];
  vote_average: number;
  tagline: string;
};

export type TmdbCastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;              // 0 = top billed
};

// ------------------------------------------------------------
// API FUNCTIONS
// ------------------------------------------------------------

// Search for movies by title. Returns up to 20 results.
// TMDB ranks results by relevance, so the first result
// is usually the best match.
export async function searchMovies(query: string): Promise<TmdbSearchResult[]> {
  const params = new URLSearchParams({
    query,
    include_adult: "false",
    language: "en-US",
    page: "1",
  });

  const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`TMDB search failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.results;
}

// Get full details for a specific movie by its TMDB ID.
export async function getMovieDetail(tmdbId: number): Promise<TmdbMovieDetail> {
  const response = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?language=en-US`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`TMDB movie detail failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Get the cast for a specific movie. Returns top 5 billed.
export async function getMovieCast(tmdbId: number): Promise<TmdbCastMember[]> {
  const response = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/credits?language=en-US`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`TMDB credits failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  // Return only top 5 billed cast members (sorted by "order")
  return data.cast
    .sort((a: TmdbCastMember, b: TmdbCastMember) => a.order - b.order)
    .slice(0, 5);
}

// Helper: build a full poster image URL from TMDB's partial path.
// TMDB stores poster paths like "/abc123.jpg" — you need to
// prepend their image CDN URL to make it a real link.
// w500 = 500px wide, a good balance of quality and file size.
export function getPosterUrl(posterPath: string | null): string | null {
  if (!posterPath) return null;
  return `https://image.tmdb.org/t/p/w500${posterPath}`;
}

// Backdrop images are wider (16:9). w1280 gives good quality
// without being excessively large.
export function getBackdropUrl(backdropPath: string | null): string | null {
  if (!backdropPath) return null;
  return `https://image.tmdb.org/t/p/w1280${backdropPath}`;
}

// Get external IDs for a movie (IMDb, Wikidata, etc.)
export async function getMovieExternalIds(tmdbId: number): Promise<{ imdb_id: string | null }> {
  const response = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/external_ids`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    // Non-critical — return empty rather than crashing
    return { imdb_id: null };
  }

  return response.json();
}

// ============================================================
// CACHING
// Before calling TMDB, check if we already have the data
// in our database. If the cache is fresh (less than 7 days old),
// use it. Otherwise, fetch from TMDB and update the cache.
// ============================================================

import { db } from "@/db";
import { tmdbCache } from "@/db/schema";
import { eq } from "drizzle-orm";

const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Get movie detail + cast, with caching.
// This is what the rest of the app should call instead of
// getMovieDetail and getMovieCast directly.
export async function getCachedMovieData(tmdbId: number) {
  // Step 1: Check the cache
  const cached = await db
    .select()
    .from(tmdbCache)
    .where(eq(tmdbCache.tmdbId, tmdbId))
    .limit(1);

  if (cached.length > 0) {
    const age = Date.now() - cached[0].fetchedAt.getTime();
    if (age < CACHE_MAX_AGE_MS) {
      // Cache hit — data is fresh enough, return it
      return JSON.parse(cached[0].payloadJson);
    }
  }

  // Step 2: Cache miss or stale — fetch from TMDB
  const [detail, cast, externalIds] = await Promise.all([
    getMovieDetail(tmdbId),
    getMovieCast(tmdbId),
    getMovieExternalIds(tmdbId),
  ]);

  const payload = {
    tmdbId: detail.id,
    title: detail.title,
    year: detail.release_date ? detail.release_date.substring(0, 4) : null,
    runtime: detail.runtime,
    overview: detail.overview,
    tagline: detail.tagline,
    genres: detail.genres.map((g) => g.name),
    rating: detail.vote_average,
    posterUrl: getPosterUrl(detail.poster_path),
    backdropUrl: getBackdropUrl(detail.backdrop_path),
    cast: cast.map((c) => ({
      name: c.name,
      character: c.character,
    })),
    imdbId: externalIds.imdb_id ?? null,
  };

  // Step 3: Save to cache (insert or update if already exists)
  await db
    .insert(tmdbCache)
    .values({
      tmdbId,
      payloadJson: JSON.stringify(payload),
      fetchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: tmdbCache.tmdbId,
      set: {
        payloadJson: JSON.stringify(payload),
        fetchedAt: new Date(),
      },
    });

  return payload;
}