"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getPlatform, sortPlatforms } from "@/lib/platforms";
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
  onAddWithQuery,
}: {
  onMovieClick: (movie: Movie) => void;
  refreshKey: number;
  search: string;
  sortBy: SortOption;
  platformFilter: string | null;
  viewMode: ViewMode;
  onMoviesLoaded: (movies: Movie[]) => void;
  onAddWithQuery?: (query: string) => void;
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

  // Strip leading articles so "The Godfather" sorts under G, not T
  function sortableTitle(title: string) {
    return title.replace(/^(the|a|an)\s+/i, "").trimStart();
  }

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "title-asc":
        return sortableTitle(a.title).localeCompare(sortableTitle(b.title));
      case "title-desc":
        return sortableTitle(b.title).localeCompare(sortableTitle(a.title));
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
    if (movies.length === 0) {
      return (
        <div className="mt-24 flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-muted p-6">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="17" x2="22" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
            </svg>
          </div>
          <div>
            <p className="font-medium">Your collection is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap <span className="font-semibold">+</span> to add your first movie
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="mt-24 flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-muted p-5">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">No movies match your search</p>
        {search && onAddWithQuery && (
          <button
            onClick={() => onAddWithQuery(search)}
            className="mt-1 text-sm font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
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
        {sorted.map((movie) => (
          <button
            key={movie.id}
            onClick={() => onMovieClick(movie)}
            className="flex w-full items-start gap-3 px-1 py-2.5 text-left transition-colors hover:bg-accent/50"
          >
            {movie.posterUrl ? (
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                width={44}
                height={64}
                className="h-16 w-11 shrink-0 rounded object-cover"
                sizes="44px"
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
                {sortPlatforms(movie.platforms).map((p) => {
                  const config = getPlatform(p.platform);
                  return (
                    <span
                      key={p.id}
                      aria-label={config?.label || p.platform}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${
                        config
                          ? `${config.bgClass} ${config.textClass}`
                          : "bg-gray-500 text-white"
                      }`}
                    >
                      <PlatformLogo platformId={p.platform} className="h-3.5 w-3.5 shrink-0" />
                      {p.resolution && <span>{p.resolution}</span>}
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
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 14vw, 12vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted p-1 text-center text-[9px] text-muted-foreground">
                  {movie.title}
                </div>
              )}
              {/* Hover overlay — desktop only */}
              <div className="pointer-events-none absolute inset-0 hidden flex-col justify-end bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:flex">
                <p className="p-1.5 text-[9px] font-medium leading-tight text-white line-clamp-2">
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
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 17vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted p-2 text-center text-xs text-muted-foreground">
                {movie.title}
              </div>
            )}
            {/* Hover overlay — desktop only */}
            <div className="pointer-events-none absolute inset-0 hidden flex-col justify-end bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:flex">
              <p className="p-2 text-xs font-medium leading-tight text-white line-clamp-2">
                {movie.title}
              </p>
            </div>
          </div>
          <p className="mt-1.5 truncate text-sm font-medium">
            {movie.title}
          </p>
          <div className="mt-0.5 flex flex-wrap gap-0.5">
            {sortPlatforms(movie.platforms).map((p) => {
              const config = getPlatform(p.platform);
              return (
                <span
                  key={p.id}
                  aria-label={config?.label || p.platform}
                  className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${
                    config
                      ? `${config.bgClass} ${config.textClass}`
                      : "bg-gray-500 text-white"
                  }`}
                >
                  <PlatformLogo platformId={p.platform} className="h-3.5 w-3.5 shrink-0" />
                  {p.resolution && <span>{p.resolution}</span>}
                </span>
              );
            })}
          </div>
        </button>
      ))}
    </div>
  );
}
