import type { MediaType } from "@/lib/tmdb-mappers";

// Rules for how platform ownership relates to a title's type.
//
// Movies are owned as a whole: seasonNumber is always empty.
// TV shows can be owned per season (seasonNumber = 1, 2, ...; 0 is Specials)
// or as a complete series (seasonNumber empty).

type SeasonRef = { seasonNumber?: number | null };

// Returns a message describing the first problem, or null if the
// platform entries are valid for this kind of title.
// Pass `knownSeasons` (from TMDB) to also reject seasons that don't exist.
export function findSeasonError(
  mediaType: MediaType,
  platforms: SeasonRef[],
  knownSeasons?: number[]
): string | null {
  for (const p of platforms) {
    if (p.seasonNumber == null) continue;

    if (mediaType === "movie") {
      return "Movies can't be tracked by season";
    }
    if (knownSeasons && !knownSeasons.includes(p.seasonNumber)) {
      return `Season ${p.seasonNumber} doesn't exist for this show`;
    }
  }
  return null;
}

// Key that identifies one ownership entry. Two entries with the same key
// would be duplicates. A missing season means "complete series / movie".
export function platformEntryKey(entry: { platform: string; seasonNumber?: number | null }) {
  return `${entry.platform}:${entry.seasonNumber ?? "all"}`;
}
