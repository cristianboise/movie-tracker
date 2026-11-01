"use client";

import { PLATFORMS, RESOLUTIONS, DEFAULT_RESOLUTION } from "@/lib/platforms";
import { PlatformLogo } from "@/components/platform-logos";

export type PlatformSelection = {
  platform: string;
  resolution: string;
};

// Toggle which platforms a title is owned on, and pick a resolution for each.
// Controlled: the parent owns the selections.
export function PlatformPicker({
  selections,
  onChange,
}: {
  selections: PlatformSelection[];
  onChange: (selections: PlatformSelection[]) => void;
}) {
  function toggle(platformId: string) {
    if (selections.some((s) => s.platform === platformId)) {
      onChange(selections.filter((s) => s.platform !== platformId));
    } else {
      onChange([...selections, { platform: platformId, resolution: DEFAULT_RESOLUTION }]);
    }
  }

  function setResolution(platformId: string, resolution: string) {
    onChange(selections.map((s) => (s.platform === platformId ? { ...s, resolution } : s)));
  }

  return (
    <div className="space-y-2">
      {PLATFORMS.map((platform) => {
        const selection = selections.find((s) => s.platform === platform.id);

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
              <div className="flex gap-2 pl-3" role="group" aria-label={`${platform.label} resolution`}>
                {RESOLUTIONS.map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setResolution(platform.id, res)}
                    aria-pressed={selection.resolution === res}
                    className={`min-h-10 min-w-14 rounded-full px-4 text-sm font-medium transition-colors ${
                      selection.resolution === res
                        ? "bg-foreground text-background"
                        : "border border-input text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
