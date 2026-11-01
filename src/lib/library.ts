import type { MediaType } from "@/lib/tmdb-mappers";

// Search, filter and sort rules for the library screen.
// Kept free of React so they can be unit tested.

export type SortOption = "title-asc" | "title-desc" | "added" | "year-desc" | "year-asc";
export type ViewMode = "grid" | "compact" | "list";
export type TypeFilter = "all" | MediaType;

export type LibraryItem = {
  mediaType: MediaType;
  title: string;
  year: number | null;
  addedAt: string;
  genres: string[];
  cast: string[];
  director: string | null;
  creators: string[];
  platforms: { platform: string }[];
};

// Strip leading articles so "The Godfather" sorts under G, not T
export function sortableTitle(title: string) {
  return title.replace(/^(the|a|an)\s+/i, "").trimStart();
}

export function matchesSearch(item: LibraryItem, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;

  return (
    item.title.toLowerCase().includes(q) ||
    (item.director?.toLowerCase().includes(q) ?? false) ||
    item.creators.some((c) => c.toLowerCase().includes(q)) ||
    item.genres.some((g) => g.toLowerCase().includes(q)) ||
    item.cast.some((c) => c.toLowerCase().includes(q))
  );
}

export function compareItems(a: LibraryItem, b: LibraryItem, sortBy: SortOption): number {
  switch (sortBy) {
    case "title-asc":
      return sortableTitle(a.title).localeCompare(sortableTitle(b.title));
    case "title-desc":
      return sortableTitle(b.title).localeCompare(sortableTitle(a.title));
    case "added":
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    case "year-desc":
      return (b.year ?? 0) - (a.year ?? 0);
    case "year-asc":
      return (a.year ?? 0) - (b.year ?? 0);
    default:
      return 0;
  }
}

export function filterAndSort<T extends LibraryItem>(
  items: T[],
  options: {
    search: string;
    typeFilter: TypeFilter;
    platformFilter: string | null;
    sortBy: SortOption;
  }
): T[] {
  const { search, typeFilter, platformFilter, sortBy } = options;

  return items
    .filter((item) => {
      if (typeFilter !== "all" && item.mediaType !== typeFilter) return false;
      if (platformFilter && !item.platforms.some((p) => p.platform === platformFilter)) {
        return false;
      }
      return matchesSearch(item, search);
    })
    .sort((a, b) => compareItems(a, b, sortBy));
}

export function countByType(items: { mediaType: MediaType }[]): Record<TypeFilter, number> {
  const counts: Record<TypeFilter, number> = { all: items.length, movie: 0, tv: 0 };
  for (const item of items) counts[item.mediaType] += 1;
  return counts;
}
