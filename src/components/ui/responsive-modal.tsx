"use client";

import { createContext, useContext } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useVisualViewport } from "@/hooks/use-visual-viewport";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

// A modal that is a centered dialog on desktop and, on phones, either a
// bottom sheet (the default) or a full-screen panel.
// Put content in as children; use <ModalTitle> for the (required) title.
//
// Use mobile="fullscreen" for anything where you type: the panel is sized to
// the visible area, so the keyboard can't cover the content. Bottom sheets
// are positioned against the whole screen, which puts them behind the
// keyboard on iPhone.

type Mode = "dialog" | "sheet" | "fullscreen";

const ModalContext = createContext<{ mode: Mode }>({ mode: "dialog" });

export function ResponsiveModal({
  open,
  onOpenChange,
  children,
  className,
  flush = false,
  mobile = "sheet",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  // Extra classes for the desktop dialog only
  className?: string;
  // No padding, so the content can run edge to edge (desktop dialog and sheet)
  flush?: boolean;
  mobile?: "sheet" | "fullscreen";
}) {
  const isDesktop = useIsDesktop();
  const viewport = useVisualViewport();
  const mode: Mode = isDesktop ? "dialog" : mobile;

  return (
    <ModalContext.Provider value={{ mode }}>
      {mode === "dialog" && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            aria-describedby={undefined}
            className={cn("max-h-[85dvh] overflow-y-auto sm:max-w-md", flush && "p-0", className)}
          >
            {children}
          </DialogContent>
        </Dialog>
      )}

      {mode === "sheet" && (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent flush={flush}>{children}</DrawerContent>
        </Drawer>
      )}

      {mode === "fullscreen" && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
              aria-describedby={undefined}
              // Cover exactly what's visible: shorter when the keyboard is up,
              // and moved down if Safari has scrolled the page under it.
              style={{
                top: viewport?.offsetTop ?? 0,
                height: viewport?.height ?? "100dvh",
              }}
              className="fixed inset-x-0 z-50 flex flex-col bg-popover text-sm text-popover-foreground outline-none data-open:animate-in data-open:fade-in-0"
            >
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
                {children}
              </div>
              {/* After the content in the DOM, so the first thing focused on open
                  is the content (the search box), not this button */}
              <DialogPrimitive.Close asChild>
                <Button variant="ghost" size="icon" className="absolute right-2 top-2 bg-popover/80 backdrop-blur">
                  <XIcon />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogPrimitive.Close>
            </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>
      )}
    </ModalContext.Provider>
  );
}

export function ModalTitle(props: React.ComponentProps<typeof DialogTitle>) {
  const { mode } = useContext(ModalContext);
  return mode === "sheet" ? <DrawerTitle {...props} /> : <DialogTitle {...props} />;
}
