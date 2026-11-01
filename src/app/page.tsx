import { auth } from "@/lib/auth";
import { SignedInHome } from "@/components/signed-in-home";
import { SignInButton } from "@/components/auth-buttons";
import { getLibrary } from "@/lib/library-data";
import type { Movie } from "@/lib/movie-types";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background text-foreground">
        <div className="mx-auto max-w-sm px-4 text-center">
          <h1 className="text-3xl font-bold">Digital Movie Library</h1>
          <p className="mt-2 text-muted-foreground">
            Track your digital movie collection across platforms.
          </p>
          <div className="mt-6">
            <SignInButton />
          </div>
        </div>
      </main>
    );
  }

  // Load the library here so the movies arrive with the page. If that fails,
  // pass null and the screen fetches it itself (with a retry button).
  let initialMovies: Movie[] | null = null;
  if (session.user.id) {
    try {
      initialMovies = await getLibrary(session.user.id);
    } catch (error) {
      console.error("Failed to load library for the page", error);
    }
  }

  return <SignedInHome user={session.user} initialMovies={initialMovies} />;
}