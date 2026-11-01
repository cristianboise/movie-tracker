import { getPlatform } from "@/lib/platforms";
import { formatScope, groupOwnership, type OwnershipRow } from "@/lib/ownership";
import { PlatformLogo } from "@/components/platform-logos";

// Read-only badges showing where a title is owned: one per platform and
// resolution, so a show owned on Apple in seasons 1-3 gets a single badge.
// "sm" fits under a poster or in a list row; "md" is for the detail view.
// `showScope` adds which seasons each badge covers (TV only).
export function PlatformChips({
  platforms,
  size = "sm",
  showScope = false,
  className = "",
}: {
  platforms: OwnershipRow[];
  size?: "sm" | "md";
  showScope?: boolean;
  className?: string;
}) {
  const chip =
    size === "md"
      ? "gap-1.5 px-3 py-1.5 text-sm"
      : "gap-1 px-2 py-1 text-xs";
  const logo = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <div className={`flex flex-wrap ${size === "md" ? "gap-1.5" : "gap-1"} ${className}`}>
      {groupOwnership(platforms).map((g) => {
        const config = getPlatform(g.platform);
        return (
          <span
            key={`${g.platform}-${g.resolution ?? ""}`}
            aria-label={`${config?.label || g.platform}${showScope ? `, ${formatScope(g.scope)}` : ""}`}
            className={`inline-flex items-center rounded font-medium ${chip} ${
              config ? `${config.bgClass} ${config.textClass}` : "bg-gray-500 text-white"
            }`}
          >
            <PlatformLogo platformId={g.platform} className={`${logo} shrink-0`} />
            {g.resolution && <span>{g.resolution}</span>}
            {showScope && (
              <span className="font-normal opacity-80">&middot; {formatScope(g.scope)}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
