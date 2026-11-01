import { formatScope, groupOwnership, type OwnershipRow } from "@/lib/ownership";
import type { MediaType } from "@/lib/tmdb-mappers";

export type ExportRow = {
  mediaType: MediaType;
  title: string;
  year: number | null;
  runtime: number | null;
  notes: string | null;
  addedAt: string;
  platforms: OwnershipRow[];
};

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// "movies_anywhere" -> "Movies Anywhere"
function platformName(id: string): string {
  return id.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// "Apple 4K", or for TV "Apple 4K (S1–3)" / "Apple 4K (Complete series)"
function describePlatforms(row: ExportRow): string {
  return groupOwnership(row.platforms)
    .map((g) => {
      const label = platformName(g.platform);
      const base = g.resolution ? `${label} ${g.resolution}` : label;
      return row.mediaType === "tv" ? `${base} (${formatScope(g.scope)})` : base;
    })
    .join("; ");
}

export function buildCsv(rows: ExportRow[]): string {
  const headers = ["Title", "Type", "Year", "Runtime (min)", "Platforms", "Notes", "Added"];

  const lines = rows.map((row) => {
    const added = new Date(row.addedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return [
      escapeCSV(row.title),
      escapeCSV(row.mediaType === "tv" ? "TV Show" : "Movie"),
      escapeCSV(row.year),
      escapeCSV(row.runtime),
      escapeCSV(describePlatforms(row)),
      escapeCSV(row.notes),
      escapeCSV(added),
    ].join(",");
  });

  return [headers.join(","), ...lines].join("\n");
}
