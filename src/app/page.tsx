"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaneTakeoff, Users, ChevronRight, MapPin, Plus } from "lucide-react";
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
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm space-y-9">
        {/* Hero */}
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-[1.25rem] bg-slate-900 shadow-[0_8px_24px_-8px_rgb(15_23_42/0.45)]">
              <PlaneTakeoff className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-[2rem] font-bold leading-none tracking-tight text-slate-900">
            TripSplit
          </h1>
          <p className="text-[15px] leading-relaxed text-slate-500">
            หารค่าใช้จ่ายในทริป ง่าย ไม่ต้องสมัครบัญชี
          </p>
        </div>

        {/* Recent trips */}
        {recentTrips.length > 0 && (
          <section className="space-y-2">
            <h2 className="px-1 text-sm font-semibold text-slate-700">ทริปของฉัน</h2>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
              {recentTrips.map((trip) => (
                <li key={trip.tripId}>
                  <button
                    onClick={() => router.push(`/trips/${trip.tripId}`)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 active:bg-slate-100"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{trip.tripName}</p>
                      <p className="mt-0.5 font-mono text-[11px] tracking-wide text-slate-400">{trip.tripId}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Actions */}
        <div className="space-y-5">
          <Button
            className="h-12 w-full gap-2 rounded-xl text-base shadow-[0_6px_16px_-6px_rgb(15_23_42/0.5)]"
            onClick={() => router.push("/trips/new")}
          >
            <Plus className="h-5 w-5" />
            สร้างทริปใหม่
          </Button>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 border-t border-slate-200" />
            <span>หรือเข้าร่วมทริปที่มีอยู่</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          <form onSubmit={handleJoin} className="flex gap-2">
            <Input
              placeholder="Trip ID เช่น ABC-1234"
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              className="h-12 rounded-xl bg-white px-3.5 font-mono uppercase tracking-wide placeholder:font-sans placeholder:normal-case placeholder:tracking-normal"
            />
            <Button type="submit" variant="outline" className="h-12 shrink-0 gap-1.5 rounded-xl bg-white px-4">
              <Users className="h-4 w-4" />
              เข้าร่วม
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
