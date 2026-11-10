// Where a platform badge sends you: the store's own page for finding a title.
//
// None of the stores (or TMDB) give us a link to an exact title, so:
// - Apple, Prime Video and Fandango open the store's search for the title.
// - Movies Anywhere has no search address, so we guess its title page from
//   the name. A wrong guess lands on the Movies Anywhere home page.
//
// What opens the store's app on iPhone and iPad (checked on a real iPhone):
// - Apple and Movies Anywhere: the same address as on a computer.
// - Prime Video: only its app-link address (app.primevideo.com) opens the
//   app, and it wants the title as `query`. In a computer browser that
//   address drops the title, so it is used on touch devices only.
// - Fandango at Home: its app can't be opened by a link, so always the website.

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

export function getStoreLink(
  platformId: string,
  title: string,
  // True on phones and tablets, where the store's app is the better target
  options: { touchDevice?: boolean } = {}
): string | null {
  const name = title.trim();
  if (!name) return null;
  const q = encodeURIComponent(name);

  switch (platformId) {
    case "apple":
      return `https://tv.apple.com/search?term=${q}`;
    case "amazon":
      return options.touchDevice
        ? `https://app.primevideo.com/search?query=${q}`
        : `https://www.primevideo.com/search/?phrase=${q}`;
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
