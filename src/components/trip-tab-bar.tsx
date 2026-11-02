"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChartColumnBig, House, LoaderCircle, Plus, ReceiptText, Users } from "lucide-react";

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
    icon: ReceiptText,
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
    icon: ChartColumnBig,
    match: (pathname: string, tripId: string) => pathname === `/trips/${tripId}/report`,
  },
];

/** iOS 26 floating tab bar: a glass capsule above the home indicator, the add-bill button in its centre. */
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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
    >
      <div className="glass pointer-events-auto mx-auto grid h-16 max-w-md grid-cols-5 items-center rounded-full p-1">
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
                "group flex h-full flex-col items-center justify-center gap-0.5 rounded-full text-caption2 font-semibold outline-none transition-[background-color,color] duration-200 focus-visible:ring-2 focus-visible:ring-tint",
                tab.emphasis ? "text-tint" : active ? "bg-fill-3 text-tint" : "text-label hover:text-tint",
              ].join(" ")}
            >
              <span
                className={[
                  "flex items-center justify-center transition-transform duration-150 ease-out group-active:scale-90",
                  tab.emphasis ? "size-8 rounded-full bg-tint text-white" : "size-7",
                  pending ? "animate-pulse" : "",
                ].join(" ")}
              >
                {pending ? (
                  <LoaderCircle className="size-5 animate-spin" />
                ) : (
                  <Icon
                    className={tab.emphasis ? "size-5" : "size-6"}
                    strokeWidth={tab.emphasis ? 2.75 : active ? 2.25 : 1.75}
                  />
                )}
              </span>
              <span className="max-w-full truncate px-0.5">{pending ? "กำลังเปิด" : tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
