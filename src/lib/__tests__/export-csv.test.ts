import { describe, expect, it } from "vitest";
import { buildCsv, type ExportRow } from "@/lib/export-csv";
import { formatRuntime } from "@/lib/format";

const base = { year: 2010, runtime: 148, notes: null, addedAt: "2024-03-05T12:00:00Z" };

describe("buildCsv", () => {
  it("writes a header and one line per title", () => {
    const csv = buildCsv([
      {
        ...base,
        mediaType: "movie",
        title: "Inception",
        platforms: [
          { platform: "apple", resolution: "4K", seasonNumber: null },
          { platform: "movies_anywhere", resolution: "HD", seasonNumber: null },
        ],
      },
    ]);
    const [header, line] = csv.split("\n");
    expect(header).toBe("Title,Type,Year,Runtime (min),Platforms,Notes,Added");
    expect(line).toBe("Inception,Movie,2010,148,Apple 4K; Movies Anywhere HD,,Mar 5, 2024".replace("Mar 5, 2024", '"Mar 5, 2024"'));
  });

  it("describes TV ownership per platform and scope", () => {
    const row: ExportRow = {
      ...base,
      mediaType: "tv",
      title: "Breaking Bad",
      year: 2008,
      runtime: 47,
      platforms: [
        { platform: "apple", resolution: "4K", seasonNumber: 1 },
        { platform: "apple", resolution: "4K", seasonNumber: 2 },
        { platform: "amazon", resolution: "HD", seasonNumber: null },
      ],
    };
    const line = buildCsv([row]).split("\n")[1];
    expect(line).toContain("TV Show");
    expect(line).toContain("Apple 4K (S1–2); Amazon HD (Complete series)");
  });

  it("quotes values containing commas, quotes and newlines", () => {
    const line = buildCsv([
      {
        ...base,
        mediaType: "movie",
        title: 'Hello, "World"',
        notes: "line1\nline2",
        platforms: [{ platform: "apple", resolution: null, seasonNumber: null }],
      },
    ]);
    expect(line).toContain('"Hello, ""World"""');
    expect(line).toContain('"line1\nline2"');
    expect(line).toContain(",Apple,");
  });

  it("returns just the header for an empty library", () => {
    expect(buildCsv([])).toBe("Title,Type,Year,Runtime (min),Platforms,Notes,Added");
  });
});

describe("formatRuntime", () => {
  it("labels movies and episodes differently", () => {
    expect(formatRuntime("movie", 148)).toBe("148 min");
    expect(formatRuntime("tv", 47)).toBe("47 min/ep");
    expect(formatRuntime("movie", null)).toBeNull();
    expect(formatRuntime("tv", 0)).toBeNull();
  });
});
