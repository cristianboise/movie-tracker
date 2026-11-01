import type { Movie, Platform } from "@/lib/movie-types";
import type { MediaType } from "@/lib/tmdb-mappers";

// Pure helpers for changing the on-screen copy of the library right after the
// server confirms an add, edit or delete. A background refresh follows and
// replaces these with the server's own data.

export function addMovie(movies: Movie[], movie: Movie): Movie[] {
  // Never list the same entry twice (e.g. a refresh landing first)
  return [movie, ...movies.filter((m) => m.id !== movie.id)];
}

export function patchMovie(movies: Movie[], id: number, patch: Partial<Movie>): Movie[] {
  return movies.map((m) => (m.id === id ? { ...m, ...patch } : m));
}

export function removeMovie(movies: Movie[], id: number): Movie[] {
  return movies.filter((m) => m.id !== id);
}

type EntryLike = {
  platform: string;
  resolution?: string | null;
  seasonNumber?: number | null;
  notes?: string | null;
};

// Platform rows from what the API echoes back. The server hasn't told us the
// rows' database ids, so they get temporary negative ones until the refresh.
export function entriesToRows(entries: EntryLike[]): Platform[] {
  return entries.map((e, i) => ({
    id: -(i + 1),
    platform: e.platform,
    seasonNumber: e.seasonNumber ?? null,
    resolution: e.resolution || null,
    notes: e.notes ?? null,
  }));
}

// A library entry for something just added, built from what we already know.
// Fields the server only fills in later (cast, genres, ...) start empty.
export function buildAddedMovie(input: {
  id: number;
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  year: number | null;
  runtime: number | null;
  posterPath: string | null;
  notes: string | null;
  totalSeasons: number | null;
  platforms: EntryLike[];
  now?: Date;
}): Movie {
  return {
    id: input.id,
    mediaType: input.mediaType,
    tmdbId: input.tmdbId,
    title: input.title,
    year: input.year,
    runtime: input.runtime,
    posterPath: input.posterPath,
    notes: input.notes,
    addedAt: (input.now ?? new Date()).toISOString(),
    genres: [],
    cast: [],
    director: null,
    creators: [],
    totalSeasons: input.totalSeasons,
    platforms: entriesToRows(input.platforms),
  };
}
