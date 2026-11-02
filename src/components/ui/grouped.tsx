import type { CSSProperties, ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/** A 44pt+ row inside a grouped section. */
export const row = "flex min-h-11 items-center gap-3 px-4 py-2.5";
/** A row that navigates or acts: full width, iOS pressed highlight. */
export const pressableRow = `${row} w-full text-left transition-colors duration-100 active:bg-pressed hover:bg-fill-3/60`;
/** Separator inset when a row leads with a 32px avatar (16 padding + 32 + 12 gap). */
export const AVATAR_INSET = "3.75rem";

/**
 * An iOS inset grouped section: optional header above, rounded white (or dark) group of rows,
 * optional footer below.
 */
export function Section({
  header,
  action,
  footer,
  children,
  as: Group = "div",
  inset,
  className,
  groupClassName,
}: {
  header?: ReactNode;
  /** trailing control on the header line, e.g. a plain tint button */
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  as?: "div" | "ul";
  /** where hairlines start, e.g. AVATAR_INSET */
  inset?: string;
  className?: string;
  groupClassName?: string;
}) {
  return (
    <section className={className}>
      {(header || action) && (
        <div className="flex min-h-7 items-end justify-between gap-3 px-4 pb-1.5">
          {header && <h2 className="min-w-0 text-footnote text-label-2">{header}</h2>}
          {action}
        </div>
      )}
      <Group
        className={cn("ios-list overflow-hidden rounded-group bg-cell", groupClassName)}
        style={inset ? ({ "--separator-inset": inset } as CSSProperties) : undefined}
      >
        {children}
      </Group>
      {footer && <div className="px-4 pt-1.5 text-footnote text-label-2">{footer}</div>}
    </section>
  );
}

/** The disclosure chevron at the end of a navigating row. */
export function Disclosure() {
  return <ChevronRight aria-hidden className="size-4 shrink-0 text-label-3" strokeWidth={2.5} />;
}
