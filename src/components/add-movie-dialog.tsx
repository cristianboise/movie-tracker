"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PLATFORMS, RESOLUTIONS, DEFAULT_RESOLUTION } from "@/lib/platforms";
import { PlatformLogo } from "@/components/platform-logos";

// ============================================================
// TYPES
// ============================================================

type SearchResult = {
  tmdbId: number;
  title: string;
  year: string | null;
  overview: string;
  posterUrl: string | null;
  rating: number;
};

type PlatformSelection = {
  platform: string;
  resolution: string;
};

// ============================================================
// COMPONENT
// ============================================================

export function AddMovieDialog({
  onMovieAdded,
  existingTmdbIds = [],
  controlledOpen,
  onControlledOpenChange,
  initialQuery = "",
}: {
  onMovieAdded: () => void;
  existingTmdbIds?: number[];
  controlledOpen?: boolean;
  onControlledOpenChange?: (open: boolean) => void;
  initialQuery?: string;
}) {
  const [step, setStep] = useState<"search" | "platforms">("search");
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<SearchResult | null>(null);
  const [platformSelections, setPlatformSelections] = useState<PlatformSelection[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  function setOpen(value: boolean) {
    setInternalOpen(value);
    onControlledOpenChange?.(value);
  }

  // Debounced live search — fires 400ms after the user stops typing
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
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
    setStep("search");
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setSelectedMovie(null);
    setPlatformSelections([]);
    setNotes("");
    setError(null);
    setLastAdded(addedTitle);
    setTimeout(() => setLastAdded(null), 3000);
  }

  async function runSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tmdb/search?q=${encodeURIComponent(q)}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Search failed");
        return;
      }
      setResults(data.results);
      setHasSearched(true);
    } catch {
      setError("Failed to search. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectMovie(movie: SearchResult) {
    setSelectedMovie(movie);
    setStep("platforms");
  }

  function togglePlatform(platformId: string) {
    const existing = platformSelections.find((p) => p.platform === platformId);
    if (existing) {
      setPlatformSelections(platformSelections.filter((p) => p.platform !== platformId));
    } else {
      setPlatformSelections([
        ...platformSelections,
        { platform: platformId, resolution: DEFAULT_RESOLUTION },
      ]);
    }
  }

  function setResolution(platformId: string, resolution: string) {
    setPlatformSelections(
      platformSelections.map((p) =>
        p.platform === platformId ? { ...p, resolution } : p
      )
    );
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
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          resetDialog();
          onControlledOpenChange?.(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-accent transition-colors"
          aria-label="Add movie"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {step === "search" ? "Add Movie" : selectedMovie?.title}
          </DialogTitle>
        </DialogHeader>

        {lastAdded && (
          <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            ✓ &ldquo;{lastAdded}&rdquo; added to your collection
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* SEARCH — input + live results */}
        {step === "search" && (
          <div className="space-y-3">
            {/* Search input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runSearch(query);
              }}
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Movie title..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-9 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {/* Spinner while loading, × when idle with text */}
                {loading ? (
                  <svg
                    className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                ) : null}
              </div>
            </form>

            {/* Live results */}
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
                    className="flex w-full items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent transition-colors"
                  >
                    {movie.posterUrl ? (
                      <Image
                        src={movie.posterUrl}
                        alt={movie.title}
                        width={56}
                        height={80}
                        className="h-20 w-14 rounded object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="flex h-20 w-14 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                        No img
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium leading-tight">
                        {movie.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {movie.year || "Unknown year"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
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
                onClick={() => {
                  setStep("search");
                  setPlatformSelections([]);
                }}
              >
                &larr; Back to results
              </Button>

              <div className="flex gap-3">
                {selectedMovie.posterUrl && (
                  <Image
                    src={selectedMovie.posterUrl}
                    alt={selectedMovie.title}
                    width={80}
                    height={112}
                    className="h-28 w-20 rounded object-cover"
                    sizes="80px"
                  />
                )}
                <div>
                  <p className="text-base font-medium">{selectedMovie.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedMovie.year}
                  </p>
                </div>
              </div>

              {isDuplicate ? (
                <div className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                  This movie is already in your collection. Open it from your collection to edit platforms or notes.
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
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      Where do you own this movie?
                    </p>
                    <div className="space-y-2">
                      {PLATFORMS.map((platform) => {
                        const isSelected = platformSelections.some(
                          (p) => p.platform === platform.id
                        );
                        const selection = platformSelections.find(
                          (p) => p.platform === platform.id
                        );

                        return (
                          <div key={platform.id} className="space-y-1">
                            <button
                              onClick={() => togglePlatform(platform.id)}
                              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm font-medium transition-colors ${
                                isSelected
                                  ? `${platform.bgClass} ${platform.textClass} border-transparent`
                                  : "hover:bg-accent"
                              }`}
                            >
                              <PlatformLogo
                                platformId={platform.id}
                                className="h-5 w-5 shrink-0"
                              />
                              {platform.label}
                            </button>

                            {isSelected && (
                              <div className="flex gap-1 pl-3">
                                {RESOLUTIONS.map((res) => (
                                  <button
                                    key={res}
                                    onClick={() => setResolution(platform.id, res)}
                                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                      selection?.resolution === res
                                        ? "bg-foreground text-background"
                                        : "border border-input text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    {res}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {!isDuplicate && (
                <Button
                  className="w-full text-base"
                  disabled={platformSelections.length === 0 || loading}
                  onClick={handleSave}
                >
                  {loading ? "Adding..." : "Add to Collection"}
                </Button>
              )}
            </div>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
