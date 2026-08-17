"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaneTakeoff, Users, ChevronRight } from "lucide-react";
import { getRecentTrips } from "@/components/trip-tracker";

export default function HomePage() {
  const router = useRouter();
  const [tripId, setTripId] = useState("");
  const [recentTrips, setRecentTrips] = useState<string[]>([]);

  useEffect(() => {
    setRecentTrips(getRecentTrips());
  }, []);

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const id = tripId.trim().toUpperCase();
    if (id) router.push(`/trips/${id}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-sm space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="rounded-2xl bg-slate-900 p-4">
              <PlaneTakeoff className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            TripSplit
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            หารค่าใช้จ่ายในทริป ง่าย ไม่ต้องสมัครบัญชี
          </p>
        </div>

        {/* Recent trips */}
        {recentTrips.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              ทริปของฉัน
            </p>
            <ul className="bg-white rounded-xl border divide-y">
              {recentTrips.map((id) => (
                <li key={id}>
                  <button
                    onClick={() => router.push(`/trips/${id}`)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-mono font-semibold tracking-widest text-slate-800">
                      {id}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4">
          <Button
            className="w-full h-12 text-base"
            onClick={() => router.push("/trips/new")}
          >
            สร้างทริปใหม่
          </Button>

          <div className="relative flex items-center gap-2 text-slate-400 text-xs">
            <div className="flex-1 border-t" />
            <span>หรือเข้าร่วมทริปที่มีอยู่</span>
            <div className="flex-1 border-t" />
          </div>

          <form onSubmit={handleJoin} className="flex gap-2">
            <Input
              placeholder="Trip ID เช่น ABC-1234"
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              className="h-12 uppercase placeholder:normal-case"
            />
            <Button type="submit" variant="outline" className="h-12 shrink-0">
              <Users className="h-4 w-4 mr-1" />
              เข้าร่วม
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
