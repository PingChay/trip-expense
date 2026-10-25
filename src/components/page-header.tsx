import type { ReactNode } from "react";

export const headerIconButton =
  "flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:opacity-40";

/** Sticky 56px top bar shared by every trip screen (report tabs stick below it at top-14). */
export function PageHeader({
  title,
  subtitle,
  left,
  right,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
      <div className="relative mx-auto flex h-14 max-w-sm items-center justify-center px-4">
        {left && <div className="absolute left-2 top-1/2 -translate-y-1/2">{left}</div>}
        <div className="min-w-0 px-11 text-center">
          <h1 className="truncate text-[15px] font-semibold leading-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-xs leading-tight text-slate-500">{subtitle}</p>}
        </div>
        {right && <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
    </header>
  );
}
