import type { movies, moviePlatforms } from "@/db/schema";
import { countSeasons } from "@/lib/ownership";
import type { Movie } from "@/lib/movie-types";

type MovieRow = typeof movies.$inferSelect;
type PlatformRow = typeof moviePlatforms.$inferSelect;

// Database rows -> the shape the screens use.
// Shared by the page (server render) and GET /api/movies so they can't drift.
export function toLibraryMovie(row: MovieRow, platformRows: PlatformRow[]): Movie {
  // Metadata saved when the title was added: has genres, cast, creators, seasons
  const metadata = row.tmdbMetadataJson ? JSON.parse(row.tmdbMetadataJson) : null;

  return {
    id: row.id,
    mediaType: row.mediaType,
    tmdbId: row.tmdbId,
    title: row.title,
    year: row.year,
    runtime: row.runtimeMin,
    posterPath: row.posterPath,
    notes: row.notes,
    addedAt: row.addedAt.toISOString(),
    genres: metadata?.genres ?? [],
    cast: metadata?.cast?.map((c: { name: string }) => c.name) ?? [],
    director: metadata?.director ?? null,
    creators: metadata?.creators ?? [],
    // TV only: seasons you could own, for "3 of 5 seasons"
    totalSeasons: countSeasons(metadata?.seasons),
    platforms: platformRows.map((p) => ({
      id: p.id,
      platform: p.platform,
      seasonNumber: p.seasonNumber,
      resolution: p.resolution,
      notes: p.notes,
    })),
  };
}
