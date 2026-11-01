import type { MediaType } from "@/lib/tmdb-mappers";

// "148 min" for a movie, "47 min/ep" for a TV show (its typical episode).
export function formatRuntime(mediaType: MediaType, runtime: number | null): string | null {
  if (!runtime) return null;
  return mediaType === "tv" ? `${runtime} min/ep` : `${runtime} min`;
}
