"use client";

import { useState, useCallback } from "react";
import { AddMovieDialog } from "@/components/add-movie-dialog";
import { MovieCollection } from "@/components/movie-collection";
import type { Movie } from "@/components/movie-collection";
import { MovieDetailDialog } from "@/components/movie-detail-dialog";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { FilterSortMenu } from "@/components/filter-sort-menu";
import type { SortOption, ViewMode } from "@/components/filter-sort-menu";
import { PLATFORMS } from "@/lib/platforms";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id?: string;
};

export function SignedInHome({ user }: { user: User }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // Lifted search/filter/sort/view state
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("title-asc");
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [allMovies, setAllMovies] = useState<Movie[]>([]);

  // Controlled add dialog state (for pre-filling from empty search prompt)
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogQuery, setAddDialogQuery] = useState("");

  // Stable callback for MovieCollection to report loaded movies
  const handleMoviesLoaded = useCallback((movies: Movie[]) => {
    setAllMovies(movies);
  }, []);

  function handleExportCSV() {
    if (allMovies.length === 0) return;

    function escapeCSV(value: string | number | null | undefined): string {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    const headers = ["Title", "Year", "Runtime (min)", "Platforms", "Notes", "Added"];

    const rows = allMovies.map((movie) => {
      const platforms = movie.platforms
        .map((p) => {
          const label = p.platform
            .replace("_", " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          return p.resolution ? `${label} ${p.resolution}` : label;
        })
        .join("; ");

      const added = new Date(movie.addedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      return [
        escapeCSV(movie.title),
        escapeCSV(movie.year),
        escapeCSV(movie.runtime),
        escapeCSV(platforms),
        escapeCSV(movie.notes),
        escapeCSV(added),
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `movie-collection-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Compute platform counts for the filter menu
  const platformCounts: Record<string, number> = {};
  for (const platform of PLATFORMS) {
    platformCounts[platform.id] = allMovies.filter((m) =>
      m.platforms.some((p) => p.platform === platform.id)
    ).length;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-3">

        {/* App identity — scrolls away, not sticky */}
        <div className="flex items-center gap-2.5 pb-3 pt-2">
          {/* Logo placeholder — replace with <Image> when ready */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4.5 w-4.5 text-background"
              style={{ color: "var(--background)" }}
            >
              {/* Film frame icon */}
              <rect x="2" y="2" width="20" height="20" rx="2.5" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="8" x2="7" y2="8" />
              <line x1="17" y1="8" x2="22" y2="8" />
              <line x1="2" y1="16" x2="7" y2="16" />
              <line x1="17" y1="16" x2="22" y2="16" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Digital Movie Library
          </span>
        </div>

        {/* Single-row controls: search + filter + add + menu */}
        <div className="sticky top-0 z-30 -mx-4 bg-background/95 px-4 pb-2 pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center gap-2">
            {/* Hamburger menu */}
            <HamburgerMenu user={user} onExportCSV={handleExportCSV} />

            {/* Filter/sort/view dropdown */}
            <FilterSortMenu
              sortBy={sortBy}
              onSortChange={setSortBy}
              platformFilter={platformFilter}
              onPlatformFilterChange={setPlatformFilter}
              platformCounts={platformCounts}
              totalCount={allMovies.length}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {/* Add movie button — compact icon */}
            <AddMovieDialog
              onMovieAdded={() => setRefreshKey((k) => k + 1)}
              existingTmdbIds={allMovies.map((m) => m.tmdbId)}
              controlledOpen={addDialogOpen}
              onControlledOpenChange={(open) => {
                setAddDialogOpen(open);
                if (!open) setAddDialogQuery("");
              }}
              initialQuery={addDialogQuery}
            />

            {/* Search input — takes remaining space */}
            <div className="relative flex-1">
              {/* Search icon inside input */}
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search your library"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {/* Clear button — only visible when search has text */}
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Movie grid/list */}
        <MovieCollection
          refreshKey={refreshKey}
          onMovieClick={(movie) => setSelectedMovie(movie)}
          search={search}
          sortBy={sortBy}
          platformFilter={platformFilter}
          viewMode={viewMode}
          onMoviesLoaded={handleMoviesLoaded}
          onAddWithQuery={(q) => {
            setAddDialogQuery(q);
            setAddDialogOpen(true);
          }}
        />

        <MovieDetailDialog
          movie={selectedMovie}
          open={selectedMovie !== null}
          onClose={() => setSelectedMovie(null)}
          onMovieChanged={() => {
            setRefreshKey((k) => k + 1);
            setSelectedMovie(null);
          }}
        />
      </div>
    </main>
  );
}
