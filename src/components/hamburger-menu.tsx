"use client";

import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id?: string;
};

function getFirstName(user: User): string {
  if (user.name) {
    return user.name.split(" ")[0];
  }
  if (user.email) {
    return user.email.split("@")[0];
  }
  return "User";
}

function getInitials(user: User): string {
  if (user.name) {
    const parts = user.name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  if (user.email) return user.email[0].toUpperCase();
  return "U";
}

export function HamburgerMenu({ user }: { user: User }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-accent transition-colors"
          aria-label="Menu"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {/* User info with avatar */}
        <div className="flex items-center gap-2.5 px-2 py-2.5">
          {user.image ? (
            <img
              src={user.image}
              alt=""
              className="h-8 w-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {getInitials(user)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{getFirstName(user)}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <ThemeToggle />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-destructive focus:text-destructive"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
