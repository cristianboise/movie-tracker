// Where a platform badge sends you: the store's own page for finding a title.
//
// None of the stores (or TMDB) give us a link to an exact title, so:
// - Apple, Prime Video and Fandango open the store's search for the title.
// - Movies Anywhere has no search address, so we guess its title page from
//   the name. A wrong guess lands on the Movies Anywhere home page.
//
// On iPhone and iPad the Prime Video and Movies Anywhere links are registered
// to open their apps. Fandango at Home only opens its website.

// "Ocean's Eleven" -> "oceans-eleven", "WALL·E" -> "wall-e"
export function moviesAnywhereSlug(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // accents
    .replace(/['‘’]/g, "") // apostrophes vanish rather than split words
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getStoreLink(platformId: string, title: string): string | null {
  const name = title.trim();
  if (!name) return null;
  const q = encodeURIComponent(name);

  switch (platformId) {
    case "apple":
      return `https://tv.apple.com/search?term=${q}`;
    case "amazon":
      return `https://www.primevideo.com/search/?phrase=${q}`;
    case "fandango":
      return `https://athome.fandango.com/content/browse/search?searchString=${q}`;
    case "movies_anywhere": {
      const slug = moviesAnywhereSlug(name);
      return slug ? `https://moviesanywhere.com/movie/${slug}` : "https://moviesanywhere.com/";
    }
    default:
      return null;
  }
}
