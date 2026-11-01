import type { MediaType } from "@/lib/tmdb-mappers";

// One library entry as the screens use it (what GET /api/movies returns)

export type Platform = {
  id: number;
  platform: string;
  seasonNumber: number | null;
  resolution: string | null;
  notes: string | null;
};

export type Movie = {
  id: number;
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  year: number | null;
  runtime: number | null;
  posterPath: string | null;
  notes: string | null;
  addedAt: string;
  genres: string[];
  cast: string[];
  director: string | null;
  creators: string[];
  totalSeasons: number | null;
  platforms: Platform[];
};
