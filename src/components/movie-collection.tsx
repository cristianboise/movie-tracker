"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Film, Search, Tv } from "lucide-react";
import { PlatformChips } from "@/components/platform-chips";
import { filterAndSort } from "@/lib/library";
import { formatRuntime } from "@/lib/format";
import { ownershipLabel } from "@/lib/ownership";
import type { SortOption, TypeFilter, ViewMode } from "@/lib/library";
import { getPosterUrl, type MediaType, type PosterSize } from "@/lib/tmdb-mappers";

// ============================================================
// TYPES
// ============================================================

type Platform = {
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

// ============================================================
// POSTER
// Picks the smallest TMDB image that still looks sharp, so a
// phone on cellular doesn't download 500px posters for thumbnails.
// ============================================================

function Poster({
  movie,
  size,
  textClass,
  className = "",
  priority = false,
}: {
  movie: Movie;
  size: PosterSize;
  textClass: string;
  className?: string;
  // Load eagerly: for posters visible without scrolling
  priority?: boolean;
}) {
  const url = getPosterUrl(movie.posterPath, size);
  if (!url) {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center bg-muted p-1.5 text-center text-muted-foreground ${textClass}`}
      >
        {movie.title}
      </div>
    );
  }
  return (
    <Image
      src={url}
      alt={movie.title}
      fill
      sizes="(max-width: 768px) 50vw, 20vw"
      priority={priority}
      className={`object-cover ${className}`}
    />
  );
}

function TvBadge() {
  return (
    <span
      className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white"
      title="TV show"
    >
      <Tv className="h-3 w-3" aria-hidden />
      <span className="sr-only">TV show</span>
    </span>
  );
}

// "3 of 5 seasons" / "Complete series" under a TV show
function SeasonSummary({ movie }: { movie: Movie }) {
  if (movie.mediaType !== "tv") return null;
  const label = ownershipLabel(movie.platforms, movie.totalSeasons);
  if (!label) return null;
  return <p className="mt-1 text-xs text-muted-foreground">{label}</p>;
}

// ============================================================
// COMPONENT
// ============================================================

export function MovieCollection({
  onMovieClick,
  refreshKey,
  search,
  sortBy,
  typeFilter,
  platformFilter,
  viewMode,
  onMoviesLoaded,
  onAddWithQuery,
}: {
  onMovieClick: (movie: Movie) => void;
  refreshKey: number;
  search: string;
  sortBy: SortOption;
  typeFilter: TypeFilter;
  platformFilter: string | null;
  viewMode: ViewMode;
  onMoviesLoaded: (movies: Movie[]) => void;
  onAddWithQuery?: (query: string) => void;
}) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);
      try {
        const response = await fetch("/api/movies");
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        const data = await response.json();
        setMovies(data.movies);
        onMoviesLoaded(data.movies);
        setLoadError(false);
      } catch (error) {
        console.error("Failed to fetch movies:", error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchMovies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const sorted = filterAndSort(movies, { search, typeFilter, platformFilter, sortBy });

  // Skeleton loading
  if (loading) {
    if (viewMode === "list") {
      return (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-3 rounded-lg p-2">
              <div className="h-16 w-11 shrink-0 rounded bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded bg-muted" />
                <div className="h-2 w-1/5 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className={`mt-6 grid gap-x-3 gap-y-6 ${
        viewMode === "compact"
          ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8"
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      }`}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="w-full rounded-lg bg-muted" style={{ aspectRatio: "2/3" }} />
            {viewMode === "grid" && <div className="mt-2 h-3 w-3/4 rounded bg-muted" />}
          </div>
        ))}
      </div>
    );
  }

  if (loadError && movies.length === 0) {
    return (
      <div className="mt-24 flex flex-col items-center gap-3 text-center" role="alert">
        <p className="font-medium">Couldn&rsquo;t load your library</p>
        <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-1 min-h-11 rounded-lg border px-4 text-sm font-medium hover:bg-accent"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (sorted.length === 0) {
    if (movies.length === 0) {
      return (
        <div className="mt-24 flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-muted p-6">
            <Film className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-medium">Your collection is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap <span className="font-semibold">+</span> to add your first movie or show
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="mt-24 flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-muted p-5">
          <Search className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-muted-foreground">Nothing matches your search or filters</p>
        {search && onAddWithQuery && (
          <button
            onClick={() => onAddWithQuery(search)}
            className="mt-1 min-h-11 text-sm font-medium text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
          >
            Not in your library? Add &ldquo;{search}&rdquo;
          </button>
        )}
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────
  if (viewMode === "list") {
    return (
      <div className="mt-3 divide-y divide-border">
        {sorted.map((movie, index) => (
          <button
            key={movie.id}
            onClick={() => onMovieClick(movie)}
            className="flex min-h-[4.5rem] w-full items-start gap-3 px-1 py-2.5 text-left transition-colors hover:bg-accent/50 active:bg-accent/50"
          >
            <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded">
              <Poster movie={movie} size="w185" textClass="text-[9px]" priority={index < 8} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{movie.title}</p>
              <p className="text-xs text-muted-foreground">
                {movie.mediaType === "tv" && "TV · "}
                {movie.year}
                {formatRuntime(movie.mediaType, movie.runtime)
                  ? ` · ${formatRuntime(movie.mediaType, movie.runtime)}`
                  : ""}
              </p>
              <PlatformChips platforms={movie.platforms} className="mt-1" />
              <SeasonSummary movie={movie} />
            </div>
          </button>
        ))}
      </div>
    );
  }

  // ── COMPACT VIEW ───────────────────────────────────────────
  if (viewMode === "compact") {
    return (
      <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">
        {sorted.map((movie, index) => (
          <button
            key={movie.id}
            onClick={() => onMovieClick(movie)}
            aria-label={movie.title}
            className="group flex flex-col text-left"
          >
            <div
              className="relative w-full overflow-hidden rounded-md shadow-sm"
              style={{ aspectRatio: "2/3" }}
            >
              <Poster
                movie={movie}
                size="w185"
                textClass="text-[9px]"
                priority={index < 12}
                className="transition-transform group-hover:scale-105"
              />
              {movie.mediaType === "tv" && <TvBadge />}
              {/* Hover overlay — only on devices that can hover */}
              <div className="pointer-events-none absolute inset-0 hidden flex-col justify-end bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:flex">
                <p className="line-clamp-2 p-1.5 text-[9px] font-medium leading-tight text-white">
                  {movie.title}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  // ── GRID VIEW (default / large) ────────────────────────────
  return (
    <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {sorted.map((movie, index) => (
        <button
          key={movie.id}
          onClick={() => onMovieClick(movie)}
          className="group flex h-full flex-col text-left"
        >
          <div
            className="relative w-full flex-shrink-0 overflow-hidden rounded-lg shadow-md"
            style={{ aspectRatio: "2/3" }}
          >
            <Poster
              movie={movie}
              size="w342"
              textClass="text-xs"
              priority={index < 6}
              className="transition-transform group-hover:scale-105"
            />
            {movie.mediaType === "tv" && <TvBadge />}
            {/* Hover overlay — only on devices that can hover */}
            <div className="pointer-events-none absolute inset-0 hidden flex-col justify-end bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:flex">
              <p className="line-clamp-2 p-2 text-xs font-medium leading-tight text-white">
                {movie.title}
              </p>
            </div>
          </div>
          <p className="mt-1.5 w-full truncate text-sm font-medium">{movie.title}</p>
          <PlatformChips platforms={movie.platforms} className="mt-0.5" />
          <SeasonSummary movie={movie} />
        </button>
      ))}
    </div>
  );
}
