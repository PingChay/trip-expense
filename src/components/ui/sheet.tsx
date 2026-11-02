"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { headerIconButton } from "@/components/page-header";
import { cn } from "@/lib/utils";

/** How far the sheet must be pulled down before letting go closes it. */
const DISMISS_DISTANCE = 96;

/**
 * An iOS bottom sheet on a native <dialog>: grabber, glass close button, and pull-down to
 * dismiss from the grabber or header. Open it with `ref.current.showModal()`.
 */
export function Sheet({
  ref,
  header,
  children,
  labelledBy,
}: {
  ref: RefObject<HTMLDialogElement | null>;
  header: ReactNode;
  children: ReactNode;
  labelledBy?: string;
}) {
  const drag = useRef<{ startY: number; dy: number } | null>(null);

  function move(dy: number) {
    const dialog = ref.current;
    if (dialog) dialog.style.transform = dy > 0 ? `translateY(${dy}px)` : "";
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      className="sheet"
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      onClose={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.transition = "";
      }}
    >
      <div
        className="touch-none select-none px-5 pt-2"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          drag.current = { startY: e.clientY, dy: 0 };
          e.currentTarget.setPointerCapture(e.pointerId);
          if (ref.current) ref.current.style.transition = "none";
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          drag.current.dy = Math.max(0, e.clientY - drag.current.startY);
          move(drag.current.dy);
        }}
        onPointerUp={() => {
          const dialog = ref.current;
          const dy = drag.current?.dy ?? 0;
          drag.current = null;
          if (!dialog) return;
          dialog.style.transition = "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)";
          if (dy > DISMISS_DISTANCE) dialog.close();
          else move(0);
        }}
        onPointerCancel={() => {
          drag.current = null;
          move(0);
        }}
      >
        <div aria-hidden className="mx-auto h-[5px] w-9 rounded-full bg-fill" />
        <div className="flex items-start justify-between gap-3 pt-3">
          <div className="min-w-0 flex-1">{header}</div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="ปิด"
            className={cn(headerIconButton, "relative -mr-1 size-9 after:absolute after:-inset-1 after:content-['']")}
          >
            <X className="size-[18px]" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div className="px-5 pb-5 pt-4">{children}</div>
    </dialog>
  );
}
