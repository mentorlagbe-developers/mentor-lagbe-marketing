"use client";

import { useEffect } from "react";
import { CloseIcon } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ open, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-2 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close modal overlay"
        onClick={onClose}
      />

      <div className="relative z-10">
        <div className="pointer-events-none absolute -inset-3 rounded-[34px] border border-white/35 bg-white/18 backdrop-blur-xl" />
        <div className="pointer-events-none absolute -left-2 -top-2 h-10 w-10 rounded-full border border-white/55 bg-white/35" />
        <div className="pointer-events-none absolute -bottom-2 -right-2 h-10 w-10 rounded-full border border-white/55 bg-white/35" />

        <div
          className={cn(
            "relative flex h-[min(680px,calc(100vh-16px))] w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_30px_80px_-24px_rgba(15,23,42,0.45)]",
            className
          )}
        >
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          >
            <CloseIcon className="h-4 w-4" />
          </button>

          {children}
        </div>
      </div>
    </div>
  );
}
