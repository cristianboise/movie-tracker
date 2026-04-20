import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// This is the central auth configuration for the app.
// It tells Auth.js:
// - Which sign-in providers to offer (Google)
// - What to include in the session (the user's unique ID)
// - Where to redirect after sign-in

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],

  callbacks: {
    // The "jwt" callback runs every time a token is created or updated.
    // We add the user's unique ID (from Google) into the token so it's
    // available later when we need to identify who's making a request.
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // "sub" is the unique Google account ID — it never changes,
        // even if the user changes their email or name.
        token.userId = profile.sub;
      }
      return token;
    },

    // The "session" callback runs every time session data is read.
    // We copy the userId from the token into the session object,
    // making it accessible in our API routes and components.
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});