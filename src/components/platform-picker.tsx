"use client";

import { PLATFORMS, RESOLUTIONS, DEFAULT_RESOLUTION, supportsMediaType } from "@/lib/platforms";
import type { PlatformSelection, SeasonOption } from "@/lib/ownership";
import { PlatformLogo } from "@/components/platform-logos";

// Toggle which platforms a title is owned on, and pick a resolution for each.
// Controlled: the parent owns the selections.
//
// Pass `seasons` for a TV show. Each selected platform then also asks whether
// you own the complete series or only certain seasons. Leave it out for movies.
export function PlatformPicker({
  selections,
  onChange,
  seasons,
}: {
  selections: PlatformSelection[];
  onChange: (selections: PlatformSelection[]) => void;
  seasons?: SeasonOption[];
}) {
  function toggle(platformId: string) {
    if (selections.some((s) => s.platform === platformId)) {
      onChange(selections.filter((s) => s.platform !== platformId));
    } else {
      onChange([
        ...selections,
        { platform: platformId, resolution: DEFAULT_RESOLUTION, scope: "all" },
      ]);
    }
  }

  function update(platformId: string, changes: Partial<PlatformSelection>) {
    onChange(selections.map((s) => (s.platform === platformId ? { ...s, ...changes } : s)));
  }

  function toggleSeason(selection: PlatformSelection, seasonNumber: number) {
    const current = selection.scope === "all" ? [] : selection.scope;
    const next = current.includes(seasonNumber)
      ? current.filter((n) => n !== seasonNumber)
      : [...current, seasonNumber].sort((a, b) => a - b);
    update(selection.platform, { scope: next });
  }

  const pill = (active: boolean) =>
    `rounded-full text-sm font-medium transition-colors ${
      active
        ? "bg-foreground text-background"
        : "border border-input text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="space-y-2">
      {PLATFORMS.map((platform) => {
        const selection = selections.find((s) => s.platform === platform.id);
        // Movies Anywhere only carries movies
        if (seasons && !supportsMediaType(platform, "tv")) return null;

        return (
          <div key={platform.id} className="space-y-1.5">
            <button
              type="button"
              onClick={() => toggle(platform.id)}
              aria-pressed={!!selection}
              className={`flex min-h-12 w-full items-center gap-3 rounded-lg border p-3 text-left text-sm font-medium transition-colors ${
                selection
                  ? `${platform.bgClass} ${platform.textClass} border-transparent`
                  : "hover:bg-accent"
              }`}
            >
              <PlatformLogo platformId={platform.id} className="h-5 w-5 shrink-0" />
              {platform.label}
            </button>

            {selection && (
              <div className="space-y-2 pl-3">
                <div className="flex gap-2" role="group" aria-label={`${platform.label} resolution`}>
                  {RESOLUTIONS.map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => update(platform.id, { resolution: res })}
                      aria-pressed={selection.resolution === res}
                      className={`min-h-10 min-w-14 px-4 ${pill(selection.resolution === res)}`}
                    >
                      {res}
                    </button>
                  ))}
                </div>

                {seasons && (
                  <div className="space-y-2">
                    <div className="flex gap-2" role="group" aria-label={`${platform.label} ownership`}>
                      <button
                        type="button"
                        onClick={() => update(platform.id, { scope: "all" })}
                        aria-pressed={selection.scope === "all"}
                        className={`min-h-10 px-4 ${pill(selection.scope === "all")}`}
                      >
                        Complete series
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          update(platform.id, {
                            scope: selection.scope === "all" ? [] : selection.scope,
                          })
                        }
                        aria-pressed={selection.scope !== "all"}
                        className={`min-h-10 px-4 ${pill(selection.scope !== "all")}`}
                      >
                        Choose seasons
                      </button>
                    </div>

                    {selection.scope !== "all" && (
                      <div
                        className="flex flex-wrap gap-2"
                        role="group"
                        aria-label={`${platform.label} seasons`}
                      >
                        {seasons.map((season) => {
                          const owned = (selection.scope as number[]).includes(season.seasonNumber);
                          return (
                            <button
                              key={season.seasonNumber}
                              type="button"
                              onClick={() => toggleSeason(selection, season.seasonNumber)}
                              aria-pressed={owned}
                              title={`${season.episodeCount} episodes`}
                              className={`min-h-10 min-w-11 px-3 ${pill(owned)}`}
                            >
                              {season.label}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() =>
                            update(platform.id, {
                              scope:
                                (selection.scope as number[]).length === seasons.length
                                  ? []
                                  : seasons.map((s) => s.seasonNumber),
                            })
                          }
                          className="min-h-10 px-2 text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
                        >
                          {(selection.scope as number[]).length === seasons.length
                            ? "Clear"
                            : "Select all"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
