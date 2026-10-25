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
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80"
    >
      <div
        className={`absolute inset-x-0 top-0 h-0.5 origin-left bg-slate-900 transition-[opacity,transform] duration-500 ease-out ${isPending ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"}`}
      />
      <div className="mx-auto grid max-w-sm grid-cols-5 items-end gap-1 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5">
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
              aria-current={active ? "page" : undefined}
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
                "group flex flex-col items-center gap-1 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
                tab.emphasis
                  ? "-mt-6 text-[11px] font-semibold text-slate-900"
                  : [
                      "min-h-14 justify-center px-1 text-[11px] font-medium transition-colors",
                      active ? "text-slate-900" : "text-slate-400 hover:text-slate-700",
                    ].join(" "),
                pending ? "opacity-80" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "flex items-center justify-center transition-[transform,background-color,box-shadow] duration-200 ease-out",
                  tab.emphasis
                    ? "size-14 rounded-full border-4 border-background bg-slate-900 text-white shadow-[0_8px_20px_-6px_rgb(15_23_42/0.55)] group-active:scale-95"
                    : ["h-7 w-12 rounded-full", active ? "bg-slate-900/[0.07]" : "group-hover:bg-slate-100"].join(" "),
                  tab.emphasis && active ? "scale-105" : "",
                  pending ? "animate-pulse" : "",
                ].join(" ")}
              >
                {pending ? (
                  <LoaderCircle className={`${tab.emphasis ? "h-5 w-5" : "h-[18px] w-[18px]"} animate-spin`} />
                ) : (
                  <Icon
                    className={tab.emphasis ? "h-6 w-6" : "h-[18px] w-[18px]"}
                    strokeWidth={active || tab.emphasis ? 2.25 : 1.75}
                  />
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