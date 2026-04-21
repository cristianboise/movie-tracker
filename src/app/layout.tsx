import type { Metadata } from "next";
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
  title: "Movie Tracker",
  description: "Track your digital movie collection",
};

// Inline script that runs before React hydrates.
// Reads localStorage, falls back to system preference, adds .dark immediately.
// Prevents the flash of wrong theme.
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem("theme");
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
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
