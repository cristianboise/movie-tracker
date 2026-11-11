import { z } from "zod";
import { PLATFORMS, RESOLUTIONS } from "@/lib/platforms";
import { MEDIA_TYPES } from "@/lib/tmdb-mappers";
import { platformEntryKey } from "@/lib/titles";

// Request-body schemas shared by the API routes.
// Platform and resolution lists come from platforms.ts so there is
// exactly one place to add a new platform.

const platformIds: string[] = PLATFORMS.map((p) => p.id);

const platformEntrySchema = z.object({
  platform: z.string().refine((id) => platformIds.includes(id), {
    error: (issue) =>
      `Invalid platform: "${String(issue.input)}". Must be one of: ${platformIds.join(", ")}`,
  }),
  resolution: z
    .union([z.enum(RESOLUTIONS), z.literal("")], {
      error: (issue) =>
        `Invalid resolution: "${String(issue.input)}". Must be one of: ${RESOLUTIONS.join(", ")}`,
    })
    .nullish(),
  // TV only: which season this entry covers (0 = Specials). Leave empty for
  // movies, or for a TV show owned as a complete series.
  seasonNumber: z.number().int().min(0).nullish(),
  notes: z.string().nullish(),
});

const platformListSchema = z
  .array(platformEntrySchema)
  .min(1, "platforms must be a non-empty array")
  .refine(
    (list) => new Set(list.map(platformEntryKey)).size === list.length,
    "platforms must not contain duplicates"
  );

const mediaTypeSchema = z.enum(MEDIA_TYPES, {
  error: (issue) => `Invalid type: "${String(issue.input)}". Must be one of: ${MEDIA_TYPES.join(", ")}`,
});

export const createMovieSchema = z.object({
  // Defaults to "movie" so existing clients keep working
  mediaType: mediaTypeSchema.default("movie"),
  tmdbId: z
    .number("tmdbId is required and must be a number")
    .int("tmdbId must be an integer")
    .positive("tmdbId must be positive"),
  platforms: platformListSchema,
  // Blank notes are stored as null
  notes: z
    .string()
    .nullish()
    .transform((value) => value?.trim() || null),
});

export const updateMovieSchema = z.object({
  platforms: platformListSchema.optional(),
  notes: z.string().nullable().optional(),
});

export const tmdbSearchQuerySchema = z.object({
  q: z.string().trim().min(1, "Missing 'q' query parameter").max(200, "'q' is too long"),
  type: z.enum([...MEDIA_TYPES, "multi"]).default("movie"),
});

export const tmdbIdQuerySchema = z.object({
  id: z.coerce
    .number("'id' must be a number")
    .int("'id' must be an integer")
    .positive("'id' must be positive"),
  type: mediaTypeSchema.default("movie"),
});

export const moviesAnywhereLinkQuerySchema = z.object({
  title: z.string().trim().min(1, "Missing 'title' query parameter").max(300, "'title' is too long"),
  year: z.coerce.number("'year' must be a number").int().min(1870).max(2200).optional(),
});
