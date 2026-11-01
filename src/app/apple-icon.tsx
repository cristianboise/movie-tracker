import { ImageResponse } from "next/og";
import { AppIcon } from "@/lib/app-icon";

// iOS home-screen icon (linked automatically as apple-touch-icon).
// iOS rounds the corners itself, so this one is full-bleed.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", background: "#111111", width: 180, height: 180 }}>
        <AppIcon size={180} />
      </div>
    ),
    size
  );
}
