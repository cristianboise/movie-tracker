// ============================================================
// TMDB MAPPERS
// Pure functions that turn raw TMDB responses into the shapes the
// rest of the app uses. No network or database access in here, so
// everything in this file is easy to unit test.
// ============================================================

export const MEDIA_TYPES = ["movie", "tv"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

// ------------------------------------------------------------
// IMAGES
// We store only TMDB's partial path ("/abc123.jpg") and pick the
// size when rendering, so a small thumbnail doesn't download a
// 500px poster.
// ------------------------------------------------------------

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export type PosterSize = "w185" | "w342" | "w500";

export function getPosterUrl(
  posterPath: string | null | undefined,
  size: PosterSize = "w500"
): string | null {
  if (!posterPath) return null;
  return `${IMAGE_BASE_URL}/${size}${posterPath}`;
}

// Backdrop images are wider (16:9). w1280 gives good quality
// without being excessively large.
export function getBackdropUrl(backdropPath: string | null | undefined): string | null {
  if (!backdropPath) return null;
  return `${IMAGE_BASE_URL}/w1280${backdropPath}`;
}

// ------------------------------------------------------------
// RAW TMDB SHAPES (only the fields we read)
// ------------------------------------------------------------

type RawGenre = { id: number; name: string };

type RawCredits = {
  cast?: { id: number; name: string; character: string; order: number }[];
  crew?: { job: string; name: string }[];
};

type RawCommon = {
  id: number;
  overview: string;
  tagline?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: RawGenre[];
  vote_average: number;
  credits?: RawCredits;
  external_ids?: { imdb_id?: string | null };
};

export type RawMovie = RawCommon & {
  title: string;
  release_date?: string;
  runtime: number | null;
};

export type RawTv = RawCommon & {
  name: string;
  first_air_date?: string;
  // Deprecated by TMDB and often empty, so we fall back to the last episode
  episode_run_time?: number[];
  last_episode_to_air?: { runtime: number | null } | null;
  status?: string;
  created_by?: { name: string }[];
  seasons?: {
    season_number: number;
    name: string;
    episode_count: number;
    air_date: string | null;
  }[];
};

export type RawSearchResult = {
  id: number;
  media_type?: string; // present on /search/multi
  title?: string; // movies
  release_date?: string;
  name?: string; // tv
  first_air_date?: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
};

// ------------------------------------------------------------
// APP SHAPES
// This is what we cache and what gets stored on each library row.
// ------------------------------------------------------------

type CommonMeta = {
  tmdbId: number;
  title: string;
  year: string | null;
  overview: string;
  tagline: string;
  genres: string[];
  rating: number;
  posterPath: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  // Top 5 billed
  cast: { name: string; character: string }[];
  imdbId: string | null;
  // Movie runtime, or a typical episode's runtime for TV
  runtime: number | null;
};

export type MovieMeta = CommonMeta & {
  mediaType: "movie";
  director: string | null;
};

export type TvSeason = {
  seasonNumber: number; // 0 is TMDB's "Specials"
  name: string;
  episodeCount: number;
  airYear: string | null;
};

export type TvMeta = CommonMeta & {
  mediaType: "tv";
  creators: string[];
  status: string | null;
  seasons: TvSeason[];
};

export type TitleMeta = MovieMeta | TvMeta;

export type SearchResult = {
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  year: string | null;
  overview: string;
  posterPath: string | null;
  posterUrl: string | null;
  rating: number;
};

// ------------------------------------------------------------
// MAPPING
// ------------------------------------------------------------

function yearOf(date: string | null | undefined): string | null {
  return date ? date.substring(0, 4) : null;
}

function mapCommon(raw: RawCommon): Omit<CommonMeta, "title" | "year" | "runtime"> {
  const cast = [...(raw.credits?.cast ?? [])]
    .sort((a, b) => a.order - b.order)
    .slice(0, 5)
    .map((c) => ({ name: c.name, character: c.character }));

  return {
    tmdbId: raw.id,
    overview: raw.overview,
    tagline: raw.tagline ?? "",
    genres: raw.genres.map((g) => g.name),
    rating: raw.vote_average,
    posterPath: raw.poster_path,
    posterUrl: getPosterUrl(raw.poster_path),
    backdropUrl: getBackdropUrl(raw.backdrop_path),
    cast,
    imdbId: raw.external_ids?.imdb_id ?? null,
  };
}

export function mapMovie(raw: RawMovie): MovieMeta {
  return {
    ...mapCommon(raw),
    mediaType: "movie",
    title: raw.title,
    year: yearOf(raw.release_date),
    runtime: raw.runtime,
    director: raw.credits?.crew?.find((c) => c.job === "Director")?.name ?? null,
  };
}

export function mapTv(raw: RawTv): TvMeta {
  return {
    ...mapCommon(raw),
    mediaType: "tv",
    title: raw.name,
    year: yearOf(raw.first_air_date),
    runtime: raw.episode_run_time?.[0] ?? raw.last_episode_to_air?.runtime ?? null,
    creators: (raw.created_by ?? []).map((c) => c.name),
    status: raw.status ?? null,
    seasons: (raw.seasons ?? []).map((s) => ({
      seasonNumber: s.season_number,
      name: s.name,
      episodeCount: s.episode_count,
      airYear: yearOf(s.air_date),
    })),
  };
}

export function mapTitle(mediaType: MediaType, raw: RawMovie | RawTv): TitleMeta {
  return mediaType === "movie" ? mapMovie(raw as RawMovie) : mapTv(raw as RawTv);
}

// `fallbackType` is used for /search/movie and /search/tv, whose results
// don't say what they are. /search/multi results carry their own media_type.
export function mapSearchResult(
  raw: RawSearchResult,
  fallbackType?: MediaType
): SearchResult | null {
  const mediaType = raw.media_type ?? fallbackType;
  if (mediaType !== "movie" && mediaType !== "tv") return null; // e.g. "person"

  return {
    mediaType,
    tmdbId: raw.id,
    title: (mediaType === "movie" ? raw.title : raw.name) ?? "",
    year: yearOf(mediaType === "movie" ? raw.release_date : raw.first_air_date),
    overview: raw.overview,
    posterPath: raw.poster_path,
    posterUrl: getPosterUrl(raw.poster_path),
    rating: raw.vote_average,
  };
}
