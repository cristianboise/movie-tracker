"use client";

import { useState, useEffect } from "react";
import { getPlatform } from "@/lib/platforms";
import { PlatformLogo } from "@/components/platform-logos";
import type { SortOption, ViewMode } from "@/components/filter-sort-menu";

// ============================================================
// TYPES
// ============================================================

type Platform = {
  id: number;
  platform: string;
  resolution: string | null;
  notes: string | null;
};

export type Movie = {
  id: number;
  tmdbId: number;
  title: string;
  year: number | null;
  runtime: number | null;
  posterUrl: string | null;
  notes: string | null;
  addedAt: string;
  platforms: Platform[];
};

// ============================================================
// COMPONENT
// ============================================================

export function MovieCollection({
  onMovieClick,
  refreshKey,
  search,
  sortBy,
  platformFilter,
  viewMode,
  onMoviesLoaded,
}: {
  onMovieClick: (movie: Movie) => void;
  refreshKey: number;
  search: string;
  sortBy: SortOption;
  platformFilter: string | null;
  viewMode: ViewMode;
  onMoviesLoaded: (movies: Movie[]) => void;
}) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);
      try {
        const response = await fetch("/api/movies");
        const data = await response.json();
        setMovies(data.movies);
        onMoviesLoaded(data.movies);
      } catch (error) {
        console.error("Failed to fetch movies:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMovies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Filter
  const filtered = movies.filter((movie) => {
    const matchesSearch =
      !search ||
      movie.title.toLowerCase().includes(search.toLowerCase());

    const matchesPlatform =
      !platformFilter ||
      movie.platforms.some((p) => p.platform === platformFilter);

    return matchesSearch && matchesPlatform;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "title-asc":
        return a.title.localeCompare(b.title);
      case "title-desc":
        return b.title.localeCompare(a.title);
      case "added":
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      case "year-desc":
        return (b.year ?? 0) - (a.year ?? 0);
      case "year-asc":
        return (a.year ?? 0) - (b.year ?? 0);
      default:
        return 0;
    }
  });

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

  // Empty state
  if (sorted.length === 0) {
    return (
      <p className="mt-12 text-center text-sm text-muted-foreground">
        {movies.length === 0
          ? "Your collection is empty. Tap + to add your first movie!"
          : "No movies match your filters."}
      </p>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────
  if (viewMode === "list") {
    return (
      <div className="mt-3 divide-y divide-border">
        {sorted.map((movie) => (
          <button
            key={movie.id}
            onClick={() => onMovieClick(movie)}
            className="flex w-full items-start gap-3 px-1 py-2.5 text-left transition-colors hover:bg-accent/50"
          >
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="h-16 w-11 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-muted text-[9px] text-muted-foreground">
                {movie.title.slice(0, 4)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{movie.title}</p>
              <p className="text-xs text-muted-foreground">
                {movie.year}{movie.runtime ? ` \u00B7 ${movie.runtime} min` : ""}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {movie.platforms.map((p) => {
                  const config = getPlatform(p.platform);
                  return (
                    <span
                      key={p.id}
                      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        config
                          ? `${config.bgClass} ${config.textClass}`
                          : "bg-gray-500 text-white"
                      }`}
                    >
                      <PlatformLogo platformId={p.platform} className="h-3 w-3 shrink-0" />
                      {config?.label || p.platform}
                    </span>
                  );
                })}
              </div>
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
        {sorted.map((movie) => (
          <button
            key={movie.id}
            onClick={() => onMovieClick(movie)}
            className="group flex flex-col text-left"
          >
            <div
              className="relative w-full overflow-hidden rounded-md shadow-sm"
              style={{ aspectRatio: "2/3" }}
            >
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted p-1 text-center text-[9px] text-muted-foreground">
                  {movie.title}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  }

  // ── GRID VIEW (default / large) ────────────────────────────
  return (
    <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {sorted.map((movie) => (
        <button
          key={movie.id}
          onClick={() => onMovieClick(movie)}
          className="group flex h-full flex-col text-left"
        >
          <div
            className="relative w-full flex-shrink-0 overflow-hidden rounded-lg shadow-md"
            style={{ aspectRatio: "2/3" }}
          >
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted p-2 text-center text-xs text-muted-foreground">
                {movie.title}
              </div>
            )}
          </div>
          <p className="mt-1.5 truncate text-sm font-medium">
            {movie.title}
          </p>
          {/* Grid badges — text only, logos too small here */}
          <div className="mt-0.5 flex flex-wrap gap-0.5">
            {movie.platforms.map((p) => {
              const config = getPlatform(p.platform);
              return (
                <span
                  key={p.id}
                  className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    config
                      ? `${config.bgClass} ${config.textClass}`
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {config?.label || p.platform}
                </span>
              );
            })}
          </div>
        </button>
      ))}
    </div>
  );
}
