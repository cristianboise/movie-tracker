import { auth } from "@/lib/auth";
import { SignedInHome } from "@/components/signed-in-home";
import { SignInButton } from "@/components/auth-buttons";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="mx-auto max-w-sm px-4 text-center">
          <h1 className="text-3xl font-bold">Movie Tracker</h1>
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

  return <SignedInHome user={session.user} />;
}