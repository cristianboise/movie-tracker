import { useSyncExternalStore } from "react";

// Subscribes to a CSS media query. Returns `false` on the server and
// during hydration, then the real value, so nothing mismatches.
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

// Matches Tailwind's `md` breakpoint. Below it the app uses the
// phone layout: bottom sheets and a bottom tab bar.
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 768px)");
}
