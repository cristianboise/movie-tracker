// The app's clapperboard mark, drawn for server-rendered PNG icons
// (the home-screen icon and PWA manifest icons). Mirrors src/app/icon.svg.
export function AppIcon({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        background: "#111111",
        borderRadius: size * 0.1875,
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32">
        <rect x="4" y="16" width="24" height="13" rx="2" fill="#ffffff" />
        <g transform="rotate(-10 4 16)">
          <rect x="4" y="7" width="24" height="9" rx="2" fill="#ffffff" />
          <line x1="11" y1="7" x2="8" y2="16" stroke="#111111" strokeWidth="2.5" strokeLinecap="square" />
          <line x1="18" y1="7" x2="15" y2="16" stroke="#111111" strokeWidth="2.5" strokeLinecap="square" />
          <line x1="25" y1="7" x2="22" y2="16" stroke="#111111" strokeWidth="2.5" strokeLinecap="square" />
        </g>
      </svg>
    </div>
  );
}
