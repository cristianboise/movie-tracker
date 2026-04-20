"use client";

import { useState, useEffect } from "react";
import { PLATFORMS, getPlatform } from "@/lib/platforms";
import { PlatformLogo } from "@/components/platform-logos";

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

type SortOption = "title" | "added" | "year";

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
  const [sortBy, setSortBy] = useState<SortOption>("title");

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
      case "title":
        return a.title.localeCompare(b.title);
      case "added":
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      case "year":
        return (b.year ?? 0) - (a.year ?? 0);
      default:
        return 0;
    }
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
      <input
        type="text"
        placeholder="Search your collection..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {/* Sort controls */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Sort:</span>
        {(
          [
            { value: "title", label: "A–Z" },
            { value: "added", label: "Recent" },
            { value: "year", label: "Year" },
          ] as { value: SortOption; label: string }[]
        ).map((option) => (
          <button
            key={option.value}
            onClick={() => setSortBy(option.value)}
            className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
              sortBy === option.value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Platform filter pills — now with logos */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setPlatformFilter(null)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            platformFilter === null
              ? "bg-foreground text-background"
              : "border border-input text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({movies.length})
        </button>
        {PLATFORMS.map((platform) => {
          const count = movies.filter((m) =>
            m.platforms.some((p) => p.platform === platform.id)
          ).length;
          if (count === 0) return null;
          const isActive = platformFilter === platform.id;
          return (
            <button
              key={platform.id}
              onClick={() =>
                setPlatformFilter(
                  platformFilter === platform.id ? null : platform.id
                )
              }
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                isActive
                  ? `${platform.bgClass} ${platform.textClass}`
                  : `border ${platform.borderClass} text-foreground opacity-60 hover:opacity-100`
              }`}
            >
              <PlatformLogo
                platformId={platform.id}
                className="h-4 w-4 shrink-0"
              />
              {platform.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Movie grid */}
      {sorted.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          {movies.length === 0
            ? "Your collection is empty. Add your first movie!"
            : "No movies match your filters."}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {sorted.map((movie) => (
            <button
              key={movie.id}
              onClick={() => onMovieClick(movie)}
              className="group text-left"
            >
              <div className="aspect-[2/3] w-full overflow-hidden rounded-lg shadow-md">
                {movie.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted p-2 text-center text-xs text-muted-foreground">
                    {movie.title}
                  </div>
                )}
              </div>
              <p className="mt-1 truncate text-sm font-medium">
                {movie.title}
              </p>
              {/* Grid badges — keep text only, logos are too small here */}
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
