"use client";

import { useState, useCallback } from "react";
import { AddMovieDialog } from "@/components/add-movie-dialog";
import { MovieCollection } from "@/components/movie-collection";
import type { Movie } from "@/components/movie-collection";
import { MovieDetailDialog } from "@/components/movie-detail-dialog";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { FilterSortMenu } from "@/components/filter-sort-menu";
import type { SortOption } from "@/components/filter-sort-menu";
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

  // Lifted search/filter/sort state
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("title-asc");
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);

  // Stable callback for MovieCollection to report loaded movies
  const handleMoviesLoaded = useCallback((movies: Movie[]) => {
    setAllMovies(movies);
  }, []);

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
        {/* Single-row header: search + filter + add + menu */}
        <div className="sticky top-0 z-30 -mx-4 bg-background/95 px-4 pb-2 pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center gap-2">
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
                placeholder="Search Movie Tracker..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Filter/sort dropdown */}
            <FilterSortMenu
              sortBy={sortBy}
              onSortChange={setSortBy}
              platformFilter={platformFilter}
              onPlatformFilterChange={setPlatformFilter}
              platformCounts={platformCounts}
              totalCount={allMovies.length}
            />

            {/* Add movie button — compact icon */}
            <AddMovieDialog
              onMovieAdded={() => setRefreshKey((k) => k + 1)}
            />

            {/* Hamburger menu */}
            <HamburgerMenu user={user} />
          </div>
        </div>

        {/* Movie grid */}
        <MovieCollection
          refreshKey={refreshKey}
          onMovieClick={(movie) => setSelectedMovie(movie)}
          search={search}
          sortBy={sortBy}
          platformFilter={platformFilter}
          onMoviesLoaded={handleMoviesLoaded}
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
