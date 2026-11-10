import { ArrowUpRight } from "lucide-react";
import { getPlatform } from "@/lib/platforms";
import { getStoreLink } from "@/lib/store-links";
import { formatScope, groupOwnership, type OwnershipRow } from "@/lib/ownership";
import { PlatformLogo } from "@/components/platform-logos";

// Read-only badges showing where a title is owned: one per platform and
// resolution, so a show owned on Apple in seasons 1-3 gets a single badge.
// "sm" fits under a poster or in a list row; "md" is for the detail view.
// `showScope` adds which seasons each badge covers (TV only).
// `linkTitle` turns each badge into a link that opens that store's page for
// the title (the store's app on a phone, where the store supports it).
export function PlatformChips({
  platforms,
  size = "sm",
  showScope = false,
  linkTitle,
  touchDevice = false,
  className = "",
}: {
  platforms: OwnershipRow[];
  size?: "sm" | "md";
  showScope?: boolean;
  linkTitle?: string;
  // Phones and tablets get the address that opens the store's app
  touchDevice?: boolean;
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
        const label = config?.label || g.platform;
        const scope = showScope ? `, ${formatScope(g.scope)}` : "";
        const classes = `inline-flex items-center rounded font-medium ${chip} ${
          config ? `${config.bgClass} ${config.textClass}` : "bg-gray-500 text-white"
        }`;
        const content = (
          <>
            <PlatformLogo platformId={g.platform} className={`${logo} shrink-0`} />
            {g.resolution && <span>{g.resolution}</span>}
            {showScope && (
              <span className="font-normal opacity-80">&middot; {formatScope(g.scope)}</span>
            )}
          </>
        );
        const key = `${g.platform}-${g.resolution ?? ""}`;
        const href = linkTitle ? getStoreLink(g.platform, linkTitle, { touchDevice }) : null;

        if (href) {
          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${linkTitle} in ${label}${scope}`}
              className={`${classes} transition-opacity hover:opacity-85 active:opacity-70 pointer-coarse:min-h-11`}
            >
              {content}
              <ArrowUpRight className={`${logo} shrink-0 opacity-80`} aria-hidden />
            </a>
          );
        }

        return (
          <span key={key} aria-label={`${label}${scope}`} className={classes}>
            {content}
          </span>
        );
      })}
    </div>
  );
}
