"use client";

import { Button } from "@/components/ui/button";

export function SignInButton() {
  return (
    <Button
      className="w-full"
      onClick={() => {
        // Redirect to the Auth.js sign-in page
        window.location.href = "/api/auth/signin";
      }}
    >
      Sign in with Google
    </Button>
  );
}

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        window.location.href = "/api/auth/signout";
      }}
    >
      Sign out
    </Button>
  );
}