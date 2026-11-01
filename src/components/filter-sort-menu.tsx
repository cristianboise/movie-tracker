"use client";

import { Grid3x3, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { PLATFORMS } from "@/lib/platforms";
import type { SortOption, ViewMode } from "@/lib/library";
import { useIsDesktop } from "@/hooks/use-media-query";
import { PlatformLogo } from "@/components/platform-logos";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "title-asc", label: "A–Z" },
  { value: "title-desc", label: "Z–A" },
  { value: "added", label: "Recently Added" },
  { value: "year-desc", label: "Newest First" },
  { value: "year-asc", label: "Oldest First" },
];

const VIEW_OPTIONS: { value: ViewMode; label: string; Icon: typeof LayoutGrid }[] = [
  { value: "grid", label: "Large", Icon: LayoutGrid },
  { value: "compact", label: "Small", Icon: Grid3x3 },
  { value: "list", label: "List", Icon: List },
];

type Props = {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  platformFilter: string | null;
  onPlatformFilterChange: (platform: string | null) => void;
  platformCounts: Record<string, number>;
  totalCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

const SECTION_LABEL = "mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground";

// The controls themselves. Shown in a dropdown on desktop and a bottom
// sheet on phones, so sizes are touch-friendly below `md` and compact above.
function FilterSortPanel({
  sortBy,
  onSortChange,
  platformFilter,
  onPlatformFilterChange,
  platformCounts,
  totalCount,
  viewMode,
  onViewModeChange,
}: Props) {
  return (
    <>
      {/* View mode section */}
      <div className="border-b px-3 py-3 md:py-2">
        <p className={SECTION_LABEL}>View</p>
        <div className="flex gap-1.5 md:gap-1">
          {VIEW_OPTIONS.map((opt) => {
            const isActive = viewMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onViewModeChange(opt.value)}
                aria-pressed={isActive}
                className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium transition-colors md:min-h-8 md:text-xs ${
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <opt.Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort section */}
      <div className="border-b px-3 py-3 md:py-2">
        <p className={SECTION_LABEL}>Sort by</p>
        <div className="flex flex-wrap gap-1.5 md:gap-1">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value)}
              aria-pressed={sortBy === option.value}
              className={`min-h-11 rounded-full px-4 text-sm font-medium transition-colors md:min-h-7 md:px-2.5 md:text-xs ${
                sortBy === option.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Platform filter section */}
      <div className="px-3 py-3 md:py-2">
        <p className={SECTION_LABEL}>Platform</p>
        <div className="space-y-0.5">
          <button
            onClick={() => onPlatformFilterChange(null)}
            aria-pressed={platformFilter === null}
            className={`flex min-h-11 w-full items-center justify-between rounded-md px-2 text-sm transition-colors md:min-h-8 ${
              platformFilter === null
                ? "bg-accent font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <span>All</span>
            <span className="text-xs tabular-nums">{totalCount}</span>
          </button>
          {PLATFORMS.map((platform) => {
            const count = platformCounts[platform.id] || 0;
            if (count === 0) return null;
            const isActive = platformFilter === platform.id;
            return (
              <button
                key={platform.id}
                onClick={() => onPlatformFilterChange(isActive ? null : platform.id)}
                aria-pressed={isActive}
                className={`flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-sm transition-colors md:min-h-8 ${
                  isActive
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <PlatformLogo platformId={platform.id} className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{platform.label}</span>
                <span className="text-xs tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export function FilterSortMenu(props: Props) {
  const isDesktop = useIsDesktop();
  const hasActiveFilter = props.platformFilter !== null;

  const trigger = (
    <button
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent md:h-10 md:w-10"
      aria-label={hasActiveFilter ? "Filter and sort (filter active)" : "Filter and sort"}
    >
      <SlidersHorizontal className="h-5 w-5" />
      {/* Active filter indicator dot */}
      {hasActiveFilter && (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500 md:right-1.5 md:top-1.5" />
      )}
    </button>
  );

  if (isDesktop) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-0">
          <FilterSortPanel {...props} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="-mx-4 px-3 pb-2">
          <DrawerTitle className="text-lg">Filter &amp; sort</DrawerTitle>
        </DrawerHeader>
        <div className="-mx-4">
          <FilterSortPanel {...props} />
        </div>
        <DrawerClose asChild>
          <Button className="mt-3 w-full" size="lg">
            Done
          </Button>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}
