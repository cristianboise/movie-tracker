"use client";

import { useState } from "react";
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

export function AddMovieDialog({ onMovieAdded }: { onMovieAdded: () => void }) {
  const [step, setStep] = useState<"search" | "select" | "platforms">("search");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<SearchResult | null>(null);
  const [platformSelections, setPlatformSelections] = useState<PlatformSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetDialog() {
    setStep("search");
    setQuery("");
    setResults([]);
    setSelectedMovie(null);
    setPlatformSelections([]);
    setError(null);
  }

  async function handleSearch() {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/tmdb/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Search failed");
        return;
      }

      setResults(data.results);
      setStep("select");
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to add movie");
        return;
      }

      setOpen(false);
      resetDialog();
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
        if (!isOpen) resetDialog();
      }}
    >
      <DialogTrigger asChild>
        {/* Compact + icon for the header row */}
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
            {step === "search" && "Add Movie"}
            {step === "select" && "Select a Movie"}
            {step === "platforms" && selectedMovie?.title}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* STEP 1: Search */}
        {step === "search" && (
          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Movie title..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="submit" disabled={loading || !query.trim()}>
                {loading ? "..." : "Search"}
              </Button>
            </form>
          </div>
        )}

        {/* STEP 2: Select from results */}
        {step === "select" && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep("search");
                setResults([]);
              }}
            >
              &larr; Back to search
            </Button>

            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No results found. Try a different title.
              </p>
            ) : (
              <div className="space-y-2">
                {results.slice(0, 10).map((movie) => (
                  <button
                    key={movie.tmdbId}
                    onClick={() => handleSelectMovie(movie)}
                    className="flex w-full items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent transition-colors"
                  >
                    {movie.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="h-20 w-14 rounded object-cover"
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

        {/* STEP 3: Choose platforms */}
        {step === "platforms" && selectedMovie && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep("select");
                setPlatformSelections([]);
              }}
            >
              &larr; Back to results
            </Button>

            <div className="flex gap-3">
              {selectedMovie.posterUrl && (
                <img
                  src={selectedMovie.posterUrl}
                  alt={selectedMovie.title}
                  className="h-28 w-20 rounded object-cover"
                />
              )}
              <div>
                <p className="text-base font-medium">{selectedMovie.title}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedMovie.year}
                </p>
              </div>
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

            <Button
              className="w-full text-base"
              disabled={platformSelections.length === 0 || loading}
              onClick={handleSave}
            >
              {loading ? "Adding..." : "Add to Collection"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
