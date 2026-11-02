"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** iOS 26 bar button: a glass circle with a label-coloured glyph. */
export const headerIconButton =
  "glass flex size-11 items-center justify-center rounded-full text-label transition-transform duration-150 active:scale-90 disabled:opacity-40";
/** A text bar button on glass, e.g. ยกเลิก. */
export const headerTextButton =
  "glass inline-flex h-11 items-center justify-center rounded-full px-4 text-body text-label transition-transform duration-150 active:scale-95 disabled:opacity-40";
/** The confirming bar button, e.g. บันทึก: filled with the tint. */
export const headerProminentButton =
  "inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-tint px-4 text-body font-semibold text-white transition-transform duration-150 active:scale-95 disabled:opacity-50";

/**
 * Sticky iOS navigation bar shared by every screen. With `large`, the title sits below the bar
 * at Large Title size and moves into the bar once it scrolls under it, as on a top-level screen.
 * The bar is clear at the top of the page and turns to material once content runs beneath it.
 */
export function PageHeader({
  title,
  subtitle,
  left,
  right,
  large = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  large?: boolean;
}) {
  const topRef = useRef<HTMLDivElement>(null);
  const largeRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [collapsed, setCollapsed] = useState(!large);

  useEffect(() => {
    const top = topRef.current;
    if (!top) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(top);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const largeTitle = largeRef.current;
    if (!large || !largeTitle) return;
    // the title counts as gone once it slides under the 44px bar (plus the status bar inset)
    const observer = new IntersectionObserver(([entry]) => setCollapsed(!entry.isIntersecting), {
      rootMargin: "-52px 0px 0px 0px",
      threshold: 0.5,
    });
    observer.observe(largeTitle);
    return () => observer.disconnect();
  }, [large]);

  const inlineTitle = (
    <>
      <span className="block truncate text-body font-semibold leading-tight text-label">{title}</span>
      {subtitle && !large && <span className="block truncate text-caption text-label-2">{subtitle}</span>}
    </>
  );

  return (
    <>
      <div ref={topRef} aria-hidden className="h-0" />
      <header
        className={[
          "sticky top-0 z-20 pt-[env(safe-area-inset-top)] transition-[background-color,box-shadow] duration-200",
          scrolled ? "material-bar shadow-[0_0.5px_0_var(--ios-separator)]" : "bg-transparent",
        ].join(" ")}
      >
        <div className="relative mx-auto flex h-[3.25rem] max-w-md items-center justify-center px-4">
          {left && <div className="absolute left-4 top-1/2 -translate-y-1/2">{left}</div>}
          <div
            className={[
              "min-w-0 px-14 text-center transition-opacity duration-200",
              collapsed ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            {large ? <p aria-hidden>{inlineTitle}</p> : <h1>{inlineTitle}</h1>}
          </div>
          {right && <div className="absolute right-4 top-1/2 -translate-y-1/2">{right}</div>}
        </div>
      </header>
      {large && (
        <div ref={largeRef} className="mx-auto max-w-md px-5 pb-2 pt-1">
          <h1 className="text-balance break-words text-large-title font-bold text-label">{title}</h1>
          {subtitle && <p className="mt-0.5 text-subhead text-label-2">{subtitle}</p>}
        </div>
      )}
    </>
  );
}
