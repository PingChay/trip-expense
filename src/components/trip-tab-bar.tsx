"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, House, LoaderCircle, Plus, Receipt, Users } from "lucide-react";

type TripTab = {
  href: (tripId: string) => string;
  label: string;
  icon: typeof House;
  match: (pathname: string, tripId: string) => boolean;
  emphasis?: boolean;
};

const tabs: readonly TripTab[] = [
  {
    href: (tripId: string) => `/trips/${tripId}`,
    label: "หน้าแรก",
    icon: House,
    match: (pathname: string, tripId: string) => pathname === `/trips/${tripId}`,
  },
  {
    href: (tripId: string) => `/trips/${tripId}/bills`,
    label: "บิลทั้งหมด",
    icon: Receipt,
    match: (pathname: string, tripId: string) =>
      pathname === `/trips/${tripId}/bills` || /^\/trips\/[^/]+\/bills\/[^/]+$/.test(pathname),
  },
  {
    href: (tripId: string) => `/trips/${tripId}/bills/new`,
    label: "เพิ่มบิล",
    icon: Plus,
    match: (pathname: string, tripId: string) => pathname === `/trips/${tripId}/bills/new`,
    emphasis: true,
  },
  {
    href: (tripId: string) => `/trips/${tripId}/members`,
    label: "สมาชิก",
    icon: Users,
    match: (pathname: string, tripId: string) => pathname === `/trips/${tripId}/members`,
  },
  {
    href: (tripId: string) => `/trips/${tripId}/report`,
    label: "สรุป",
    icon: BarChart3,
    match: (pathname: string, tripId: string) => pathname === `/trips/${tripId}/report`,
  },
];

export function TripTabBar({ tripId }: { tripId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    for (const tab of tabs) {
      router.prefetch(tab.href(tripId));
    }
  }, [router, tripId]);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
    <nav
      aria-busy={isPending}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
    >
      <div
        className={`absolute inset-x-0 top-0 h-0.5 bg-slate-900/80 transition-opacity ${isPending ? "opacity-100" : "opacity-0"}`}
      />
      <div className="mx-auto grid max-w-sm grid-cols-5 items-end gap-1 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const href = tab.href(tripId);
          const pending = pendingHref === href;
          const active = pending || tab.match(pathname, tripId);

          return (
            <Link
              key={tab.label}
              href={href}
              aria-disabled={pending}
              onClick={(event) => {
                if (pending || tab.match(pathname, tripId)) {
                  event.preventDefault();
                  return;
                }

                event.preventDefault();
                setPendingHref(href);
                startTransition(() => {
                  router.push(href);
                });
              }}
              className={[
                tab.emphasis
                  ? "-mt-5 flex flex-col items-center gap-1 text-[10px] font-semibold text-slate-700 transition-opacity"
                  : "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium transition-colors",
                tab.emphasis
                  ? ""
                  : active
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                pending ? "opacity-75" : "",
              ].join(" ")}
            >
              <span
                className={[
                  tab.emphasis
                    ? "flex size-14 items-center justify-center rounded-full border-4 border-slate-50 bg-slate-900 text-white shadow-lg shadow-slate-900/20 transition-transform"
                    : "flex items-center justify-center",
                  tab.emphasis && active ? "scale-105" : "",
                  pending ? "animate-pulse" : "",
                ].join(" ")}
              >
                {pending ? (
                  <LoaderCircle className={`${tab.emphasis ? "h-5 w-5" : "h-4 w-4"} animate-spin`} />
                ) : (
                  <Icon className={tab.emphasis ? "h-5 w-5" : "h-4 w-4"} />
                )}
              </span>
              <span>{pending ? "กำลังเปิด" : tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}