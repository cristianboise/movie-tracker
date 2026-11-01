import { pgTable, text, integer, timestamp, uniqueIndex, serial, primaryKey } from "drizzle-orm/pg-core";
import type { MediaType } from "@/lib/tmdb-mappers";

// ============================================================
// MOVIES TABLE
// One row per title per user. Despite the name, this holds both
// movies and TV shows (see mediaType). If two users both own
// "Inception", that's two rows — each user's collection is
// completely separate.
// ============================================================
export const movies = pgTable("movies", {
  // serial = auto-incrementing integer. Every new row gets the next number.
  id: serial("id").primaryKey(),

  // Which user owns this title in their collection.
  userId: text("user_id").notNull(),

  // "movie" or "tv". TMDB uses separate ID spaces for each, so
  // a tmdbId is only unique together with its mediaType.
  mediaType: text("media_type").$type<MediaType>().notNull().default("movie"),

  // TMDB's unique ID for this title (within its mediaType). We store it so we
  // can fetch updated metadata later without searching again.
  tmdbId: integer("tmdb_id").notNull(),

  // Basic info we cache from TMDB so we don't have to call
  // their API every time we display the title.
  title: text("title").notNull(),
  // Release year for movies, first-air year for TV.
  year: integer("year"),
  // Movie runtime, or typical episode runtime for TV.
  runtimeMin: integer("runtime_min"),

  // TMDB's partial image path (e.g. "/abc123.jpg"). The full URL, at
  // whatever size is needed, is built when rendering.
  posterPath: text("poster_path"),

  // DEPRECATED: full w500 URL, replaced by posterPath. No longer written
  // or read; drop this column in a later migration once posterPath is verified.
  posterUrl: text("poster_url"),

  // The title's TMDB metadata (see TitleMeta), stored as a JSON string.
  // Useful if we want to display cast, genres, etc. without
  // making another API call.
  tmdbMetadataJson: text("tmdb_metadata_json"),

  // Free-text notes the user can attach to a title.
  notes: text("notes"),

  // Timestamps — automatically set when created/updated.
  addedAt: timestamp("added_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // This constraint prevents the same user from adding the
  // same TMDB title twice. The database will reject the insert.
  uniqueIndex("movies_user_media_tmdb_idx").on(table.userId, table.mediaType, table.tmdbId),
]);

// ============================================================
// MOVIE PLATFORMS TABLE
// One row per platform (and season, for TV) a title is owned on.
// Example: if you own "Inception" on Apple AND Amazon,
// that's two rows here, both pointing to the same movie.
// ============================================================
export const moviePlatforms = pgTable("movie_platforms", {
  id: serial("id").primaryKey(),

  // Which title this platform tag belongs to.
  movieId: integer("movie_id")
    .references(() => movies.id, { onDelete: "cascade" })
    .notNull(),

  // The platform name. We store it as text and validate
  // in application code rather than using a DB enum,
  // because adding new platforms to a DB enum requires
  // a migration, while adding to app code is instant.
  platform: text("platform").notNull(),

  // Which season of a TV show this row covers (0 = Specials).
  // NULL means the whole title: always the case for movies, and for
  // TV it means "complete series" on this platform.
  seasonNumber: integer("season_number"),

  // Resolution on this specific platform (e.g., "4K", "HD", "SD").
  // Nullable because you might not know or care.
  resolution: text("resolution"),

  // Optional notes specific to this platform entry.
  notes: text("notes"),

  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// ============================================================
// TMDB CACHE TABLE
// Shared across all users. When anyone looks up a title on TMDB,
// we store the response here so we don't re-fetch it.
// Keyed on mediaType + tmdbId because movie and TV IDs overlap.
// ============================================================
export const tmdbCache = pgTable("tmdb_cache", {
  mediaType: text("media_type").$type<MediaType>().notNull().default("movie"),
  tmdbId: integer("tmdb_id").notNull(),
  payloadJson: text("payload_json").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.mediaType, table.tmdbId] }),
]);
