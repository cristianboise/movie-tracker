// Central definition of platforms, their display names, and brand colors.
// Used by every component that shows platform tags or filters.

export const PLATFORMS = [
  {
    id: "apple",
    label: "Apple",
    bgClass: "bg-zinc-700",
    textClass: "text-white",
    borderClass: "border-zinc-600",
  },
  {
    id: "fandango",
    label: "Fandango",
    bgClass: "bg-orange-900",
    textClass: "text-white",
    borderClass: "border-orange-800",
  },
  {
    id: "amazon",
    label: "Prime Video",
    bgClass: "bg-blue-900",
    textClass: "text-white",
    borderClass: "border-blue-800",
  },
  {
    id: "movies_anywhere",
    label: "Movies Anywhere",
    bgClass: "bg-purple-900",
    textClass: "text-white",
    borderClass: "border-purple-800",
  },
] as const;

export const RESOLUTIONS = ["4K", "HD", "SD"] as const;
export const DEFAULT_RESOLUTION = "4K";

export function getPlatform(id: string) {
  return PLATFORMS.find((p) => p.id === id);
}

// Sort an array of platform objects by the canonical PLATFORMS order.
// Pass any array that has a `platform` string field.
export function sortPlatforms<T extends { platform: string }>(items: T[]): T[] {
  const order = PLATFORMS.map((p) => p.id);
  return [...items].sort(
    (a, b) => order.indexOf(a.platform) - order.indexOf(b.platform)
  );
}
