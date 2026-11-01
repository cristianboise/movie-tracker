"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogHeader } from "@/components/ui/dialog";
import { ResponsiveModal, ModalTitle } from "@/components/ui/responsive-modal";
import { PlatformPicker } from "@/components/platform-picker";
import {
  selectionsAreValid,
  toEntries,
  toSeasonOptions,
  type PlatformSelection,
  type SeasonOption,
} from "@/lib/ownership";
import { getPosterUrl, type MediaType } from "@/lib/tmdb-mappers";

// ============================================================
// TYPES
// ============================================================

type SearchResult = {
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  year: string | null;
  overview: string;
  posterPath: string | null;
  rating: number;
};

// What to search: both kinds together, or just one
type SearchType = "multi" | MediaType;

const SEARCH_TYPES: { value: SearchType; label: string }[] = [
  { value: "multi", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV Shows" },
];

// ============================================================
// COMPONENT
// Controlled: the parent decides when it is open, so both the desktop
// toolbar button and the mobile tab bar can open it.
// ============================================================

export function AddMovieDialog({
  open,
  onOpenChange,
  onMovieAdded,
  existingTitles = [],
  initialQuery = "",
  onViewExisting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMovieAdded: () => void;
  // Titles already in the library, to catch duplicates
  existingTitles?: { mediaType: MediaType; tmdbId: number }[];
  initialQuery?: string;
  onViewExisting?: (mediaType: MediaType, tmdbId: number) => void;
}) {
  const [step, setStep] = useState<"search" | "platforms">("search");
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("multi");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<SearchResult | null>(null);
  const [platformSelections, setPlatformSelections] = useState<PlatformSelection[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // TV shows need their season list before you can say which seasons you own
  const [seasons, setSeasons] = useState<SeasonOption[] | null>(null);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [seasonsError, setSeasonsError] = useState(false);

  // Only the most recent search may update the results. Without this a slow
  // response for "inc" can land after the one for "inception".
  const searchIdRef = useRef(0);
  const seasonsIdRef = useRef(0);

  function resetDialog() {
    searchIdRef.current += 1;
    seasonsIdRef.current += 1;
    setStep("search");
    setQuery("");
    setSearchType("multi");
    setResults([]);
    setHasSearched(false);
    setSelectedMovie(null);
    setPlatformSelections([]);
    setNotes("");
    setError(null);
    setLastAdded(null);
    setSeasons(null);
    setSeasonsLoading(false);
    setSeasonsError(false);
  }

  function resetForNextSearch(addedTitle: string) {
    resetDialog();
    setLastAdded(addedTitle);
    setTimeout(() => setLastAdded(null), 3000);
  }

  // Reset when the dialog closes, however it was closed
  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (prevOpenRef.current && !open) {
      resetDialog();
    }
    prevOpenRef.current = open;
  }, [open]);

  // Debounced live search — fires 250ms after the user stops typing,
  // and straight away-ish when the Movies/TV toggle changes
  useEffect(() => {
    if (!query.trim()) {
      searchIdRef.current += 1;
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      runSearch(query, searchType);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, searchType]);

  // When opened externally with an initialQuery, pre-fill the query.
  // The debounce effect above will handle firing the search.
  useEffect(() => {
    if (open && initialQuery) {
      setQuery(initialQuery);
    }
  }, [open, initialQuery]);

  async function runSearch(q: string, type: SearchType) {
    if (!q.trim()) return;
    const searchId = ++searchIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/tmdb/search?q=${encodeURIComponent(q)}&type=${type}`
      );
      const data = await response.json();
      if (searchId !== searchIdRef.current) return;
      if (!response.ok) {
        setError(data.error || "Search failed");
        return;
      }
      setResults(data.results);
      setHasSearched(true);
    } catch {
      if (searchId !== searchIdRef.current) return;
      setError("Failed to search. Check your connection.");
    } finally {
      if (searchId === searchIdRef.current) setLoading(false);
    }
  }

  async function loadSeasons(tmdbId: number) {
    const loadId = ++seasonsIdRef.current;
    setSeasons(null);
    setSeasonsLoading(true);
    setSeasonsError(false);
    try {
      const response = await fetch(`/api/tmdb/movie?id=${tmdbId}&type=tv`);
      const data = await response.json();
      if (loadId !== seasonsIdRef.current) return;
      if (!response.ok) throw new Error(data.error);
      setSeasons(toSeasonOptions(data.seasons));
    } catch {
      if (loadId !== seasonsIdRef.current) return;
      setSeasonsError(true);
    } finally {
      if (loadId === seasonsIdRef.current) setSeasonsLoading(false);
    }
  }

  function handleSelectMovie(result: SearchResult) {
    setSelectedMovie(result);
    setPlatformSelections([]);
    setStep("platforms");
    if (result.mediaType === "tv") loadSeasons(result.tmdbId);
  }

  function handleBack() {
    seasonsIdRef.current += 1;
    setStep("search");
    setPlatformSelections([]);
    setSeasons(null);
    setSeasonsLoading(false);
    setSeasonsError(false);
  }

  async function handleSave() {
    if (!selectedMovie || !selectionsAreValid(platformSelections)) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType: selectedMovie.mediaType,
          tmdbId: selectedMovie.tmdbId,
          platforms: toEntries(platformSelections),
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to add title");
        return;
      }

      resetForNextSearch(selectedMovie.title);
      onMovieAdded();
    } catch {
      setError("Failed to save. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} mobile="fullscreen">
      <DialogHeader className="pr-10">
        <ModalTitle className="text-lg">
          {step === "search" ? "Add to Library" : selectedMovie?.title}
        </ModalTitle>
      </DialogHeader>

      <div className="mt-4 space-y-3">
        {lastAdded && (
          <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400" role="status">
            ✓ &ldquo;{lastAdded}&rdquo; added to your collection
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {error}
          </div>
        )}

        {/* SEARCH — input + live results */}
        {step === "search" && (
          <div className="space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runSearch(query, searchType);
              }}
            >
              <div className="relative">
                <input
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  placeholder="Movie or TV show title..."
                  aria-label="Search for a movie or TV show"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="h-12 w-full rounded-lg border border-input bg-background px-3 pr-11 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {/* Spinner while loading, × when idle with text */}
                {loading ? (
                  <LoaderCircle className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                ) : query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-0 top-1/2 flex h-12 w-11 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </form>

            <div className="flex gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Search in">
              {SEARCH_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSearchType(t.value)}
                  aria-pressed={searchType === t.value}
                  className={`min-h-10 flex-1 rounded-md px-3 text-sm font-medium transition-colors ${
                    searchType === t.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {hasSearched && !loading && results.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No results found. Try a different title.
              </p>
            )}

            {results.length > 0 && (
              <div className="space-y-2">
                {results.slice(0, 10).map((result) => (
                  <button
                    key={`${result.mediaType}-${result.tmdbId}`}
                    onClick={() => handleSelectMovie(result)}
                    className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent active:bg-accent"
                  >
                    {result.posterPath ? (
                      <Image
                        src={getPosterUrl(result.posterPath, "w185")!}
                        alt=""
                        width={56}
                        height={80}
                        className="h-20 w-14 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                        No img
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-medium leading-tight">{result.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        {result.year || "Unknown year"}
                        {result.mediaType === "tv" && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground">
                            TV
                          </span>
                        )}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {result.overview}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PLATFORMS — a title is selected, choose where you own it */}
        {step === "platforms" && selectedMovie && (() => {
          const isTv = selectedMovie.mediaType === "tv";
          const isDuplicate = existingTitles.some(
            (t) => t.mediaType === selectedMovie.mediaType && t.tmdbId === selectedMovie.tmdbId
          );
          const noun = isTv ? "show" : "movie";
          const needsSeasons = isTv && !isDuplicate;
          const seasonsReady = !needsSeasons || (seasons !== null && !seasonsError);
          const canSave =
            seasonsReady && selectionsAreValid(platformSelections) && !loading;

          return (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2"
                onClick={handleBack}
              >
                <ArrowLeft /> Back to results
              </Button>

              <div className="flex gap-3">
                {selectedMovie.posterPath && (
                  <Image
                    src={getPosterUrl(selectedMovie.posterPath, "w185")!}
                    alt=""
                    width={80}
                    height={112}
                    className="h-28 w-20 rounded object-cover"
                  />
                )}
                <div>
                  <p className="text-base font-medium">{selectedMovie.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedMovie.year}
                    {isTv && " · TV show"}
                  </p>
                </div>
              </div>

              {isDuplicate ? (
                <div className="space-y-3">
                  <div className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                    This {noun} is already in your collection.
                  </div>
                  {onViewExisting && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => onViewExisting(selectedMovie.mediaType, selectedMovie.tmdbId)}
                    >
                      View &amp; edit in your collection
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-sm font-medium">Notes</p>
                    <input
                      type="text"
                      placeholder="e.g., Director's cut, Extended edition..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="h-12 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">Where do you own this {noun}?</p>

                    {isTv && seasonsLoading && (
                      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground" role="status">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Loading seasons…
                      </div>
                    )}

                    {isTv && seasonsError && (
                      <div className="space-y-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                        <p>Couldn&rsquo;t load this show&rsquo;s seasons.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadSeasons(selectedMovie.tmdbId)}
                        >
                          Try again
                        </Button>
                      </div>
                    )}

                    {seasonsReady && (
                      <PlatformPicker
                        selections={platformSelections}
                        onChange={setPlatformSelections}
                        seasons={isTv ? (seasons ?? []) : undefined}
                      />
                    )}
                  </div>

                  {/* Stays visible at the bottom of the sheet while the list scrolls */}
                  <div className="sticky bottom-0 -mx-4 bg-popover px-4 pb-1 pt-2">
                    {platformSelections.some((s) => s.scope !== "all" && s.scope.length === 0) && (
                      <p className="mb-2 text-center text-xs text-muted-foreground">
                        Choose at least one season for each platform
                      </p>
                    )}
                    <Button
                      className="w-full text-base"
                      size="lg"
                      disabled={!canSave}
                      onClick={handleSave}
                    >
                      {loading ? "Adding..." : "Add to Collection"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </ResponsiveModal>
  );
}
