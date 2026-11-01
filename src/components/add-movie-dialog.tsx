"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogHeader } from "@/components/ui/dialog";
import { ResponsiveModal, ModalTitle } from "@/components/ui/responsive-modal";
import { PlatformPicker, type PlatformSelection } from "@/components/platform-picker";
import { getPosterUrl } from "@/lib/tmdb-mappers";

// ============================================================
// TYPES
// ============================================================

type SearchResult = {
  tmdbId: number;
  title: string;
  year: string | null;
  overview: string;
  posterPath: string | null;
  rating: number;
};

// ============================================================
// COMPONENT
// Controlled: the parent decides when it is open, so both the desktop
// toolbar button and the mobile tab bar can open it.
// ============================================================

export function AddMovieDialog({
  open,
  onOpenChange,
  onMovieAdded,
  existingTmdbIds = [],
  initialQuery = "",
  onViewExisting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMovieAdded: () => void;
  existingTmdbIds?: number[];
  initialQuery?: string;
  onViewExisting?: (tmdbId: number) => void;
}) {
  const [step, setStep] = useState<"search" | "platforms">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<SearchResult | null>(null);
  const [platformSelections, setPlatformSelections] = useState<PlatformSelection[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Only the most recent search may update the results. Without this a slow
  // response for "inc" can land after the one for "inception".
  const searchIdRef = useRef(0);

  function resetDialog() {
    setStep("search");
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setSelectedMovie(null);
    setPlatformSelections([]);
    setNotes("");
    setError(null);
    setLastAdded(null);
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

  // Debounced live search — fires 250ms after the user stops typing
  useEffect(() => {
    if (!query.trim()) {
      searchIdRef.current += 1;
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      runSearch(query);
    }, 250);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // When opened externally with an initialQuery, pre-fill the query.
  // The debounce effect above will handle firing the search.
  useEffect(() => {
    if (open && initialQuery) {
      setQuery(initialQuery);
    }
  }, [open, initialQuery]);

  async function runSearch(q: string) {
    if (!q.trim()) return;
    const searchId = ++searchIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tmdb/search?q=${encodeURIComponent(q)}`);
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

  function handleSelectMovie(movie: SearchResult) {
    setSelectedMovie(movie);
    setStep("platforms");
  }

  async function handleSave() {
    if (!selectedMovie || platformSelections.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: selectedMovie.tmdbId,
          platforms: platformSelections,
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to add movie");
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
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <ModalTitle className="text-lg">
          {step === "search" ? "Add Movie" : selectedMovie?.title}
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
                runSearch(query);
              }}
            >
              <div className="relative">
                <input
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  placeholder="Movie title..."
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

            {hasSearched && !loading && results.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No results found. Try a different title.
              </p>
            )}

            {results.length > 0 && (
              <div className="space-y-2">
                {results.slice(0, 10).map((movie) => (
                  <button
                    key={movie.tmdbId}
                    onClick={() => handleSelectMovie(movie)}
                    className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent active:bg-accent"
                  >
                    {movie.posterPath ? (
                      <Image
                        src={getPosterUrl(movie.posterPath, "w185")!}
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
                      <p className="text-base font-medium leading-tight">{movie.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {movie.year || "Unknown year"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {movie.overview}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PLATFORMS — movie selected, choose where you own it */}
        {step === "platforms" && selectedMovie && (() => {
          const isDuplicate = existingTmdbIds.includes(selectedMovie.tmdbId);
          return (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2"
                onClick={() => {
                  setStep("search");
                  setPlatformSelections([]);
                }}
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
                  <p className="text-sm text-muted-foreground">{selectedMovie.year}</p>
                </div>
              </div>

              {isDuplicate ? (
                <div className="space-y-3">
                  <div className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                    This movie is already in your collection.
                  </div>
                  {onViewExisting && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => onViewExisting(selectedMovie.tmdbId)}
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
                    <p className="mb-2 text-sm font-medium">Where do you own this movie?</p>
                    <PlatformPicker
                      selections={platformSelections}
                      onChange={setPlatformSelections}
                    />
                  </div>

                  {/* Stays visible at the bottom of the sheet while the list scrolls */}
                  <div className="sticky bottom-0 -mx-4 bg-popover px-4 pb-1 pt-2">
                    <Button
                      className="w-full text-base"
                      size="lg"
                      disabled={platformSelections.length === 0 || loading}
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
