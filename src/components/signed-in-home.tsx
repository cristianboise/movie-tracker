"use client";

import { useState, useEffect } from "react";
import { Library, Menu, Plus, Search, X } from "lucide-react";
import { AddMovieDialog } from "@/components/add-movie-dialog";
import { MovieCollection } from "@/components/movie-collection";
import type { Movie } from "@/lib/movie-types";
import { useLibrary } from "@/hooks/use-library";
import { MovieDetailDialog } from "@/components/movie-detail-dialog";
import { AccountSheet, HamburgerMenu } from "@/components/hamburger-menu";
import { FilterSortMenu } from "@/components/filter-sort-menu";
import { buildCsv } from "@/lib/export-csv";
import { countByType } from "@/lib/library";
import type { SortOption, TypeFilter, ViewMode } from "@/lib/library";
import { PLATFORMS } from "@/lib/platforms";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id?: string;
};

export function SignedInHome({
  user,
  initialMovies,
}: {
  user: User;
  // Loaded on the server with the page; null if that failed
  initialMovies: Movie[] | null;
}) {
  const library = useLibrary(initialMovies);
  const allMovies = library.movies;
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // Lifted search/filter/sort/view state
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("title-asc");
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    const savedSort = localStorage.getItem("sortBy") as SortOption | null;
    const savedView = localStorage.getItem("viewMode") as ViewMode | null;
    // Read after mount (not in useState) so server and client render the same
    // HTML. Setting state here is intentional.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (savedSort) setSortBy(savedSort);
    if (savedView) setViewMode(savedView);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => { localStorage.setItem("sortBy", sortBy); }, [sortBy]);
  useEffect(() => { localStorage.setItem("viewMode", viewMode); }, [viewMode]);

  // Controlled add dialog state (for pre-filling from empty search prompt)
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogQuery, setAddDialogQuery] = useState("");

  // Mobile account sheet (opened from the tab bar)
  const [accountOpen, setAccountOpen] = useState(false);

  function handleExportCSV() {
    if (allMovies.length === 0) return;

    const blob = new Blob([buildCsv(allMovies)], { type: "text/csv;charset=utf-8;" });
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

  const typeCounts = countByType(allMovies);
  // The switcher appears once the library has a TV show. It also stays while a
  // type is selected, so removing the last show can't strand you in an empty view.
  const showTypeFilter = typeCounts.tv > 0 || typeFilter !== "all";

  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* Bottom padding clears the mobile tab bar and the iPhone home indicator */}
      <div className="mx-auto max-w-7xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-3 md:pb-6">

        {/* App identity — scrolls away, not sticky */}
        <div className="flex items-center gap-2.5 pb-3 pt-2">
          {/* Logo placeholder — replace with <Image> when ready */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4.5 w-4.5"
              style={{ color: "var(--background)" }}
            >
              {/* Clapperboard body */}
              <rect x="2" y="12" width="20" height="10" rx="2" />
              {/* Clapper arm — open */}
              <g transform="rotate(-8 2 12)">
                <rect x="2" y="5" width="20" height="7" rx="2" />
                {/* Diagonal stripes */}
                <line x1="8"  y1="5" x2="6"  y2="12" />
                <line x1="13" y1="5" x2="11" y2="12" />
                <line x1="18" y1="5" x2="16" y2="12" />
              </g>
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Digital Movie Library
          </span>
        </div>

        {/* Controls. Desktop: menu, filter, add, search in one row.
            Phone: search and filter (menu and add live in the tab bar). */}
        <div className="sticky top-0 z-30 -mx-4 bg-background/95 px-4 pb-2 pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <HamburgerMenu user={user} onExportCSV={handleExportCSV} />
            </div>

            <div className="order-last md:order-none">
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
            </div>

            <button
              onClick={() => setAddDialogOpen(true)}
              className="hidden h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent md:flex"
              aria-label="Add to library"
            >
              <Plus className="h-[22px] w-[22px]" />
            </button>

            {/* Search input — takes remaining space */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              {/* text-base on phones: iOS Safari zooms the page on inputs under 16px */}
              <input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="Search your library"
                aria-label="Search your library"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-11 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring md:h-10 md:pr-8 md:text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground md:h-10 md:w-9"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {showTypeFilter && (
            <div className="mt-2 flex gap-1 rounded-lg bg-muted p-1 md:inline-flex" role="group" aria-label="Show">
              {(
                [
                  ["all", "All"],
                  ["movie", "Movies"],
                  ["tv", "TV"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTypeFilter(value)}
                  aria-pressed={typeFilter === value}
                  className={`min-h-9 flex-1 rounded-md px-3 text-sm font-medium transition-colors md:flex-none md:px-5 ${
                    typeFilter === value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                  <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
                    {typeCounts[value]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Movie grid/list */}
        <MovieCollection
          movies={allMovies}
          loading={library.isLoading}
          loadFailed={library.loadFailed}
          onRetry={library.retry}
          onMovieClick={(movie) => setSelectedMovie(movie)}
          search={search}
          sortBy={sortBy}
          typeFilter={typeFilter}
          platformFilter={platformFilter}
          viewMode={viewMode}
          onAddWithQuery={(q) => {
            setAddDialogQuery(q);
            setAddDialogOpen(true);
          }}
        />

        <MovieDetailDialog
          movie={selectedMovie}
          open={selectedMovie !== null}
          onClose={() => setSelectedMovie(null)}
          onMovieUpdated={(id, patch) => {
            library.updated(id, patch);
            setSelectedMovie(null);
          }}
          onMovieDeleted={(id) => {
            library.deleted(id);
            setSelectedMovie(null);
          }}
        />

        <AddMovieDialog
          open={addDialogOpen}
          onOpenChange={(open) => {
            setAddDialogOpen(open);
            if (!open) setAddDialogQuery("");
          }}
          onMovieAdded={library.added}
          existingTitles={allMovies}
          initialQuery={addDialogQuery}
          onViewExisting={(mediaType, tmdbId) => {
            const movie = allMovies.find((m) => m.mediaType === mediaType && m.tmdbId === tmdbId);
            if (movie) {
              setAddDialogOpen(false);
              setAddDialogQuery("");
              setSelectedMovie(movie);
            }
          }}
        />

        <AccountSheet
          user={user}
          open={accountOpen}
          onOpenChange={setAccountOpen}
          onExportCSV={handleExportCSV}
        />
      </div>

      {/* Phone tab bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-3 items-center">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-current="page"
            className="flex h-full flex-col items-center justify-center gap-0.5 text-xs font-medium text-foreground"
          >
            <Library className="h-6 w-6" />
            Library
          </button>
          <button
            onClick={() => setAddDialogOpen(true)}
            aria-label="Add to library"
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-md transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setAccountOpen(true)}
            className="flex h-full flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground"
          >
            <Menu className="h-6 w-6" />
            Menu
          </button>
        </div>
      </nav>
    </main>
  );
}
