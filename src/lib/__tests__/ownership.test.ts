import { describe, expect, it } from "vitest";
import {
  countSeasons,
  formatScope,
  formatSeasonList,
  fromRows,
  groupOwnership,
  ownershipLabel,
  selectionsAreValid,
  toEntries,
  toSeasonOptions,
  type OwnershipRow,
  type PlatformSelection,
} from "@/lib/ownership";

const row = (platform: string, resolution: string | null, seasonNumber: number | null): OwnershipRow => ({
  platform,
  resolution,
  seasonNumber,
});

describe("toEntries", () => {
  it("turns an 'all' selection into one season-less entry (movies and complete series)", () => {
    expect(toEntries([{ platform: "apple", resolution: "4K", scope: "all" }])).toEqual([
      { platform: "apple", resolution: "4K", seasonNumber: null },
    ]);
  });

  it("expands chosen seasons into one entry each", () => {
    expect(toEntries([{ platform: "apple", resolution: "HD", scope: [1, 3] }])).toEqual([
      { platform: "apple", resolution: "HD", seasonNumber: 1 },
      { platform: "apple", resolution: "HD", seasonNumber: 3 },
    ]);
  });

  it("handles a mix of platforms", () => {
    const selections: PlatformSelection[] = [
      { platform: "apple", resolution: "4K", scope: "all" },
      { platform: "amazon", resolution: "HD", scope: [2] },
    ];
    expect(toEntries(selections)).toHaveLength(2);
  });
});

describe("fromRows", () => {
  it("collapses per-season rows into one selection per platform", () => {
    expect(fromRows([row("apple", "4K", 2), row("apple", "4K", 1), row("amazon", "HD", 1)])).toEqual([
      { platform: "apple", resolution: "4K", scope: [1, 2] },
      { platform: "amazon", resolution: "HD", scope: [1] },
    ]);
  });

  it("reads a season-less row as 'all'", () => {
    expect(fromRows([row("apple", "4K", null)])).toEqual([
      { platform: "apple", resolution: "4K", scope: "all" },
    ]);
  });

  it("lets a complete series win over seasons on the same platform", () => {
    const [selection] = fromRows([row("apple", "HD", 1), row("apple", "4K", null), row("apple", "HD", 2)]);
    expect(selection.scope).toBe("all");
    expect(selection.resolution).toBe("4K");
  });

  it("falls back to the default resolution", () => {
    expect(fromRows([row("apple", null, null)])[0].resolution).toBe("4K");
  });

  it("round-trips through toEntries", () => {
    const rows = [row("apple", "4K", 1), row("apple", "4K", 2), row("amazon", "HD", null)];
    const entries = toEntries(fromRows(rows));
    expect(entries).toEqual([
      { platform: "apple", resolution: "4K", seasonNumber: 1 },
      { platform: "apple", resolution: "4K", seasonNumber: 2 },
      { platform: "amazon", resolution: "HD", seasonNumber: null },
    ]);
  });
});

describe("selectionsAreValid", () => {
  it("needs at least one selection", () => {
    expect(selectionsAreValid([])).toBe(false);
  });

  it("rejects 'choose seasons' with none chosen", () => {
    expect(selectionsAreValid([{ platform: "apple", resolution: "4K", scope: [] }])).toBe(false);
    expect(selectionsAreValid([{ platform: "apple", resolution: "4K", scope: [1] }])).toBe(true);
    expect(selectionsAreValid([{ platform: "apple", resolution: "4K", scope: "all" }])).toBe(true);
  });
});

describe("groupOwnership", () => {
  it("groups seasons by platform and resolution, in canonical platform order", () => {
    const groups = groupOwnership([
      row("amazon", "HD", 1),
      row("apple", "4K", 3),
      row("apple", "4K", 1),
      row("apple", "HD", 2),
    ]);
    expect(groups).toEqual([
      { platform: "apple", resolution: "4K", scope: [1, 3] },
      { platform: "apple", resolution: "HD", scope: [2] },
      { platform: "amazon", resolution: "HD", scope: [1] },
    ]);
  });

  it("keeps movies as one group per platform", () => {
    expect(groupOwnership([row("apple", "4K", null), row("amazon", "HD", null)])).toHaveLength(2);
  });
});

describe("formatSeasonList / formatScope", () => {
  it("collapses runs into ranges", () => {
    expect(formatSeasonList([1, 2, 3, 5])).toBe("S1–3, S5");
    expect(formatSeasonList([4])).toBe("S4");
    expect(formatSeasonList([1, 2])).toBe("S1–2");
    expect(formatSeasonList([5, 1, 3, 2])).toBe("S1–3, S5");
  });

  it("puts Specials last", () => {
    expect(formatSeasonList([0, 1, 2])).toBe("S1–2, Specials");
    expect(formatSeasonList([0])).toBe("Specials");
  });

  it("labels the complete series", () => {
    expect(formatScope("all")).toBe("Complete series");
    expect(formatScope([1, 2])).toBe("S1–2");
  });
});

describe("countSeasons / toSeasonOptions", () => {
  const seasons = [
    { seasonNumber: 0, episodeCount: 11 },
    { seasonNumber: 1, episodeCount: 7 },
    { seasonNumber: 2, episodeCount: 13 },
    { seasonNumber: 3, episodeCount: 0 }, // announced, not released
  ];

  it("counts only released, numbered seasons", () => {
    expect(countSeasons(seasons)).toBe(2);
    expect(countSeasons(null)).toBeNull();
    expect(countSeasons([])).toBe(0);
  });

  it("builds chips for released seasons, specials included, in order", () => {
    expect(toSeasonOptions(seasons).map((s) => s.label)).toEqual(["Specials", "S1", "S2"]);
    expect(toSeasonOptions(undefined)).toEqual([]);
  });
});

describe("ownershipLabel", () => {
  it("says Complete series when any row is season-less", () => {
    expect(ownershipLabel([row("apple", "4K", null)], 5)).toBe("Complete series");
    expect(ownershipLabel([row("apple", "4K", 1), row("amazon", "HD", null)], 5)).toBe("Complete series");
  });

  it("counts distinct seasons across platforms", () => {
    expect(ownershipLabel([row("apple", "4K", 1), row("apple", "4K", 2), row("amazon", "HD", 2)], 5)).toBe("2 of 5 seasons");
  });

  it("says All seasons when every season is owned individually", () => {
    expect(ownershipLabel([row("apple", "4K", 1), row("apple", "4K", 2)], 2)).toBe("All seasons");
  });

  it("copes with an unknown total, specials only, and no rows", () => {
    expect(ownershipLabel([row("apple", "4K", 1)], null)).toBe("1 season");
    expect(ownershipLabel([row("apple", "4K", 1), row("apple", "4K", 2)], null)).toBe("2 seasons");
    expect(ownershipLabel([row("apple", "4K", 0)], 5)).toBe("Specials");
    expect(ownershipLabel([], 5)).toBeNull();
  });
});
