import { useSyncExternalStore } from "react";

// The part of the screen you can actually see. On a phone, opening the
// keyboard shrinks this (and Safari may also scroll it down a little), while
// the page's layout viewport stays the same size, leaving anything fixed to
// the bottom hidden behind the keyboard.
export type VisualViewportRect = { height: number; offsetTop: number };

// useSyncExternalStore needs the same object back until something changes
let cached: VisualViewportRect | null = null;

function read(): VisualViewportRect | null {
  const vv = typeof window === "undefined" ? undefined : window.visualViewport;
  if (!vv) return null;

  const height = Math.round(vv.height);
  const offsetTop = Math.round(vv.offsetTop);
  if (!cached || cached.height !== height || cached.offsetTop !== offsetTop) {
    cached = { height, offsetTop };
  }
  return cached;
}

function subscribe(onChange: () => void) {
  const vv = window.visualViewport;
  if (!vv) return () => {};
  vv.addEventListener("resize", onChange);
  vv.addEventListener("scroll", onChange);
  return () => {
    vv.removeEventListener("resize", onChange);
    vv.removeEventListener("scroll", onChange);
  };
}

// Returns null on the server, during hydration, and in browsers without
// visualViewport. Callers should fall back to 100dvh.
export function useVisualViewport(): VisualViewportRect | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
