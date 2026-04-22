"use client";

import { useEffect } from "react";

// This catches errors in the root layout itself.
// Tailwind is not guaranteed to load here, so all styles are inline.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          backgroundColor: "#09090b",
          color: "#fafafa",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: 400, padding: "0 16px", textAlign: "center" }}>
          <div
            style={{
              margin: "0 auto 16px",
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: "rgba(239,68,68,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 14, color: "#a1a1aa", margin: "0 0 24px" }}>
            A critical error occurred. Try again or reload the page.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <button
              onClick={reset}
              style={{
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 8,
                border: "none",
                backgroundColor: "#fafafa",
                color: "#09090b",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 8,
                border: "1px solid #27272a",
                backgroundColor: "transparent",
                color: "#fafafa",
                cursor: "pointer",
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
