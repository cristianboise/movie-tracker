import type { MetadataRoute } from "next";

// Lets the app be installed to a phone's home screen and run full screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Digital Movie Library",
    short_name: "Movie Library",
    description: "Track your digital movie collection",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
