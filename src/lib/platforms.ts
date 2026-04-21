// Central definition of platforms, their display names, and brand colors.
// Used by every component that shows platform tags or filters.

export const PLATFORMS = [
  {
    id: "apple",
    label: "Apple",
    bgClass: "bg-zinc-300",
    textClass: "text-zinc-900",
    borderClass: "border-zinc-400",
  },
  {
    id: "fandango",
    label: "Fandango",
    bgClass: "bg-orange-600",
    textClass: "text-white",
    borderClass: "border-orange-600",
  },
  {
    id: "amazon",
    label: "Prime Video",
    bgClass: "bg-[#0779FF]",
    textClass: "text-white",
    borderClass: "border-[#0779FF]",
  },
  {
    id: "movies_anywhere",
    label: "Movies Anywhere",
    bgClass: "bg-indigo-600",
    textClass: "text-white",
    borderClass: "border-indigo-600",
  },
] as const;

export const RESOLUTIONS = ["4K", "HD", "SD"] as const;
export const DEFAULT_RESOLUTION = "4K";

export function getPlatform(id: string) {
  return PLATFORMS.find((p) => p.id === id);
}
