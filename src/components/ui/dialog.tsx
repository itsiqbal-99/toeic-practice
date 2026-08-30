"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  variant?: "dialog" | "drawer";
  showClose?: boolean;
}

export function Dialog({ open, onOpenChange, title, description, children, variant = "dialog", showClose = true }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog__overlay" />
        <DialogPrimitive.Content className={`dialog__surface dialog__surface--${variant}`}>
          <div className="dialog__header">
            <div>
              <DialogPrimitive.Title className="dialog__title">{title}</DialogPrimitive.Title>
              {description ? <DialogPrimitive.Description className="dialog__description">{description}</DialogPrimitive.Description> : null}
            </div>
            {showClose ? (
              <DialogPrimitive.Close className="icon-button" aria-label={`Close ${title}`}>
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
