// Central definition of platforms, their display names, and brand colors.
// Used by every component that shows platform tags or filters.
// `supports` lists the kinds of title a platform can be picked for.

export const PLATFORMS = [
  {
    id: "apple",
    supports: ["movie", "tv"],
    label: "Apple",
    bgClass: "bg-zinc-700",
    textClass: "text-white",
    borderClass: "border-zinc-600",
  },
  {
    id: "fandango",
    supports: ["movie", "tv"],
    label: "Fandango",
    bgClass: "bg-orange-900",
    textClass: "text-white",
    borderClass: "border-orange-800",
  },
  {
    id: "amazon",
    supports: ["movie", "tv"],
    label: "Prime Video",
    bgClass: "bg-blue-900",
    textClass: "text-white",
    borderClass: "border-blue-800",
  },
  {
    id: "movies_anywhere",
    supports: ["movie"],
    label: "Movies Anywhere",
    bgClass: "bg-purple-900",
    textClass: "text-white",
    borderClass: "border-purple-800",
  },
] as const satisfies readonly {
  id: string;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  supports: readonly ("movie" | "tv")[];
}[];

export const RESOLUTIONS = ["4K", "HD", "SD"] as const;
export const DEFAULT_RESOLUTION = "4K";

// Can this platform be picked for a movie / a TV show?
export function supportsMediaType(
  platform: (typeof PLATFORMS)[number],
  mediaType: "movie" | "tv"
): boolean {
  return (platform.supports as readonly string[]).includes(mediaType);
}

export function getPlatform(id: string) {
  return PLATFORMS.find((p) => p.id === id);
}

// Sort an array of platform objects by the canonical PLATFORMS order.
// Pass any array that has a `platform` string field.
export function sortPlatforms<T extends { platform: string }>(items: T[]): T[] {
  const order: string[] = PLATFORMS.map((p) => p.id);
  return [...items].sort(
    (a, b) => order.indexOf(a.platform) - order.indexOf(b.platform)
  );
}
