import { describe, expect, it } from "vitest";
import {
  addMovie,
  buildAddedMovie,
  entriesToRows,
  patchMovie,
  removeMovie,
} from "@/lib/library-cache";
import { toLibraryMovie } from "@/lib/library-mapping";
import type { Movie } from "@/lib/movie-types";

const movie = (id: number, title = `Movie ${id}`): Movie => ({
  id,
  mediaType: "movie",
  tmdbId: id + 1000,
  title,
  year: 2000,
  runtime: 100,
  posterPath: null,
  notes: null,
  addedAt: "2024-01-01T00:00:00.000Z",
  genres: [],
  cast: [],
  director: null,
  creators: [],
  totalSeasons: null,
  platforms: [],
});

describe("addMovie / patchMovie / removeMovie", () => {
  it("adds to the front", () => {
    expect(addMovie([movie(1), movie(2)], movie(3)).map((m) => m.id)).toEqual([3, 1, 2]);
  });

  it("never lists the same entry twice", () => {
    expect(addMovie([movie(1), movie(2)], movie(2, "Fresh")).map((m) => m.title)).toEqual(["Fresh", "Movie 1"]);
  });

  it("patches only the matching entry and leaves the input alone", () => {
    const list = [movie(1), movie(2)];
    const next = patchMovie(list, 2, { notes: "hi" });
    expect(next[1].notes).toBe("hi");
    expect(next[0]).toBe(list[0]);
    expect(list[1].notes).toBeNull();
  });

  it("removes by id, and ignores unknown ids", () => {
    expect(removeMovie([movie(1), movie(2)], 1).map((m) => m.id)).toEqual([2]);
    expect(removeMovie([movie(1)], 99)).toHaveLength(1);
  });
});

describe("entriesToRows", () => {
  it("gives temporary negative ids and normalizes blanks", () => {
    expect(
      entriesToRows([
        { platform: "apple", resolution: "4K", seasonNumber: 1 },
        { platform: "amazon", resolution: "", notes: undefined },
      ])
    ).toEqual([
      { id: -1, platform: "apple", seasonNumber: 1, resolution: "4K", notes: null },
      { id: -2, platform: "amazon", seasonNumber: null, resolution: null, notes: null },
    ]);
  });
});

describe("buildAddedMovie", () => {
  it("builds a complete entry with empty details and platform rows", () => {
    const added = buildAddedMovie({
      id: 7,
      mediaType: "tv",
      tmdbId: 1396,
      title: "Breaking Bad",
      year: 2008,
      runtime: 47,
      posterPath: "/p.jpg",
      notes: null,
      totalSeasons: 5,
      platforms: [{ platform: "apple", resolution: "4K", seasonNumber: null }],
      now: new Date("2025-02-03T04:05:06.000Z"),
    });
    expect(added).toMatchObject({
      id: 7,
      mediaType: "tv",
      totalSeasons: 5,
      addedAt: "2025-02-03T04:05:06.000Z",
      genres: [],
      cast: [],
    });
    expect(added.platforms).toHaveLength(1);
  });
});

describe("toLibraryMovie", () => {
  const row = {
    id: 5,
    userId: "u1",
    mediaType: "tv" as const,
    tmdbId: 1396,
    title: "Breaking Bad",
    year: 2008,
    runtimeMin: 47,
    posterPath: "/bb.jpg",
    posterUrl: null,
    tmdbMetadataJson: JSON.stringify({
      genres: ["Drama"],
      cast: [{ name: "Bryan Cranston", character: "Walt" }],
      creators: ["Vince Gilligan"],
      seasons: [
        { seasonNumber: 0, episodeCount: 9 },
        { seasonNumber: 1, episodeCount: 7 },
        { seasonNumber: 2, episodeCount: 13 },
      ],
    }),
    notes: "n",
    addedAt: new Date("2024-03-05T12:00:00Z"),
    updatedAt: new Date("2024-03-05T12:00:00Z"),
  };

  it("maps a TV row with its metadata and platforms", () => {
    const mapped = toLibraryMovie(row, [
      { id: 1, movieId: 5, platform: "apple", seasonNumber: 1, resolution: "4K", notes: null, addedAt: new Date() },
    ]);
    expect(mapped).toMatchObject({
      id: 5,
      title: "Breaking Bad",
      posterPath: "/bb.jpg",
      addedAt: "2024-03-05T12:00:00.000Z",
      genres: ["Drama"],
      cast: ["Bryan Cranston"],
      creators: ["Vince Gilligan"],
      totalSeasons: 2,
      platforms: [{ id: 1, platform: "apple", seasonNumber: 1, resolution: "4K", notes: null }],
    });
  });

  it("copes with a row that has no stored metadata", () => {
    const mapped = toLibraryMovie({ ...row, tmdbMetadataJson: null, mediaType: "movie" }, []);
    expect(mapped).toMatchObject({ genres: [], cast: [], director: null, creators: [], totalSeasons: null, platforms: [] });
  });
});
