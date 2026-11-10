import { describe, expect, it } from "vitest";
import { getStoreLink, moviesAnywhereSlug } from "@/lib/store-links";
import { PLATFORMS } from "@/lib/platforms";

describe("moviesAnywhereSlug", () => {
  it("matches the page names Movies Anywhere uses", () => {
    expect(moviesAnywhereSlug("Inception")).toBe("inception");
    expect(moviesAnywhereSlug("Ocean's Eleven")).toBe("oceans-eleven");
    expect(moviesAnywhereSlug("Ocean’s Eleven")).toBe("oceans-eleven");
    expect(moviesAnywhereSlug("WALL·E")).toBe("wall-e");
    expect(moviesAnywhereSlug("Guardians of the Galaxy Vol. 2")).toBe("guardians-of-the-galaxy-vol-2");
    expect(moviesAnywhereSlug("The Lord of the Rings: The Fellowship of the Ring")).toBe(
      "the-lord-of-the-rings-the-fellowship-of-the-ring"
    );
    expect(moviesAnywhereSlug("Amélie")).toBe("amelie");
  });
});

describe("getStoreLink", () => {
  it("builds a search link for Apple, Prime Video and Fandango", () => {
    expect(getStoreLink("apple", "Fight Club")).toBe("https://tv.apple.com/search?term=Fight%20Club");
    expect(getStoreLink("amazon", "Fight Club")).toBe("https://www.primevideo.com/search/?phrase=Fight%20Club");
    expect(getStoreLink("fandango", "Fight Club")).toBe(
      "https://athome.fandango.com/content/browse/search?searchString=Fight%20Club"
    );
  });

  it("builds a title page link for Movies Anywhere", () => {
    expect(getStoreLink("movies_anywhere", "The Dark Knight")).toBe("https://moviesanywhere.com/movie/the-dark-knight");
    expect(getStoreLink("movies_anywhere", "!!!")).toBe("https://moviesanywhere.com/");
  });

  it("escapes characters that would break the address", () => {
    expect(getStoreLink("apple", "Fast & Furious")).toBe("https://tv.apple.com/search?term=Fast%20%26%20Furious");
    expect(getStoreLink("amazon", "What If...?")).toContain("phrase=What%20If...%3F");
    expect(getStoreLink("fandango", "50/50 #1")).toContain("searchString=50%2F50%20%231");
  });

  it("returns null for an unknown platform or blank title", () => {
    expect(getStoreLink("netflix", "Heat")).toBeNull();
    expect(getStoreLink("apple", "   ")).toBeNull();
  });

  it("has a link for every platform the app knows", () => {
    for (const p of PLATFORMS) expect(getStoreLink(p.id, "Heat")).toMatch(/^https:\/\//);
  });
});
