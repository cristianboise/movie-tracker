import { auth } from "@/lib/auth";

// Call this at the top of any API route that requires authentication.
// Returns the user ID if signed in, or null if not.
export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user.id;
}