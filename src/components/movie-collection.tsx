"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// ============================================================
// TYPES
// ============================================================

type Platform = {
  id: number;
  platform: string;
  resolution: string | null;
  notes: string | null;
};

type Movie = {
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

const PLATFORM_LABELS: Record<string, string> = {
  apple: "Apple",
  fandango: "Fandango",
  amazon: "Amazon",
  movies_anywhere: "Movies Anywhere",
};

const PLATFORM_COLORS: Record<string, string> = {
  apple: "bg-gray-800 text-white",
  fandango: "bg-green-700 text-white",
  amazon: "bg-blue-700 text-white",
  movies_anywhere: "bg-purple-700 text-white",
};

// ============================================================
// COMPONENT
// ============================================================

export function MovieCollection({
  onMovieClick,
  refreshKey,
}: {
  onMovieClick: (movie: Movie) => void;
  refreshKey: number;
}) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);

  // Fetch movies whenever the component mounts or refreshKey changes.
  // refreshKey is a number that the parent increments when a new
  // movie is added, which triggers a re-fetch.
  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);
      try {
        const response = await fetch("/api/movies");
        const data = await response.json();
        setMovies(data.movies);
      } catch (error) {
        console.error("Failed to fetch movies:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMovies();
  }, [refreshKey]);

  // Filter movies by search text and platform
  const filtered = movies.filter((movie) => {
    const matchesSearch =
      !search ||
      movie.title.toLowerCase().includes(search.toLowerCase());

    const matchesPlatform =
      !platformFilter ||
      movie.platforms.some((p) => p.platform === platformFilter);

    return matchesSearch && matchesPlatform;
  });

  if (loading) {
    return (
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Loading...
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Search bar */}
      <Input
        placeholder="Search your collection..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Platform filter tabs */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={platformFilter === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setPlatformFilter(null)}
        >
          All ({movies.length})
        </Badge>
        {Object.entries(PLATFORM_LABELS).map(([id, label]) => {
          const count = movies.filter((m) =>
            m.platforms.some((p) => p.platform === id)
          ).length;
          if (count === 0) return null;
          return (
            <Badge
              key={id}
              variant={platformFilter === id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() =>
                setPlatformFilter(platformFilter === id ? null : id)
              }
            >
              {label} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Movie grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          {movies.length === 0
            ? "Your collection is empty. Add your first movie!"
            : "No movies match your filters."}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((movie) => (
            <button
              key={movie.id}
              onClick={() => onMovieClick(movie)}
              className="group text-left"
            >
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full rounded-lg shadow-md transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-muted p-2 text-center text-xs text-muted-foreground">
                  {movie.title}
                </div>
              )}
              <p className="mt-1 truncate text-xs font-medium">
                {movie.title}
              </p>
              <div className="mt-0.5 flex flex-wrap gap-0.5">
                {movie.platforms.map((p) => (
                  <span
                    key={p.id}
                    className={`inline-block rounded px-1 text-[10px] ${
                      PLATFORM_COLORS[p.platform] || "bg-gray-500 text-white"
                    }`}
                  >
                    {PLATFORM_LABELS[p.platform] || p.platform}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}