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

type GridDensity = "compact" | "comfortable" | "list";

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
  const [density, setDensity] = useState<GridDensity>("comfortable");

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
      <div className="mt-4 space-y-4">
        {/* Skeleton search bar + sort */}
        <div className="flex items-center gap-3">
          <div className="h-12 flex-1 animate-pulse rounded-lg bg-muted" />
          <div className="h-12 w-24 animate-pulse rounded-lg bg-muted" />
        </div>
        {/* Skeleton filter pills */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
        {/* Skeleton poster grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="w-full animate-pulse rounded-lg bg-muted" style={{ aspectRatio: "2/3" }} />
              <div className="mt-1.5 h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Sticky search/filter bar */}
      <div className="sticky top-0 z-10 -mx-4 space-y-3 bg-background/95 px-4 pb-3 pt-2 backdrop-blur-sm">
      {/* Search bar + density toggle + sort dropdown */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search your collection..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {/* Density toggle */}
        <div className="flex rounded-lg border border-input">
          {/* Compact grid */}
          <button
            onClick={() => setDensity("compact")}
            className={`p-2.5 transition-colors ${density === "compact" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="Compact grid"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="0" width="4.5" height="4.5" rx="1" /><rect x="5.75" y="0" width="4.5" height="4.5" rx="1" /><rect x="11.5" y="0" width="4.5" height="4.5" rx="1" /><rect x="0" y="5.75" width="4.5" height="4.5" rx="1" /><rect x="5.75" y="5.75" width="4.5" height="4.5" rx="1" /><rect x="11.5" y="5.75" width="4.5" height="4.5" rx="1" /><rect x="0" y="11.5" width="4.5" height="4.5" rx="1" /><rect x="5.75" y="11.5" width="4.5" height="4.5" rx="1" /><rect x="11.5" y="11.5" width="4.5" height="4.5" rx="1" /></svg>
          </button>
          {/* Comfortable grid */}
          <button
            onClick={() => setDensity("comfortable")}
            className={`border-x border-input p-2.5 transition-colors ${density === "comfortable" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="Comfortable grid"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="0" width="7" height="7" rx="1.5" /><rect x="9" y="0" width="7" height="7" rx="1.5" /><rect x="0" y="9" width="7" height="7" rx="1.5" /><rect x="9" y="9" width="7" height="7" rx="1.5" /></svg>
          </button>
          {/* List view */}
          <button
            onClick={() => setDensity("list")}
            className={`p-2.5 transition-colors ${density === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="List view"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="0.5" width="16" height="3" rx="1" /><rect x="0" y="6.5" width="16" height="3" rx="1" /><rect x="0" y="12.5" width="16" height="3" rx="1" /></svg>
          </button>
        </div>
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
      </div>{/* end sticky wrapper */}

      {/* Collection stats */}
      {movies.length > 0 && (
        <div className="flex items-baseline gap-3 text-sm text-muted-foreground">
          <span className="text-lg font-semibold text-foreground">
            {filtered.length}{filtered.length !== movies.length ? ` of ${movies.length}` : ""} {movies.length === 1 ? "Movie" : "Movies"}
          </span>
          {(() => {
            const totalMinutes = filtered.reduce((sum, m) => sum + (m.runtime ?? 0), 0);
            if (totalMinutes === 0) return null;
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            return (
              <span className="text-xs">
                {hours > 0 ? `${hours}h ` : ""}{mins}m total runtime
              </span>
            );
          })()}
        </div>
      )}

      {/* Movie grid */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {movies.length === 0 ? (
            <>
              {/* Film reel / clapperboard icon */}
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
                <line x1="17" y1="17" x2="22" y2="17" />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-foreground">No movies yet</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Your collection is empty. Tap &ldquo;Add Movie&rdquo; above to start tracking your digital library.
              </p>
            </>
          ) : (
            <>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3 className="mt-3 text-base font-medium text-foreground">No matches</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different search or filter.
              </p>
            </>
          )}
        </div>
      ) : density === "list" ? (
          /* ── List view ── */
          <div className="divide-y divide-border">
            {sorted.map((movie) => (
              <button
                key={movie.id}
                onClick={() => onMovieClick(movie)}
                className="group flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-accent/50"
              >
                <div className="h-16 w-11 shrink-0 overflow-hidden rounded">
                  {movie.posterUrl ? (
                    <img src={movie.posterUrl} alt={movie.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-[8px] text-muted-foreground">
                      {movie.title.substring(0, 4)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{movie.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {movie.year}{movie.runtime ? ` · ${movie.runtime} min` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1">
                  {movie.platforms.map((p) => {
                    const config = getPlatform(p.platform);
                    return (
                      <span
                        key={p.id}
                        className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          config ? `${config.bgClass} ${config.textClass}` : "bg-gray-500 text-white"
                        }`}
                      >
                        <PlatformLogo platformId={p.platform} className="h-2.5 w-2.5 shrink-0" />
                        {config?.label || p.platform}
                      </span>
                    );
                  })}
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* ── Grid view (compact or comfortable) ── */
          <div className={
            density === "compact"
              ? "grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8"
              : "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          }>
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
                  {/* Hover overlay */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-sm font-semibold leading-tight text-white drop-shadow-md">
                      {movie.title}
                    </p>
                    {movie.year && (
                      <p className="text-xs text-white/70">{movie.year}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {movie.platforms.map((p) => {
                        const config = getPlatform(p.platform);
                        return (
                          <span
                            key={p.id}
                            className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium ${
                              config ? `${config.bgClass} ${config.textClass}` : "bg-gray-500 text-white"
                            }`}
                          >
                            <PlatformLogo platformId={p.platform} className="h-2.5 w-2.5 shrink-0" />
                            {config?.label || p.platform}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {density === "comfortable" && (
                  <>
                    <p className="mt-1.5 truncate text-sm font-medium group-hover:hidden">
                      {movie.title}
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-0.5 group-hover:hidden">
                      {movie.platforms.map((p) => {
                        const config = getPlatform(p.platform);
                        return (
                          <span
                            key={p.id}
                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              config ? `${config.bgClass} ${config.textClass}` : "bg-gray-500 text-white"
                            }`}
                          >
                            {config?.label || p.platform}
                          </span>
                        );
                      })}
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        )
      }
    </div>
  );
}
