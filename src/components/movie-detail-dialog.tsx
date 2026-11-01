"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Barlow_Condensed } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DialogHeader } from "@/components/ui/dialog";
import { ResponsiveModal, ModalTitle } from "@/components/ui/responsive-modal";
import { formatRuntime } from "@/lib/format";
import {
  fromRows,
  ownershipLabel,
  selectionsAreValid,
  toEntries,
  toSeasonOptions,
  type PlatformSelection,
} from "@/lib/ownership";
import { getPosterUrl } from "@/lib/tmdb-mappers";
import { PlatformChips } from "@/components/platform-chips";
import { PlatformPicker } from "@/components/platform-picker";
import type { Movie } from "@/components/movie-collection";

const barlowCondensed = Barlow_Condensed({
  weight: "700",
  subsets: ["latin"],
  display: "swap",
});

// ============================================================
// TYPES
// ============================================================

// The parts of the cached TMDB metadata shown here
type TmdbData = {
  overview: string;
  tagline: string;
  genres: string[];
  rating: number;
  backdropUrl: string | null;
  cast: { name: string; character: string }[];
  imdbId: string | null;
  // Movies
  director?: string | null;
  // TV
  creators?: string[];
  status?: string | null;
  seasons?: { seasonNumber: number; name: string; episodeCount: number }[];
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
    setPlatformSelections(fromRows(movie.platforms));

    // Ignore the response if another title was opened in the meantime
    let cancelled = false;
    async function fetchTmdb() {
      try {
        const response = await fetch(
          `/api/tmdb/movie?id=${movie!.tmdbId}&type=${movie!.mediaType}`
        );
        const data = await response.json();
        if (response.ok && !cancelled) setTmdbData(data);
      } catch {
        // Not critical
      }
    }
    fetchTmdb();
    return () => {
      cancelled = true;
    };
  }, [movie, open]);

  if (!movie) return null;

  async function handleSave() {
    if (!movie) return;
    if (platformSelections.length === 0) {
      setError("Select at least one platform.");
      return;
    }
    if (!selectionsAreValid(platformSelections)) {
      setError("Choose at least one season for each platform.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/movies/${movie.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: toEntries(platformSelections),
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

  const creditLabel = tmdbData?.creators?.length ? "Created by" : "Director";
  const creditValue = tmdbData?.creators?.length
    ? tmdbData.creators.join(", ")
    : tmdbData?.director;
  const isTv = movie.mediaType === "tv";
  const runtimeText = formatRuntime(movie.mediaType, movie.runtime);
  const yearRuntime = `${isTv ? "TV \u00B7 " : ""}${movie.year ?? ""}${runtimeText ? ` \u00B7 ${runtimeText}` : ""}`;
  // Seasons come from TMDB, so editing a show waits until they've loaded
  const seasonOptions = isTv ? toSeasonOptions(tmdbData?.seasons) : undefined;
  const canEdit = !isTv || tmdbData !== null;
  const summary = isTv ? ownershipLabel(movie.platforms, movie.totalSeasons) : null;
  const posterUrl = getPosterUrl(movie.posterPath, "w342");

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      flush
      // It has a Notes box, and bottom sheets don't cope with the phone keyboard
      mobile="fullscreen"
    >
      {/* Backdrop hero */}
      {tmdbData?.backdropUrl ? (
        <div className="relative h-44 w-full overflow-hidden">
          <Image
            src={tmdbData.backdropUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 448px"
            priority
          />
          {/* Gradient overlay so text is readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-popover via-popover/60 to-transparent" />
          {/* Title + year overlaid on backdrop */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-3">
            <DialogHeader>
              <ModalTitle className="text-xl text-foreground drop-shadow-sm">
                {movie.title}
              </ModalTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{yearRuntime}</p>
          </div>
        </div>
      ) : (
        <div className="px-6 pt-4">
          <DialogHeader className="pr-8">
            <ModalTitle className="text-xl">{movie.title}</ModalTitle>
          </DialogHeader>
          <p className="mt-1 text-sm text-muted-foreground">{yearRuntime}</p>
        </div>
      )}

      {/* Content area — padded */}
      <div className="space-y-4 px-6 pb-6 pt-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {error}
          </div>
        )}

        {/* Poster + metadata */}
        <div className="flex gap-4">
          {posterUrl && (
            <Image
              src={posterUrl}
              alt={movie.title}
              width={112}
              height={160}
              className="h-40 w-28 shrink-0 rounded-lg object-cover shadow-md"
            />
          )}
          <div className="min-w-0 flex-1 space-y-1">
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
            {isTv && tmdbData?.status && (
              <p className="text-sm text-muted-foreground">
                {tmdbData.status}
                {movie.totalSeasons != null &&
                  ` \u00B7 ${movie.totalSeasons} season${movie.totalSeasons === 1 ? "" : "s"}`}
              </p>
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
                className={`mt-1 inline-flex min-h-8 items-center rounded px-2.5 text-black ${barlowCondensed.className}`}
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

        {/* Director / creators */}
        {creditValue && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {creditLabel}
            </p>
            <p className="text-sm text-foreground">{creditValue}</p>
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
                disabled={!canEdit}
              >
                Edit
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              {/* Notes field — above platforms */}
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

              <PlatformPicker
                selections={platformSelections}
                onChange={setPlatformSelections}
                seasons={seasonOptions}
              />

              {/* Stays visible at the bottom of the sheet while the list scrolls */}
              <div className="sticky bottom-0 -mx-6 flex gap-2 bg-popover px-6 pb-1 pt-2">
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setPlatformSelections(fromRows(movie.platforms));
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
              {summary && (
                <p className="text-sm text-muted-foreground">{summary}</p>
              )}
              <PlatformChips platforms={movie.platforms} size="md" showScope={isTv} />
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
                <Button variant="outline" onClick={() => setConfirmDelete(false)}>
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
    </ResponsiveModal>
  );
}
