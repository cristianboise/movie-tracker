import { DEFAULT_RESOLUTION, sortPlatforms } from "@/lib/platforms";

// How a title is owned, in the shapes the UI works with.
//
// The database stores one row per platform and season. That is awkward to
// edit, so the UI works with one "selection" per platform: a resolution plus
// a scope, which is either "all" (a movie, or a TV show as a complete series)
// or a list of owned seasons. The functions here convert between the two.
//
// The UI never creates two resolutions for one platform. Rows saved that way
// through the API are read back using the first resolution found.

export type Scope = "all" | number[];

export type OwnershipRow = {
  platform: string;
  resolution: string | null;
  seasonNumber: number | null;
};

export type PlatformSelection = {
  platform: string;
  resolution: string;
  scope: Scope;
};

export type OwnershipGroup = {
  platform: string;
  resolution: string | null;
  scope: Scope;
};

export type SeasonOption = {
  seasonNumber: number;
  // Short label for a chip: "S1", or "Specials" for season 0
  label: string;
  episodeCount: number;
};

function addSeason(scope: number[], season: number) {
  if (!scope.includes(season)) scope.push(season);
}

// Rows from the API -> one selection per platform, for the editor.
// A complete-series row wins over individual seasons on the same platform.
export function fromRows(rows: OwnershipRow[]): PlatformSelection[] {
  const byPlatform = new Map<string, PlatformSelection>();

  for (const row of rows) {
    let selection = byPlatform.get(row.platform);
    if (!selection) {
      selection = {
        platform: row.platform,
        resolution: row.resolution || DEFAULT_RESOLUTION,
        scope: [],
      };
      byPlatform.set(row.platform, selection);
    }

    if (row.seasonNumber == null) {
      selection.scope = "all";
      selection.resolution = row.resolution || selection.resolution;
    } else if (selection.scope !== "all") {
      addSeason(selection.scope, row.seasonNumber);
    }
  }

  const selections = [...byPlatform.values()];
  for (const s of selections) {
    if (s.scope !== "all") s.scope.sort((a, b) => a - b);
  }
  return selections;
}

export type OwnershipEntry = {
  platform: string;
  resolution: string;
  seasonNumber: number | null;
};

// Editor selections -> one entry per platform and season, for the API.
export function toEntries(selections: PlatformSelection[]): OwnershipEntry[] {
  return selections.flatMap<OwnershipEntry>((s) =>
    s.scope === "all"
      ? [{ platform: s.platform, resolution: s.resolution, seasonNumber: null }]
      : s.scope.map((seasonNumber) => ({
          platform: s.platform,
          resolution: s.resolution,
          seasonNumber,
        }))
  );
}

// A selection that picks "choose seasons" must pick at least one season.
export function selectionsAreValid(selections: PlatformSelection[]): boolean {
  return (
    selections.length > 0 &&
    selections.every((s) => s.scope === "all" || s.scope.length > 0)
  );
}

// Rows from the API -> display groups: one per platform and resolution.
// Used for the badges, so a show owned on Apple in seasons 1-3 shows one
// Apple badge instead of three.
export function groupOwnership(rows: OwnershipRow[]): OwnershipGroup[] {
  const groups = new Map<string, OwnershipGroup>();

  for (const row of rows) {
    const key = `${row.platform}|${row.resolution ?? ""}`;
    let group = groups.get(key);
    if (!group) {
      group = { platform: row.platform, resolution: row.resolution, scope: [] };
      groups.set(key, group);
    }

    if (row.seasonNumber == null) {
      group.scope = "all";
    } else if (group.scope !== "all") {
      addSeason(group.scope, row.seasonNumber);
    }
  }

  const list = [...groups.values()];
  for (const g of list) {
    if (g.scope !== "all") g.scope.sort((a, b) => a - b);
  }
  return sortPlatforms(list);
}

// [1, 2, 3, 5, 0] -> "S1–3, S5, Specials"
export function formatSeasonList(seasons: number[]): string {
  const numbered = [...new Set(seasons.filter((n) => n > 0))].sort((a, b) => a - b);
  const parts: string[] = [];

  let i = 0;
  while (i < numbered.length) {
    let j = i;
    while (j + 1 < numbered.length && numbered[j + 1] === numbered[j] + 1) j++;
    parts.push(j > i ? `S${numbered[i]}–${numbered[j]}` : `S${numbered[i]}`);
    i = j + 1;
  }

  if (seasons.includes(0)) parts.push("Specials");
  return parts.join(", ");
}

// Text for a group's scope: "Complete series" or "S1–3, S5"
export function formatScope(scope: Scope): string {
  return scope === "all" ? "Complete series" : formatSeasonList(scope);
}

// How many seasons a show has that you could own. Specials and seasons with
// no episodes yet (announced but unreleased) don't count.
export function countSeasons(
  seasons: { seasonNumber: number; episodeCount: number }[] | null | undefined
): number | null {
  if (!seasons) return null;
  return seasons.filter((s) => s.seasonNumber > 0 && s.episodeCount > 0).length;
}

// Season chips for the editor. Unreleased seasons are left out.
export function toSeasonOptions(
  seasons: { seasonNumber: number; episodeCount: number }[] | null | undefined
): SeasonOption[] {
  return (seasons ?? [])
    .filter((s) => s.episodeCount > 0)
    .map((s) => ({
      seasonNumber: s.seasonNumber,
      label: s.seasonNumber === 0 ? "Specials" : `S${s.seasonNumber}`,
      episodeCount: s.episodeCount,
    }))
    .sort((a, b) => a.seasonNumber - b.seasonNumber);
}

// One-line summary of how much of a TV show you own, e.g. "3 of 5 seasons".
export function ownershipLabel(
  rows: { seasonNumber: number | null }[],
  totalSeasons: number | null
): string | null {
  if (rows.length === 0) return null;
  if (rows.some((r) => r.seasonNumber == null)) return "Complete series";

  const owned = new Set(rows.map((r) => r.seasonNumber).filter((n): n is number => n! > 0));
  if (owned.size === 0) return "Specials";
  if (totalSeasons != null && owned.size >= totalSeasons) return "All seasons";
  if (totalSeasons != null) return `${owned.size} of ${totalSeasons} seasons`;
  return `${owned.size} season${owned.size === 1 ? "" : "s"}`;
}
