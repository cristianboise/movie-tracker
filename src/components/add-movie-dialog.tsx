"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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

const PLATFORMS = [
  { id: "apple", label: "Apple" },
  { id: "fandango", label: "Fandango" },
  { id: "amazon", label: "Amazon" },
  { id: "movies_anywhere", label: "Movies Anywhere" },
];

const RESOLUTIONS = ["4K", "HD", "SD"];

// ============================================================
// COMPONENT
// ============================================================

export function AddMovieDialog({ onMovieAdded }: { onMovieAdded: () => void }) {
  // --- State ---
  // "step" controls which screen the dialog shows:
  // "search" = typing a movie title
  // "select" = picking from search results
  // "platforms" = choosing platforms for the selected movie
  const [step, setStep] = useState<"search" | "select" | "platforms">("search");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<SearchResult | null>(null);
  const [platformSelections, setPlatformSelections] = useState<PlatformSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Functions ---

  // Reset everything when the dialog closes
  function resetDialog() {
    setStep("search");
    setQuery("");
    setResults([]);
    setSelectedMovie(null);
    setPlatformSelections([]);
    setError(null);
  }

  // Search TMDB for movies matching the query
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

  // User picked a movie from the search results
  function handleSelectMovie(movie: SearchResult) {
    setSelectedMovie(movie);
    setStep("platforms");
  }

  // Toggle a platform on/off
  function togglePlatform(platformId: string) {
    const existing = platformSelections.find((p) => p.platform === platformId);
    if (existing) {
      // Remove it
      setPlatformSelections(platformSelections.filter((p) => p.platform !== platformId));
    } else {
      // Add it with default resolution HD
      setPlatformSelections([...platformSelections, { platform: platformId, resolution: "HD" }]);
    }
  }

  // Change the resolution for a specific platform
  function setResolution(platformId: string, resolution: string) {
    setPlatformSelections(
      platformSelections.map((p) =>
        p.platform === platformId ? { ...p, resolution } : p
      )
    );
  }

  // Save the movie to the collection
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

      // Success — close dialog and tell the parent to refresh
      setOpen(false);
      resetDialog();
      onMovieAdded();
    } catch {
      setError("Failed to save. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  // --- Render ---

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetDialog();
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full">+ Add Movie</Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "search" && "Search for a Movie"}
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
              <Input
                placeholder="Movie title..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
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
              ← Back to search
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
                      <p className="font-medium leading-tight">
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
              ← Back to results
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
                <p className="font-medium">{selectedMovie.title}</p>
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
                        className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-accent"
                        }`}
                      >
                        {platform.label}
                      </button>

                      {isSelected && (
                        <div className="flex gap-1 pl-3">
                          {RESOLUTIONS.map((res) => (
                            <Badge
                              key={res}
                              variant={
                                selection?.resolution === res
                                  ? "default"
                                  : "outline"
                              }
                              className="cursor-pointer"
                              onClick={() => setResolution(platform.id, res)}
                            >
                              {res}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              className="w-full"
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