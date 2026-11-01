import { describe, expect, it } from "vitest";
import { findSeasonError, platformEntryKey } from "@/lib/titles";

describe("findSeasonError", () => {
  it("allows movies with no season", () => {
    expect(findSeasonError("movie", [{ seasonNumber: null }, {}])).toBeNull();
  });

  it("rejects movies with a season", () => {
    expect(findSeasonError("movie", [{ seasonNumber: 1 }])).toMatch(/can't be tracked by season/);
  });

  it("allows TV as a complete series or by season", () => {
    expect(findSeasonError("tv", [{ seasonNumber: null }, { seasonNumber: 2 }])).toBeNull();
  });

  it("treats season 0 (Specials) as a real season", () => {
    expect(findSeasonError("tv", [{ seasonNumber: 0 }], [0, 1])).toBeNull();
    expect(findSeasonError("tv", [{ seasonNumber: 0 }], [1])).toMatch(/Season 0/);
  });

  it("rejects seasons TMDB doesn't know about", () => {
    expect(findSeasonError("tv", [{ seasonNumber: 9 }], [1, 2, 3])).toMatch(/Season 9 doesn't exist/);
  });

  it("skips the existence check when seasons aren't known", () => {
    expect(findSeasonError("tv", [{ seasonNumber: 9 }])).toBeNull();
  });
});

describe("platformEntryKey", () => {
  it("distinguishes seasons and the complete series on one platform", () => {
    const keys = [
      platformEntryKey({ platform: "apple" }),
      platformEntryKey({ platform: "apple", seasonNumber: null }),
      platformEntryKey({ platform: "apple", seasonNumber: 1 }),
      platformEntryKey({ platform: "apple", seasonNumber: 0 }),
      platformEntryKey({ platform: "amazon", seasonNumber: 1 }),
    ];
    // First two are the same entry; the rest are all different
    expect(new Set(keys).size).toBe(4);
    expect(keys[0]).toBe(keys[1]);
  });
});
