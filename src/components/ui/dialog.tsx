"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "./button";

export function Dialog({ open, onClose, title, description, children, footer }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#15221b]/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="max-h-[92dvh] w-full overflow-auto rounded-t-[24px] bg-[#fafbf9] shadow-2xl sm:max-w-[640px] sm:rounded-[24px]">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e1e4df] bg-[#fafbf9]/95 px-5 py-5 backdrop-blur sm:px-7">
          <div><h2 className="m-0 text-xl font-extrabold tracking-[-.02em]">{title}</h2>{description && <p className="mt-1 mb-0 text-sm text-[#6b746f]">{description}</p>}</div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="關閉"><X size={19} /></Button>
        </header>
        <div className="px-5 py-6 sm:px-7">{children}</div>
        {footer && <footer className="sticky bottom-0 flex justify-end gap-3 border-t border-[#e1e4df] bg-[#fafbf9]/95 px-5 py-4 backdrop-blur sm:px-7">{footer}</footer>}
      </div>
    </div>
  );
}
