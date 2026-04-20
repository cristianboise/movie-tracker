"use client";

import { Button } from "@/components/ui/button";
import { signIn, signOut } from "next-auth/react";

export function SignInButton() {
  return (
    <Button
      className="w-full"
      onClick={() => signIn("google", { callbackUrl: "/" })}
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
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Sign out
    </Button>
  );
}