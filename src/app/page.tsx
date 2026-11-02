"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Disclosure, Section, pressableRow, row } from "@/components/ui/grouped";
import { PlaneTakeoff, Plus } from "lucide-react";
import { getRecentTrips, type RecentTrip } from "@/components/trip-tracker";

export default function HomePage() {
  const router = useRouter();
  const [tripId, setTripId] = useState("");
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);

  useEffect(() => {
    setRecentTrips(getRecentTrips());
  }, []);

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const id = tripId.trim().toUpperCase();
    if (id) router.push(`/trips/${id}`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-[calc(env(safe-area-inset-top)+3.5rem)]">
      {/* Welcome, like an iOS app's first screen */}
      <div className="flex flex-col items-center px-4 text-center">
        <div className="flex size-[4.5rem] items-center justify-center rounded-[1.125rem] bg-pass shadow-[0_8px_24px_-8px_rgb(0_0_0/0.45)]">
          <PlaneTakeoff className="size-9 text-white" strokeWidth={2} />
        </div>
        <h1 className="mt-5 text-large-title font-bold">TripSplit</h1>
        <p className="mt-1 text-body text-label-2">หารค่าใช้จ่ายในทริป ง่าย ไม่ต้องสมัครบัญชี</p>
      </div>

      <div className="mt-10 space-y-7">
        {recentTrips.length > 0 && (
          <Section header="ทริปของฉัน" as="ul" inset="3.75rem">
            {recentTrips.map((trip) => (
              <li key={trip.tripId}>
                <button onClick={() => router.push(`/trips/${trip.tripId}`)} className={pressableRow}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-[0.5rem] bg-tint text-white">
                    <PlaneTakeoff className="size-[18px]" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-label">{trip.tripName}</span>
                    <span className="block font-mono text-footnote tracking-wide text-label-2">{trip.tripId}</span>
                  </span>
                  <Disclosure />
                </button>
              </li>
            ))}
          </Section>
        )}

        <Button size="lg" className="w-full" onClick={() => router.push("/trips/new")}>
          <Plus strokeWidth={2.75} />
          สร้างทริปใหม่
        </Button>

        <form onSubmit={handleJoin}>
          <Section header="เข้าร่วมทริปที่มีอยู่" footer="ใส่ Trip ID ที่เพื่อนส่งมา หรือเปิดลิงก์เชิญจากแชท">
            <div className={`${row} py-0 pr-2`}>
              <Input
                placeholder="Trip ID เช่น ABC-1234"
                aria-label="Trip ID"
                autoCapitalize="characters"
                autoCorrect="off"
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                className="h-12 rounded-none bg-transparent px-0 font-mono uppercase tracking-wide placeholder:font-sans placeholder:normal-case placeholder:tracking-normal focus-visible:ring-0"
              />
              <Button type="submit" variant="secondary" size="sm" disabled={!tripId.trim()}>
                เข้าร่วม
              </Button>
            </div>
          </Section>
        </form>
      </div>
    </main>
  );
}
