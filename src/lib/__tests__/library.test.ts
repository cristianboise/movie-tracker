import { describe, expect, it } from "vitest";
import {
  countByType,
  filterAndSort,
  matchesSearch,
  sortableTitle,
  type LibraryItem,
} from "@/lib/library";

function item(overrides: Partial<LibraryItem>): LibraryItem {
  return {
    mediaType: "movie",
    title: "Untitled",
    year: 2000,
    addedAt: "2024-01-01T00:00:00Z",
    genres: [],
    cast: [],
    director: null,
    creators: [],
    platforms: [{ platform: "apple" }],
    ...overrides,
  };
}

const godfather = item({ title: "The Godfather", year: 1972, director: "Francis Ford Coppola", genres: ["Crime"], cast: ["Al Pacino"], addedAt: "2024-03-01T00:00:00Z" });
const alien = item({ title: "Alien", year: 1979, director: "Ridley Scott", genres: ["Horror"], platforms: [{ platform: "amazon" }], addedAt: "2024-02-01T00:00:00Z" });
const breakingBad = item({ mediaType: "tv", title: "Breaking Bad", year: 2008, creators: ["Vince Gilligan"], genres: ["Drama"], cast: ["Bryan Cranston"], addedAt: "2024-04-01T00:00:00Z" });
const all = [godfather, alien, breakingBad];

const defaults = { search: "", typeFilter: "all" as const, platformFilter: null, sortBy: "title-asc" as const };

describe("sortableTitle", () => {
  it("drops a leading article", () => {
    expect(sortableTitle("The Godfather")).toBe("Godfather");
    expect(sortableTitle("A Quiet Place")).toBe("Quiet Place");
    expect(sortableTitle("An Education")).toBe("Education");
    expect(sortableTitle("Theory of Everything")).toBe("Theory of Everything");
  });
});

describe("matchesSearch", () => {
  it("matches title, director, creator, genre and cast case-insensitively", () => {
    expect(matchesSearch(godfather, "godfa")).toBe(true);
    expect(matchesSearch(godfather, "COPPOLA")).toBe(true);
    expect(matchesSearch(breakingBad, "gilligan")).toBe(true);
    expect(matchesSearch(alien, "horror")).toBe(true);
    expect(matchesSearch(godfather, "pacino")).toBe(true);
  });

  it("treats blank search as match-all and rejects non-matches", () => {
    expect(matchesSearch(alien, "   ")).toBe(true);
    expect(matchesSearch(alien, "zzz")).toBe(false);
  });
});

describe("filterAndSort", () => {
  it("sorts A-Z ignoring leading articles", () => {
    expect(filterAndSort(all, defaults).map((i) => i.title)).toEqual(["Alien", "Breaking Bad", "The Godfather"]);
  });

  it("sorts by each option", () => {
    const titles = (sortBy: Parameters<typeof filterAndSort>[1]["sortBy"]) =>
      filterAndSort(all, { ...defaults, sortBy }).map((i) => i.title);
    expect(titles("title-desc")).toEqual(["The Godfather", "Breaking Bad", "Alien"]);
    expect(titles("added")).toEqual(["Breaking Bad", "The Godfather", "Alien"]);
    expect(titles("year-desc")).toEqual(["Breaking Bad", "Alien", "The Godfather"]);
    expect(titles("year-asc")).toEqual(["The Godfather", "Alien", "Breaking Bad"]);
  });

  it("filters by media type", () => {
    expect(filterAndSort(all, { ...defaults, typeFilter: "tv" }).map((i) => i.title)).toEqual(["Breaking Bad"]);
    expect(filterAndSort(all, { ...defaults, typeFilter: "movie" })).toHaveLength(2);
  });

  it("filters by platform and search together", () => {
    expect(filterAndSort(all, { ...defaults, platformFilter: "amazon" }).map((i) => i.title)).toEqual(["Alien"]);
    expect(filterAndSort(all, { ...defaults, platformFilter: "apple", search: "crime" }).map((i) => i.title)).toEqual(["The Godfather"]);
  });

  it("does not mutate the input array", () => {
    const copy = [...all];
    filterAndSort(all, { ...defaults, sortBy: "year-asc" });
    expect(all).toEqual(copy);
  });
});

describe("countByType", () => {
  it("counts each type and the total", () => {
    expect(countByType(all)).toEqual({ all: 3, movie: 2, tv: 1 });
    expect(countByType([])).toEqual({ all: 0, movie: 0, tv: 0 });
  });
});
