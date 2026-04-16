import { pgTable, text, integer, timestamp, uniqueIndex, serial } from "drizzle-orm/pg-core";

// ============================================================
// MOVIES TABLE
// One row per movie per user. If two users both own "Inception",
// that's two rows — each user's collection is completely separate.
// ============================================================
export const movies = pgTable("movies", {
  // serial = auto-incrementing integer. Every new row gets the next number.
  id: serial("id").primaryKey(),

  // Which user owns this movie in their collection.
  // We'll link this to the auth system later.
  userId: text("user_id").notNull(),

  // TMDB's unique ID for this movie. We store it so we can
  // fetch updated metadata later without searching again.
  tmdbId: integer("tmdb_id").notNull(),

  // Basic info we cache from TMDB so we don't have to call
  // their API every time we display the movie.
  title: text("title").notNull(),
  year: integer("year"),
  runtimeMin: integer("runtime_min"),
  posterUrl: text("poster_url"),

  // The full TMDB API response, stored as a JSON string.
  // Useful if we want to display cast, genres, etc. without
  // making another API call.
  tmdbMetadataJson: text("tmdb_metadata_json"),

  // Free-text notes the user can attach to a movie.
  notes: text("notes"),

  // Timestamps — automatically set when created/updated.
  addedAt: timestamp("added_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // This constraint prevents the same user from adding the
  // same TMDB movie twice. The database will reject the insert.
  uniqueIndex("movies_user_tmdb_idx").on(table.userId, table.tmdbId),
]);

// ============================================================
// MOVIE PLATFORMS TABLE
// One row per platform a movie is available on.
// Example: if you own "Inception" on Apple AND Amazon,
// that's two rows here, both pointing to the same movie.
// ============================================================
export const moviePlatforms = pgTable("movie_platforms", {
  id: serial("id").primaryKey(),

  // Which movie this platform tag belongs to.
  movieId: integer("movie_id")
    .references(() => movies.id, { onDelete: "cascade" })
    .notNull(),

  // The platform name. We store it as text and validate
  // in application code rather than using a DB enum,
  // because adding new platforms to a DB enum requires
  // a migration, while adding to app code is instant.
  platform: text("platform").notNull(),

  // Resolution on this specific platform (e.g., "4K", "HD", "SD").
  // Nullable because you might not know or care.
  resolution: text("resolution"),

  // Optional notes specific to this platform entry.
  notes: text("notes"),

  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// ============================================================
// TMDB CACHE TABLE
// Shared across all users. When anyone looks up a movie on TMDB,
// we store the response here so we don't re-fetch it.
// ============================================================
export const tmdbCache = pgTable("tmdb_cache", {
  tmdbId: integer("tmdb_id").primaryKey(),
  payloadJson: text("payload_json").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
});