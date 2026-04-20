"use client";

import { useState, useEffect } from "react";
import { PLATFORMS, getPlatform } from "@/lib/platforms";
import { PlatformLogo } from "@/components/platform-logos";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

type SortOption = "title-asc" | "title-desc" | "added" | "year-desc" | "year-asc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "title-asc", label: "A–Z" },
  { value: "title-desc", label: "Z–A" },
  { value: "added", label: "Recently Added" },
  { value: "year-desc", label: "Release Date ↓" },
  { value: "year-asc", label: "Release Date ↑" },
];

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
  const [sortBy, setSortBy] = useState<SortOption>("title-asc");

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "A–Z";

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
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Loading...
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Search bar + sort dropdown */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search your collection..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-input px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors">
              {currentSortLabel}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className="flex items-center justify-between"
              >
                <span>{option.label}</span>
                {sortBy === option.value && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
