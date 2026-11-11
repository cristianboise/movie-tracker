import { describe, expect, it, vi } from "vitest";
import { findMoviesAnywhereUrl, moviesAnywhereCandidates } from "@/lib/movies-anywhere";
import { getStoreLink } from "@/lib/store-links";

// A pretend Movies Anywhere that only has the given page names
function siteWith(...slugs: string[]) {
  return vi.fn(async (url: string) => ({
    status: slugs.some((slug) => url === `https://moviesanywhere.com/movie/${slug}`) ? 200 : 302,
  }));
}

describe("moviesAnywhereCandidates", () => {
  it("tries the name with the year first, then the plain name", () => {
    expect(moviesAnywhereCandidates("The Abyss", 1989)).toEqual(["the-abyss-1989", "the-abyss"]);
    expect(moviesAnywhereCandidates("The Abyss", null)).toEqual(["the-abyss"]);
    expect(moviesAnywhereCandidates("???", 1989)).toEqual([]);
  });
});

describe("findMoviesAnywhereUrl", () => {
  it("uses the plain name when that page exists", async () => {
    expect(await findMoviesAnywhereUrl("Inception", 2010, siteWith("inception"))).toBe(
      "https://moviesanywhere.com/movie/inception"
    );
  });

  it("uses the name with the year when only that page exists", async () => {
    expect(await findMoviesAnywhereUrl("The Abyss", 1989, siteWith("the-abyss-1989"))).toBe(
      "https://moviesanywhere.com/movie/the-abyss-1989"
    );
  });

  it("prefers the name with the year when both exist (remakes)", async () => {
    expect(await findMoviesAnywhereUrl("Dune", 2021, siteWith("dune", "dune-2021"))).toBe(
      "https://moviesanywhere.com/movie/dune-2021"
    );
  });

  it("falls back to the home page when no page exists", async () => {
    expect(await findMoviesAnywhereUrl("Not A Real Movie", 2020, siteWith())).toBe(
      "https://moviesanywhere.com/"
    );
  });

  it("asks without following redirects", async () => {
    const site = siteWith("inception");
    await findMoviesAnywhereUrl("Inception", null, site);
    expect(site).toHaveBeenCalledWith(
      "https://moviesanywhere.com/movie/inception",
      expect.objectContaining({ method: "HEAD", redirect: "manual" })
    );
  });

  it("fails rather than guess when Movies Anywhere can't be asked", async () => {
    const blocked = vi.fn(async () => ({ status: 403 }));
    await expect(findMoviesAnywhereUrl("Inception", 2010, blocked)).rejects.toThrow();
  });
});

describe("getStoreLink with a checked Movies Anywhere address", () => {
  it("uses the checked address instead of the guess", () => {
    const checked = "https://moviesanywhere.com/movie/the-abyss-1989";
    expect(getStoreLink("movies_anywhere", "The Abyss", { moviesAnywhereUrl: checked })).toBe(checked);
    expect(getStoreLink("movies_anywhere", "The Abyss")).toBe("https://moviesanywhere.com/movie/the-abyss");
    expect(getStoreLink("apple", "The Abyss", { moviesAnywhereUrl: checked })).toContain("tv.apple.com");
  });
});
