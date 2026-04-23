"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Barlow_Condensed } from "next/font/google";

const barlowCondensed = Barlow_Condensed({
  weight: "700",
  subsets: ["latin"],
  display: "swap",
});
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PLATFORMS, RESOLUTIONS, DEFAULT_RESOLUTION, getPlatform } from "@/lib/platforms";
import { PlatformLogo } from "@/components/platform-logos";

// ============================================================
// TYPES
// ============================================================

type Platform = {
  id: number;
  platform: string;
  resolution: string | null;
  notes: string | null;
};

type Movie = {
  id: number;
  tmdbId: number;
  title: string;
  year: number | null;
  runtime: number | null;
  posterUrl: string | null;
  notes: string | null;
  addedAt: string;
  platforms: Platform[];
};

type TmdbData = {
  tmdbId: number;
  title: string;
  year: string | null;
  runtime: number | null;
  overview: string;
  tagline: string;
  genres: string[];
  rating: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  cast: { name: string; character: string }[];
  director: string | null;
  imdbId: string | null;
};

type PlatformSelection = {
  platform: string;
  resolution: string;
};

// ============================================================
// COMPONENT
// ============================================================

export function MovieDetailDialog({
  movie,
  open,
  onClose,
  onMovieChanged,
}: {
  movie: Movie | null;
  open: boolean;
  onClose: () => void;
  onMovieChanged: () => void;
}) {
  const [tmdbData, setTmdbData] = useState<TmdbData | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [platformSelections, setPlatformSelections] = useState<PlatformSelection[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movie || !open) return;

    setTmdbData(null);
    setEditing(false);
    setConfirmDelete(false);
    setError(null);
    setNotes(movie.notes || "");
    setPlatformSelections(
      movie.platforms.map((p) => ({
        platform: p.platform,
        resolution: p.resolution || DEFAULT_RESOLUTION,
      }))
    );

    async function fetchTmdb() {
      setLoading(true);
      try {
        const response = await fetch(`/api/tmdb/movie?id=${movie!.tmdbId}`);
        const data = await response.json();
        if (response.ok) {
          setTmdbData(data);
        }
      } catch {
        // Not critical
      } finally {
        setLoading(false);
      }
    }
    fetchTmdb();
  }, [movie, open]);

  if (!movie) return null;

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
    if (!movie) return;
    if (platformSelections.length === 0) {
      setError("Select at least one platform.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/movies/${movie.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: platformSelections,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save");
        return;
      }

      setEditing(false);
      onMovieChanged();
    } catch {
      setError("Failed to save. Check your connection.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!movie) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/movies/${movie.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onClose();
        onMovieChanged();
      }
    } catch {
      setError("Failed to delete.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md p-0">
        {/* Backdrop hero */}
        {tmdbData?.backdropUrl ? (
          <div className="relative h-44 w-full overflow-hidden rounded-t-lg">
            <Image
              src={tmdbData.backdropUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 448px"
              priority
            />
            {/* Gradient overlay so text is readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            {/* Title + year overlaid on backdrop */}
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-3">
              <DialogHeader>
                <DialogTitle className="text-xl text-foreground drop-shadow-sm">
                  {movie.title}
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                {movie.year}{movie.runtime ? ` \u00B7 ${movie.runtime} min` : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-6 pt-6">
            <DialogHeader>
              <DialogTitle className="text-xl">{movie.title}</DialogTitle>
            </DialogHeader>
            <p className="mt-1 text-sm text-muted-foreground">
              {movie.year}{movie.runtime ? ` \u00B7 ${movie.runtime} min` : ""}
            </p>
          </div>
        )}

        {/* Content area — padded */}
        <div className="space-y-4 px-6 pb-6">

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Poster + metadata */}
        <div className="flex gap-4">
          {movie.posterUrl && (
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              width={112}
              height={160}
              className="h-40 w-28 rounded-lg object-cover shadow-md"
              sizes="112px"
            />
          )}
          <div className="flex-1 space-y-1">
            {tmdbData?.tagline && (
              <p className="text-sm italic text-muted-foreground">
                &ldquo;{tmdbData.tagline}&rdquo;
              </p>
            )}
            {tmdbData?.genres && (
              <div className="flex flex-wrap gap-1 pt-1">
                {tmdbData.genres.map((genre) => (
                  <Badge key={genre} variant="outline" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
            {tmdbData?.rating ? (
              <p className="text-sm text-muted-foreground">
                Rating: {tmdbData.rating.toFixed(1)}/10
              </p>
            ) : null}
            {tmdbData?.imdbId && (
              <a
                href={`https://www.imdb.com/title/${tmdbData.imdbId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-1 inline-flex items-center rounded px-2 py-0.5 text-black ${barlowCondensed.className}`}
                style={{
                  backgroundColor: "#F5C518",
                  fontSize: "1rem",
                  letterSpacing: "0.01em",
                }}
                aria-label={`View ${movie.title} on IMDb`}
              >
                IMDb
              </a>
            )}
          </div>
        </div>

        {/* Overview */}
        {tmdbData?.overview && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {tmdbData.overview}
          </p>
        )}

        {/* Director */}
        {tmdbData?.director && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Director
            </p>
            <p className="text-sm text-foreground">{tmdbData.director}</p>
          </div>
        )}

        {/* Cast */}
        {tmdbData?.cast && tmdbData.cast.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cast
            </p>
            <div className="space-y-0.5">
              {tmdbData.cast.map((member) => (
                <p key={member.name} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{member.name}</span>
                  {" as "}
                  {member.character}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Platforms — view or edit mode */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Platforms
            </p>
            {!editing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              {/* Notes field — above platforms */}
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

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setPlatformSelections(
                      movie.platforms.map((p) => ({
                        platform: p.platform,
                        resolution: p.resolution || DEFAULT_RESOLUTION,
                      }))
                    );
                    setNotes(movie.notes || "");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {movie.notes && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Notes: </span>
                  {movie.notes}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {movie.platforms.map((p) => {
                  const config = getPlatform(p.platform);
                  return (
                    <span
                      key={p.id}
                      aria-label={config?.label || p.platform}
                      className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium ${
                        config
                          ? `${config.bgClass} ${config.textClass}`
                          : "bg-gray-500 text-white"
                      }`}
                    >
                      <PlatformLogo
                        platformId={p.platform}
                        className="h-4 w-4 shrink-0"
                      />
                      {p.resolution && <span>{p.resolution}</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Delete button */}
        <div className="border-t pt-4">
          {confirmDelete ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">
                Remove &ldquo;{movie.title}&rdquo; from your collection?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  {saving ? "Removing..." : "Yes, Remove"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              Remove from Collection
            </Button>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
