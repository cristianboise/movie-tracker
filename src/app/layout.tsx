import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Digital Movie Library",
  description: "Track your digital movie collection",
  appleWebApp: {
    capable: true,
    title: "Movie Library",
    statusBarStyle: "default",
  },
};

// viewport-fit=cover lets the layout use the full screen on notched phones
// (the safe-area padding keeps content clear of the notch and home indicator).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// Inline script that runs before React hydrates.
// Reads the new "theme-mode" key, falls back to system preference.
// Also clears the old "theme" key from the previous implementation.
// Prevents flash of wrong theme on page load.
const themeScript = `
(function(){
  try {
    localStorage.removeItem("theme");
    var t = localStorage.getItem("theme-mode");
    var d = t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (t === "light") d = false;
    if (d) document.documentElement.classList.add("dark");
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
