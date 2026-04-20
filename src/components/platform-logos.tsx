// Platform logo icons as React components.
// These are ICON-sized marks, not full wordmarks — they work at 16–32px
// alongside text labels in filter pills, platform buttons, and badges.
//
// Apple: apple silhouette (from uploaded SVG). Uses currentColor.
// Fandango: ticket/stamp mark (from uploaded SVG). Brand orange + blue.
// Amazon: smile arrow. Brand orange (#FF9900).
// Movies Anywhere: "MA" lettermark. Brand blue (#1E3A5F).

type LogoProps = {
  className?: string;
};

export function AppleTVLogo({ className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 170 170"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Apple bite icon */}
      <path d="M150.4 130.3c-2.4 5.6-5.2 10.8-8.4 15.5-4.4 6.4-8 10.9-10.7 13.3-4.3 4-8.9 6.1-13.8 6.2-3.5 0-7.8-1-12.7-3.1-4.9-2-9.5-3-13.7-3-4.4 0-9.1 1-14.1 3-5 2.1-9.1 3.1-12.2 3.2-4.7.2-9.4-1.9-14.1-6.3-2.9-2.6-6.6-7.2-11-13.6-4.7-6.9-8.6-14.9-11.7-24C24.6 111.6 23 102 23 92.6c0-10.7 2.3-19.9 6.9-27.7 3.6-6.2 8.4-11.1 14.4-14.7 6-3.6 12.5-5.4 19.5-5.6 3.7 0 8.6 1.2 14.7 3.4 6 2.3 9.9 3.5 11.6 3.5 1.3 0 5.6-1.4 12.7-4.1 6.8-2.5 12.5-3.6 17.2-3.1 12.7 1 22.2 6 28.5 14.9-11.4 6.9-17 16.5-16.9 28.9.1 9.6 3.6 17.6 10.4 24 3.1 2.9 6.5 5.2 10.4 6.8-0.8 2.4-1.7 4.7-2.7 7ZM119.1 7c0 7.6-2.8 14.6-8.2 21.2-6.6 7.7-14.5 12.2-23.2 11.5-.1-.9-.2-1.9-.2-2.9 0-7.3 3.2-15 8.8-21.3 2.8-3.2 6.4-5.8 10.7-7.9 4.3-2 8.4-3.1 12.2-3.3.1 1 .2 1.9-.1 2.7Z" />
    </svg>
  );
}

export function FandangoLogo({ className }: LogoProps) {
  // Ticket/stamp icon from the uploaded Fandango SVG.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 29 28"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M24.51 7.86 22.4.02.27 5.93l2.11 7.85c1.32.27 2.45 1.26 2.82 2.65.37 1.39-.11 2.8-1.11 3.7l2.11 7.85 22.13-5.91-2.11-7.85c-1.33-.27-2.46-1.26-2.83-2.65-.37-1.39.12-2.81 1.12-3.71Z"
        fill="#FF7300"
      />
      <path
        d="m16.3 8.2-6.58 1.76 1.32 4.91 6.59-1.76 1.32 4.91-6.58 1.76 1.32 4.91-6.58 1.76-1.6-5.95c.96-1.17 1.36-2.77.94-4.35-.42-1.57-1.58-2.77-3-3.3L1.82 6.79l13.15-3.51 1.33 4.91Z"
        fill="white"
      />
    </svg>
  );
}

export function AmazonLogo({ className }: LogoProps) {
  // Amazon smile arrow — the most recognizable part of the Prime Video brand.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 60"
      className={className}
      aria-hidden="true"
    >
      {/* Play button triangle */}
      <path d="M25 8 L75 30 L25 52 Z" fill="#00A8E1" />
      {/* Smile arrow */}
      <path
        d="M15 50 Q50 65 85 50"
        stroke="#FF9900"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M82 44 L88 51 L80 54" fill="#FF9900" />
    </svg>
  );
}

export function MoviesAnywhereLogo({ className }: LogoProps) {
  // Movies Anywhere "MA" lettermark in brand blue.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="48" fill="#1E3A5F" />
      <path
        d="M20 72V28h8l12 28 12-28h8v44h-7V42l-10.5 24h-5L27 42v30h-7Z"
        fill="white"
      />
      <path
        d="M65 72l12-44h8l12 44h-7.5l-2.5-9H75l-2.5 9H65Zm12.5-15h9L83 44l-5.5 13Z"
        fill="white"
      />
    </svg>
  );
}

// Convenience wrapper — maps platform ID to the right logo component.
export function PlatformLogo({
  platformId,
  className,
}: {
  platformId: string;
  className?: string;
}) {
  switch (platformId) {
    case "apple":
      return <AppleTVLogo className={className} />;
    case "fandango":
      return <FandangoLogo className={className} />;
    case "amazon":
      return <AmazonLogo className={className} />;
    case "movies_anywhere":
      return <MoviesAnywhereLogo className={className} />;
    default:
      return null;
  }
}
