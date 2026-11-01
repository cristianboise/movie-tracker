import { describe, expect, it } from "vitest";
import {
  createMovieSchema,
  updateMovieSchema,
  tmdbIdQuerySchema,
  tmdbSearchQuerySchema,
} from "@/lib/schemas";

const apple4k = { platform: "apple", resolution: "4K" };

describe("createMovieSchema", () => {
  it("accepts a valid movie and trims notes", () => {
    const result = createMovieSchema.parse({
      tmdbId: 27205,
      platforms: [apple4k, { platform: "amazon", resolution: "HD" }],
      notes: "  Director's cut  ",
    });
    expect(result.notes).toBe("Director's cut");
    expect(result.platforms).toHaveLength(2);
  });

  it("turns blank or missing notes into null", () => {
    expect(createMovieSchema.parse({ tmdbId: 1, platforms: [apple4k], notes: "   " }).notes).toBeNull();
    expect(createMovieSchema.parse({ tmdbId: 1, platforms: [apple4k] }).notes).toBeNull();
  });

  it("rejects a non-numeric tmdbId", () => {
    expect(createMovieSchema.safeParse({ tmdbId: "550", platforms: [apple4k] }).success).toBe(false);
  });

  it("rejects an empty platform list", () => {
    expect(createMovieSchema.safeParse({ tmdbId: 1, platforms: [] }).success).toBe(false);
  });

  it("rejects an unknown platform with a helpful message", () => {
    const result = createMovieSchema.safeParse({ tmdbId: 1, platforms: [{ platform: "netflix" }] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('Invalid platform: "netflix"');
  });

  it("rejects an unknown resolution", () => {
    const result = createMovieSchema.safeParse({
      tmdbId: 1,
      platforms: [{ platform: "apple", resolution: "8K" }],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('Invalid resolution: "8K"');
  });

  it("allows a missing or blank resolution", () => {
    expect(createMovieSchema.safeParse({ tmdbId: 1, platforms: [{ platform: "apple" }] }).success).toBe(true);
    expect(createMovieSchema.safeParse({ tmdbId: 1, platforms: [{ platform: "apple", resolution: "" }] }).success).toBe(true);
  });

  it("rejects the same platform listed twice", () => {
    expect(createMovieSchema.safeParse({ tmdbId: 1, platforms: [apple4k, apple4k] }).success).toBe(false);
  });
});

describe("createMovieSchema: media types and seasons", () => {
  it("defaults mediaType to movie", () => {
    expect(createMovieSchema.parse({ tmdbId: 1, platforms: [apple4k] }).mediaType).toBe("movie");
  });

  it("accepts a TV show owned by season and as a complete series", () => {
    const result = createMovieSchema.parse({
      mediaType: "tv",
      tmdbId: 1396,
      platforms: [
        { platform: "apple", resolution: "4K", seasonNumber: 1 },
        { platform: "apple", resolution: "4K", seasonNumber: 2 },
        { platform: "amazon", resolution: "HD" },
      ],
    });
    expect(result.platforms).toHaveLength(3);
  });

  it("rejects an unknown media type", () => {
    const result = createMovieSchema.safeParse({ mediaType: "book", tmdbId: 1, platforms: [apple4k] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('Invalid type: "book"');
  });

  it("rejects negative or fractional seasons", () => {
    expect(createMovieSchema.safeParse({ mediaType: "tv", tmdbId: 1, platforms: [{ ...apple4k, seasonNumber: -1 }] }).success).toBe(false);
    expect(createMovieSchema.safeParse({ mediaType: "tv", tmdbId: 1, platforms: [{ ...apple4k, seasonNumber: 1.5 }] }).success).toBe(false);
  });

  it("rejects the same platform and season twice, but not different seasons", () => {
    const s1 = { ...apple4k, seasonNumber: 1 };
    expect(createMovieSchema.safeParse({ mediaType: "tv", tmdbId: 1, platforms: [s1, s1] }).success).toBe(false);
    expect(createMovieSchema.safeParse({ mediaType: "tv", tmdbId: 1, platforms: [s1, { ...s1, seasonNumber: 2 }] }).success).toBe(true);
  });
});

describe("updateMovieSchema", () => {
  it("accepts notes only, platforms only, or both", () => {
    expect(updateMovieSchema.safeParse({ notes: "hi" }).success).toBe(true);
    expect(updateMovieSchema.safeParse({ notes: null }).success).toBe(true);
    expect(updateMovieSchema.safeParse({ platforms: [apple4k] }).success).toBe(true);
    expect(updateMovieSchema.safeParse({ platforms: [apple4k], notes: "x" }).success).toBe(true);
  });

  it("rejects an empty platform list", () => {
    expect(updateMovieSchema.safeParse({ platforms: [] }).success).toBe(false);
  });
});

describe("TMDB query schemas", () => {
  it("coerces a numeric id from the query string", () => {
    expect(tmdbIdQuerySchema.parse({ id: "27205" }).id).toBe(27205);
  });

  it("rejects missing, non-numeric, and non-positive ids", () => {
    expect(tmdbIdQuerySchema.safeParse({}).success).toBe(false);
    expect(tmdbIdQuerySchema.safeParse({ id: "abc" }).success).toBe(false);
    expect(tmdbIdQuerySchema.safeParse({ id: "-3" }).success).toBe(false);
  });

  it("defaults type to movie and accepts tv (and multi for search)", () => {
    expect(tmdbIdQuerySchema.parse({ id: "1" }).type).toBe("movie");
    expect(tmdbIdQuerySchema.parse({ id: "1", type: "tv" }).type).toBe("tv");
    expect(tmdbIdQuerySchema.safeParse({ id: "1", type: "multi" }).success).toBe(false);
    expect(tmdbSearchQuerySchema.parse({ q: "x" }).type).toBe("movie");
    expect(tmdbSearchQuerySchema.parse({ q: "x", type: "multi" }).type).toBe("multi");
    expect(tmdbSearchQuerySchema.safeParse({ q: "x", type: "person" }).success).toBe(false);
  });

  it("trims the search term and rejects blank or oversized ones", () => {
    expect(tmdbSearchQuerySchema.parse({ q: "  inception " }).q).toBe("inception");
    expect(tmdbSearchQuerySchema.safeParse({ q: "   " }).success).toBe(false);
    expect(tmdbSearchQuerySchema.safeParse({ q: "x".repeat(201) }).success).toBe(false);
  });
});
