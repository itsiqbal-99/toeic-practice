"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useRef, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  variant?: "dialog" | "drawer";
  showClose?: boolean;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  variant = "dialog",
  showClose = true,
}: DialogProps) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog__overlay" />
        <DialogPrimitive.Content
          className={`dialog__surface dialog__surface--${variant}`}
          onOpenAutoFocus={() => {
            returnFocus.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (!document.querySelector('[role="dialog"][data-state="open"]'))
              returnFocus.current?.focus();
          }}
        >
          <div className="dialog__header">
            <div>
              <DialogPrimitive.Title className="dialog__title">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="dialog__description">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            {showClose ? (
              <DialogPrimitive.Close
                className="icon-button"
                aria-label={`Close ${title}`}
              >
                <X aria-hidden="true" />
              </DialogPrimitive.Close>
            ) : null}
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const DialogClose = DialogPrimitive.Close;
