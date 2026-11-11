"use client";

import { useQuery } from "@tanstack/react-query";

// The checked Movies Anywhere address for a movie, or undefined while it's
// being looked up or if the lookup failed (the badge then uses its guess).
export function useMoviesAnywhereLink(
  title: string | undefined,
  year: number | null | undefined,
  enabled: boolean
): string | undefined {
  const query = useQuery({
    queryKey: ["movies-anywhere-link", title, year ?? null],
    enabled: enabled && !!title,
    staleTime: Infinity,
    retry: false,
    queryFn: async (): Promise<string> => {
      const params = new URLSearchParams({ title: title ?? "" });
      if (year) params.set("year", String(year));
      const response = await fetch(`/api/store-links/movies-anywhere?${params}`);
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      return (await response.json()).url;
    },
  });
  return query.data;
}
