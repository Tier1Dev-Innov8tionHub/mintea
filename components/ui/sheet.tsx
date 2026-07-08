"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 mx-auto max-w-[430px] rounded-t-3xl bg-white animate-in slide-in-from-bottom duration-300",
          className
        )}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-6 pb-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="px-6 pb-8 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
