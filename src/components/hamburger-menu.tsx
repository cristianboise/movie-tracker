"use client";

import Image from "next/image";
import { Download, LogOut, Menu } from "lucide-react";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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

function UserBadge({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-2.5 px-2 py-2.5">
      {user.image ? (
        <Image
          src={user.image}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 rounded-full"
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
  );
}

// Desktop: a dropdown from the toolbar
export function HamburgerMenu({ user, onExportCSV }: { user: User; onExportCSV: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent"
          aria-label="Menu"
        >
          <Menu className="h-[22px] w-[22px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <UserBadge user={user} />
        <DropdownMenuSeparator />
        <ThemeToggle />
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onExportCSV}>Export to CSV</DropdownMenuItem>
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

// Phones: a bottom sheet opened from the tab bar
export function AccountSheet({
  user,
  open,
  onOpenChange,
  onExportCSV,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExportCSV: () => void;
}) {
  const rowClass =
    "flex min-h-12 w-full items-center gap-3 rounded-lg px-2 text-left text-base transition-colors hover:bg-accent active:bg-accent";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>Menu</DrawerTitle>
        </DrawerHeader>
        <UserBadge user={user} />
        <div className="my-1 border-t" />
        <ThemeToggle />
        <div className="my-1 border-t" />
        <button
          className={rowClass}
          onClick={() => {
            onExportCSV();
            onOpenChange(false);
          }}
        >
          <Download className="h-5 w-5 text-muted-foreground" />
          Export to CSV
        </button>
        <button
          className={`${rowClass} text-destructive`}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </DrawerContent>
    </Drawer>
  );
}
