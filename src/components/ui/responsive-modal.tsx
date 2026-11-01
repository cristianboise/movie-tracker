"use client";

import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { useIsDesktop } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

// A modal that is a centered dialog on desktop and a bottom sheet on phones.
// Put content in as children; use <ModalTitle> for the (required) title.

const ModalContext = createContext({ isDesktop: true });

export function ResponsiveModal({
  open,
  onOpenChange,
  children,
  className,
  flush = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  // Extra classes for the desktop dialog only
  className?: string;
  // No padding, so the content can run edge to edge
  flush?: boolean;
}) {
  const isDesktop = useIsDesktop();

  return (
    <ModalContext.Provider value={{ isDesktop }}>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            aria-describedby={undefined}
            className={cn("max-h-[85dvh] overflow-y-auto sm:max-w-md", flush && "p-0", className)}
          >
            {children}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent flush={flush}>{children}</DrawerContent>
        </Drawer>
      )}
    </ModalContext.Provider>
  );
}

export function ModalTitle(props: React.ComponentProps<typeof DialogTitle>) {
  const { isDesktop } = useContext(ModalContext);
  return isDesktop ? <DialogTitle {...props} /> : <DrawerTitle {...props} />;
}
