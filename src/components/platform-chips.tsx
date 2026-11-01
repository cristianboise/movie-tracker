import { getPlatform, sortPlatforms } from "@/lib/platforms";
import { PlatformLogo } from "@/components/platform-logos";

// Read-only badges showing where a title is owned.
// "sm" fits under a poster or in a list row; "md" is for the detail view.
export function PlatformChips({
  platforms,
  size = "sm",
  className = "",
}: {
  platforms: { id: number; platform: string; resolution: string | null }[];
  size?: "sm" | "md";
  className?: string;
}) {
  const chip =
    size === "md"
      ? "gap-1.5 px-3 py-1.5 text-sm"
      : "gap-1 px-2 py-1 text-xs";
  const logo = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <div className={`flex flex-wrap ${size === "md" ? "gap-1.5" : "gap-1"} ${className}`}>
      {sortPlatforms(platforms).map((p) => {
        const config = getPlatform(p.platform);
        return (
          <span
            key={p.id}
            aria-label={config?.label || p.platform}
            className={`inline-flex items-center rounded font-medium ${chip} ${
              config ? `${config.bgClass} ${config.textClass}` : "bg-gray-500 text-white"
            }`}
          >
            <PlatformLogo platformId={p.platform} className={`${logo} shrink-0`} />
            {p.resolution && <span>{p.resolution}</span>}
          </span>
        );
      })}
    </div>
  );
}
