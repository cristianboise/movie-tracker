"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Movie } from "@/lib/movie-types";
import { addMovie, patchMovie, removeMovie } from "@/lib/library-cache";

const LIBRARY_KEY = ["library"] as const;

async function fetchLibrary(): Promise<Movie[]> {
  const response = await fetch("/api/movies");
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  const data = await response.json();
  return data.movies;
}

// The user's library, kept on screen.
//
// `initialMovies` comes from the server with the page, so there's nothing to
// wait for. If the server couldn't load it (null), this fetches it instead.
// After an add, edit or delete, call the matching function: the screen
// updates straight away, then a background refresh swaps in the server's data.
export function useLibrary(initialMovies: Movie[] | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: LIBRARY_KEY,
    queryFn: fetchLibrary,
    initialData: initialMovies ?? undefined,
  });

  const update = useCallback(
    async (change: (movies: Movie[]) => Movie[]) => {
      // A refresh already in flight would otherwise overwrite this change
      // with older data when it lands
      await queryClient.cancelQueries({ queryKey: LIBRARY_KEY });
      queryClient.setQueryData<Movie[]>(LIBRARY_KEY, (old) => change(old ?? []));
      queryClient.invalidateQueries({ queryKey: LIBRARY_KEY });
    },
    [queryClient]
  );

  return {
    movies: query.data ?? [],
    // True only when there is nothing to show yet
    isLoading: query.isPending,
    loadFailed: query.isError && !query.data,
    retry: () => query.refetch(),
    added: useCallback((movie: Movie) => update((m) => addMovie(m, movie)), [update]),
    updated: useCallback(
      (id: number, patch: Partial<Movie>) => update((m) => patchMovie(m, id, patch)),
      [update]
    ),
    deleted: useCallback((id: number) => update((m) => removeMovie(m, id)), [update]),
  };
}
