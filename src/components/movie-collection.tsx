"use client";

import { useState, useEffect } from "react";
import { getPlatform } from "@/lib/platforms";
import type { SortOption } from "@/components/filter-sort-menu";

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
  onMoviesLoaded,
}: {
  onMovieClick: (movie: Movie) => void;
  refreshKey: number;
  search: string;
  sortBy: SortOption;
  platformFilter: string | null;
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

  if (loading) {
    return (
      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div
              className="w-full rounded-lg bg-muted"
              style={{ aspectRatio: "2/3" }}
            />
            <div className="mt-2 h-3 w-3/4 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Movie grid */}
      {sorted.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          {movies.length === 0
            ? "Your collection is empty. Tap + to add your first movie!"
            : "No movies match your filters."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
      )}
    </div>
  );
}
