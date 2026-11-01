import { describe, expect, it } from "vitest";
import {
  getBackdropUrl,
  getPosterUrl,
  mapMovie,
  mapSearchResult,
  mapTitle,
  mapTv,
  type RawMovie,
  type RawTv,
} from "@/lib/tmdb-mappers";

const cast = [
  { id: 6, name: "F", character: "f", order: 5 },
  { id: 2, name: "B", character: "b", order: 1 },
  { id: 1, name: "A", character: "a", order: 0 },
  { id: 3, name: "C", character: "c", order: 2 },
  { id: 4, name: "D", character: "d", order: 3 },
  { id: 5, name: "E", character: "e", order: 4 },
];

const rawMovie: RawMovie = {
  id: 27205,
  title: "Inception",
  release_date: "2010-07-16",
  overview: "Dreams within dreams.",
  tagline: "Your mind is the scene of the crime.",
  runtime: 148,
  poster_path: "/poster.jpg",
  backdrop_path: "/backdrop.jpg",
  genres: [{ id: 28, name: "Action" }, { id: 878, name: "Science Fiction" }],
  vote_average: 8.4,
  credits: {
    cast,
    crew: [
      { job: "Producer", name: "Emma Thomas" },
      { job: "Director", name: "Christopher Nolan" },
    ],
  },
  external_ids: { imdb_id: "tt1375666" },
};

const rawTv: RawTv = {
  id: 1396,
  name: "Breaking Bad",
  first_air_date: "2008-01-20",
  overview: "A teacher turns to crime.",
  tagline: "",
  episode_run_time: [47],
  status: "Ended",
  poster_path: "/bb.jpg",
  backdrop_path: null,
  genres: [{ id: 18, name: "Drama" }],
  vote_average: 8.9,
  created_by: [{ name: "Vince Gilligan" }],
  seasons: [
    { season_number: 0, name: "Specials", episode_count: 11, air_date: "2009-02-17" },
    { season_number: 1, name: "Season 1", episode_count: 7, air_date: "2008-01-20" },
    { season_number: 2, name: "Season 2", episode_count: 13, air_date: null },
  ],
  credits: { cast },
  external_ids: { imdb_id: "tt0903747" },
};

describe("image URLs", () => {
  it("builds poster URLs at the requested size, defaulting to w500", () => {
    expect(getPosterUrl("/p.jpg")).toBe("https://image.tmdb.org/t/p/w500/p.jpg");
    expect(getPosterUrl("/p.jpg", "w185")).toBe("https://image.tmdb.org/t/p/w185/p.jpg");
  });

  it("returns null for missing paths", () => {
    expect(getPosterUrl(null)).toBeNull();
    expect(getBackdropUrl(undefined)).toBeNull();
  });
});

describe("mapMovie", () => {
  const movie = mapMovie(rawMovie);

  it("maps core fields", () => {
    expect(movie).toMatchObject({
      mediaType: "movie",
      tmdbId: 27205,
      title: "Inception",
      year: "2010",
      runtime: 148,
      director: "Christopher Nolan",
      imdbId: "tt1375666",
      posterPath: "/poster.jpg",
      posterUrl: "https://image.tmdb.org/t/p/w500/poster.jpg",
      backdropUrl: "https://image.tmdb.org/t/p/w1280/backdrop.jpg",
      genres: ["Action", "Science Fiction"],
    });
  });

  it("keeps the top 5 billed cast in billing order", () => {
    expect(movie.cast.map((c) => c.name)).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("tolerates missing credits, release date and external ids", () => {
    const sparse = mapMovie({ ...rawMovie, credits: undefined, release_date: "", external_ids: undefined });
    expect(sparse).toMatchObject({ cast: [], director: null, year: null, imdbId: null });
  });
});

describe("mapTv", () => {
  const show = mapTv(rawTv);

  it("maps core fields", () => {
    expect(show).toMatchObject({
      mediaType: "tv",
      tmdbId: 1396,
      title: "Breaking Bad",
      year: "2008",
      runtime: 47,
      status: "Ended",
      creators: ["Vince Gilligan"],
      imdbId: "tt0903747",
      backdropUrl: null,
    });
  });

  it("maps seasons including specials and missing air dates", () => {
    expect(show.seasons).toEqual([
      { seasonNumber: 0, name: "Specials", episodeCount: 11, airYear: "2009" },
      { seasonNumber: 1, name: "Season 1", episodeCount: 7, airYear: "2008" },
      { seasonNumber: 2, name: "Season 2", episodeCount: 13, airYear: null },
    ]);
  });

  it("falls back to the last episode's runtime when episode_run_time is empty", () => {
    const show = mapTv({ ...rawTv, episode_run_time: [], last_episode_to_air: { runtime: 55 } });
    expect(show.runtime).toBe(55);
    expect(mapTv({ ...rawTv, episode_run_time: undefined }).runtime).toBeNull();
  });

  it("tolerates missing creators and seasons", () => {
    const sparse = mapTv({ ...rawTv, created_by: undefined, seasons: undefined });
    expect(sparse.creators).toEqual([]);
    expect(sparse.seasons).toEqual([]);
  });
});

describe("mapTitle", () => {
  it("dispatches on media type", () => {
    expect(mapTitle("movie", rawMovie).mediaType).toBe("movie");
    expect(mapTitle("tv", rawTv).mediaType).toBe("tv");
  });
});

describe("mapSearchResult", () => {
  const base = { id: 1, overview: "o", poster_path: "/p.jpg", vote_average: 7 };

  it("uses the fallback type for single-type searches", () => {
    expect(mapSearchResult({ ...base, title: "Heat", release_date: "1995-12-15" }, "movie")).toMatchObject({
      mediaType: "movie",
      title: "Heat",
      year: "1995",
    });
    expect(mapSearchResult({ ...base, name: "Lost", first_air_date: "2004-09-22" }, "tv")).toMatchObject({
      mediaType: "tv",
      title: "Lost",
      year: "2004",
    });
  });

  it("uses media_type from multi search results and drops people", () => {
    expect(mapSearchResult({ ...base, media_type: "tv", name: "Lost" })?.mediaType).toBe("tv");
    expect(mapSearchResult({ ...base, media_type: "person", name: "Someone" })).toBeNull();
  });
});
