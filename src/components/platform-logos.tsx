// Platform logo icons as React components.
// These are ICON-sized marks, not full wordmarks — they work at 16–32px
// alongside text labels in filter pills, platform buttons, and badges.
//
// Apple: apple silhouette (from uploaded SVG). Uses currentColor.
// Fandango: ticket/stamp mark (from uploaded SVG). Brand orange + blue.
// Prime Video: play triangle on blue rounded square. Brand blue (#0779FF).
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
        fill="currentColor"
      />
      <path
        d="m16.3 8.2-6.58 1.76 1.32 4.91 6.59-1.76 1.32 4.91-6.58 1.76 1.32 4.91-6.58 1.76-1.6-5.95c.96-1.17 1.36-2.77.94-4.35-.42-1.57-1.58-2.77-3-3.3L1.82 6.79l13.15-3.51 1.33 4.91Z"
        fill="currentColor"
        opacity="0.4"
      />
    </svg>
  );
}

export function AmazonLogo({ className }: LogoProps) {
  // Prime Video wordmark icon (adapted from brand SVG).
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.5 5.5a1 1 0 1 1-2 0a1 1 0 0 1 2 0m10.803 1.254c.41.16.947.545.947 1.246c0 .703-.315 1.232-.817 1.55c-.448.283-.981.361-1.408.375a5 5 0 0 1-.511-.01c.144.212.321.32.542.337c.371.028.601-.06.725-.129a.7.7 0 0 0 .129-.09l.015-.015l-.004.006l-.006.006l-.003.005l-.002.002l-.001.002c-.001 0-.001.001.591.461l.592.46v.001l-.002.002l-.002.003l-.006.007l-.013.016a1.4 1.4 0 0 1-.152.156a2.2 2.2 0 0 1-.41.29c-.364.202-.883.364-1.563.313c-.786-.059-1.355-.503-1.703-1.038A3.2 3.2 0 0 1 18.75 9c0-.708.274-1.28.704-1.686c.413-.39.937-.598 1.423-.679c.48-.08.996-.048 1.426.12ZM20.48 8.408c.16.016.33.024.495.018c.323-.01.54-.07.655-.143a.21.21 0 0 0 .105-.14a1.3 1.3 0 0 0-.612-.028c-.264.044-.49.15-.64.29zm1.345-.224l-.007-.005zm1.12 5.692c.731.732-.896 4.062-1.418 3.862c-.262-.1-.067-.684.143-1.311c.214-.64.443-1.326.215-1.586c-.24-.273-1.014-.203-1.7-.14c-.603.055-1.137.103-1.181-.093c-.136-.61 3.208-1.465 3.94-.732Zm-20.682.578C4.171 15.303 7.984 17 12 17c2.537 0 4.884-.666 6.556-1.14c1.294-.368 2.184-.62 2.444-.36c.596.596-3.5 3-9 3C5.36 18.5.798 14.296 1 14c.057-.084.513.12 1.263.454M9.75 7v4.5h1.5V7zm-3.5 1.5V6.75h1.5v.073c.407-.074.843-.073 1.189-.073H9v1.5c-.543 0-.903.008-1.138.087a.3.3 0 0 0-.097.045a.3.3 0 0 0-.015.118v3h-1.5zm1.518-.124s0 .002-.003.004zm-.005.008l-.001.001v-.001ZM3.5 8.25c-.31 0-.75.335-.75 1s.44 1 .75 1s.75-.335.75-1s-.44-1-.75-1M2.25 7.165A2.06 2.06 0 0 1 3.5 6.75c1.347 0 2.25 1.232 2.25 2.5s-.903 2.5-2.25 2.5a2.06 2.06 0 0 1-1.25-.415V13H.75V6.75h1.5zm9.5-.415v4.75h1.5V8.437l.01-.004c.223-.101.488-.183.74-.183a.7.7 0 0 1 .25.038V11.5h1.5V8.438l.01-.005a1.9 1.9 0 0 1 .74-.183a.7.7 0 0 1 .25.038V11.5h1.5V8a.75.75 0 0 0-.093-.364a1.6 1.6 0 0 0-.377-.462c-.288-.24-.71-.424-1.28-.424c-.547 0-1.033.168-1.36.317h-.002c-.279-.185-.655-.317-1.138-.317c-.269 0-.523.04-.75.1v-.1z"
      />
    </svg>
  );
}

export function MoviesAnywhereLogo({ className }: LogoProps) {
  // Movies Anywhere icon (adapted from brand SVG).
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m12.073 25.33l-6.81 14.014c-.37.765-.675.698-.683-.15c-.093-9.825-.577-19.695 2.642-29.14a.859.859 0 0 1 1.575-.312c6.443 7.57 8.658 22.178 13.197 24.838a3.97 3.97 0 0 0 2.995.087c5.395-2.46 7.757-17.84 13.76-25.1a.839.839 0 0 1 1.55.312c3.467 10.383 3.485 19.92 2.937 29.317c-.05.846-.407.917-.794.16L35.281 25.33" />
      <path d="M14.1 18.999s4.16-8.46 7.774-10.537a3.96 3.96 0 0 1 2.98-.1c4.104 1.862 8.13 10.38 8.13 10.38" />
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
