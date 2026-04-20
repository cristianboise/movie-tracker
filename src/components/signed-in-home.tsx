"use client";

import { useState } from "react";
import { AddMovieDialog } from "@/components/add-movie-dialog";
import { MovieCollection } from "@/components/movie-collection";
import { MovieDetailDialog } from "@/components/movie-detail-dialog";
import { HamburgerMenu } from "@/components/hamburger-menu";

type Movie = {
  id: number;
  tmdbId: number;
  title: string;
  year: number | null;
  runtime: number | null;
  posterUrl: string | null;
  notes: string | null;
  addedAt: string;
  platforms: {
    id: number;
    platform: string;
    resolution: string | null;
    notes: string | null;
  }[];
};

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id?: string;
};

export function SignedInHome({ user }: { user: User }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Movie Tracker</h1>
          <HamburgerMenu user={user} />
        </div>

        <div className="mt-4">
          <AddMovieDialog
            onMovieAdded={() => setRefreshKey((k) => k + 1)}
          />
        </div>

        <MovieCollection
          refreshKey={refreshKey}
          onMovieClick={(movie) => setSelectedMovie(movie)}
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