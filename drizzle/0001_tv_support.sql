-- TV support. Everything here is additive or relaxes a constraint, so existing
-- rows are all treated as movies and keep working.

-- movies: media type + poster path (replaces poster_url, which stays for now)
ALTER TABLE "movies" ADD COLUMN "media_type" text DEFAULT 'movie' NOT NULL;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "poster_path" text;--> statement-breakpoint
-- Backfill: "https://image.tmdb.org/t/p/w500/abc.jpg" -> "/abc.jpg"
UPDATE "movies"
SET "poster_path" = regexp_replace("poster_url", '^https://image\.tmdb\.org/t/p/w[0-9]+', '')
WHERE "poster_url" IS NOT NULL;--> statement-breakpoint

-- movies: uniqueness is now per user + media type + TMDB id
DROP INDEX "movies_user_tmdb_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "movies_user_media_tmdb_idx" ON "movies" USING btree ("user_id","media_type","tmdb_id");--> statement-breakpoint

-- movie_platforms: NULL season = movie, or a TV show owned as a complete series
ALTER TABLE "movie_platforms" ADD COLUMN "season_number" integer;--> statement-breakpoint

-- tmdb_cache: movie and TV ids overlap, so the key becomes media type + id.
-- (Postgres names an inline PRIMARY KEY "<table>_pkey".)
ALTER TABLE "tmdb_cache" ADD COLUMN "media_type" text DEFAULT 'movie' NOT NULL;--> statement-breakpoint
ALTER TABLE "tmdb_cache" DROP CONSTRAINT "tmdb_cache_pkey";--> statement-breakpoint
ALTER TABLE "tmdb_cache" ADD CONSTRAINT "tmdb_cache_media_type_tmdb_id_pk" PRIMARY KEY("media_type","tmdb_id");
