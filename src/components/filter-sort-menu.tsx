"use client";

import { PLATFORMS } from "@/lib/platforms";
import { PlatformLogo } from "@/components/platform-logos";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================================
// TYPES
// ============================================================

export type SortOption = "title-asc" | "title-desc" | "added" | "year-desc" | "year-asc";
export type ViewMode = "grid" | "compact" | "list";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "title-asc", label: "A\u2013Z" },
  { value: "title-desc", label: "Z\u2013A" },
  { value: "added", label: "Recently Added" },
  { value: "year-desc", label: "Newest First" },
  { value: "year-asc", label: "Oldest First" },
];

// SVG icons for view modes
function GridIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function CompactIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="4" height="4" />
      <rect x="10" y="3" width="4" height="4" />
      <rect x="17" y="3" width="4" height="4" />
      <rect x="3" y="10" width="4" height="4" />
      <rect x="10" y="10" width="4" height="4" />
      <rect x="17" y="10" width="4" height="4" />
      <rect x="3" y="17" width="4" height="4" />
      <rect x="10" y="17" width="4" height="4" />
      <rect x="17" y="17" width="4" height="4" />
    </svg>
  );
}

function ListIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

const VIEW_OPTIONS: { value: ViewMode; label: string; Icon: typeof GridIcon }[] = [
  { value: "grid", label: "Large", Icon: GridIcon },
  { value: "compact", label: "Small", Icon: CompactIcon },
  { value: "list", label: "List", Icon: ListIcon },
];

// ============================================================
// COMPONENT
// ============================================================

export function FilterSortMenu({
  sortBy,
  onSortChange,
  platformFilter,
  onPlatformFilterChange,
  platformCounts,
  totalCount,
  viewMode,
  onViewModeChange,
}: {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  platformFilter: string | null;
  onPlatformFilterChange: (platform: string | null) => void;
  platformCounts: Record<string, number>;
  totalCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}) {
  const hasActiveFilter = platformFilter !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-accent transition-colors"
          aria-label="Filter and sort"
        >
          {/* Sliders icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          {/* Active filter indicator dot */}
          {hasActiveFilter && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-0">
        {/* View mode section */}
        <div className="border-b px-3 py-2">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            View
          </p>
          <div className="flex gap-1">
            {VIEW_OPTIONS.map((opt) => {
              const isActive = viewMode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onViewModeChange(opt.value)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <opt.Icon active={isActive} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort section */}
        <div className="border-b px-3 py-2">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Sort by
          </p>
          <div className="flex flex-wrap gap-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  sortBy === option.value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Platform filter section */}
        <div className="px-3 py-2">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Platform
          </p>
          <div className="space-y-0.5">
            <button
              onClick={() => onPlatformFilterChange(null)}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
                platformFilter === null
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
                  onClick={() =>
                    onPlatformFilterChange(
                      platformFilter === platform.id ? null : platform.id
                    )
                  }
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "bg-accent font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <PlatformLogo
                    platformId={platform.id}
                    className="h-4 w-4 shrink-0"
                  />
                  <span className="flex-1 text-left">{platform.label}</span>
                  <span className="text-xs tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
