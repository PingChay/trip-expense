import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ShareButton } from "./share-button";
import { TripTracker } from "@/components/trip-tracker";
import { TripTabBar } from "@/components/trip-tab-bar";
import { LogOut } from "lucide-react";

type Member = { id: string; name: string };
type Bill = { id: string; amount: number; payer_id: string; participants: string[]; currency: string };

function computeBalances(members: Member[], bills: Bill[]) {
  const balance: Record<string, number> = {};
  for (const m of members) balance[m.id] = 0;
  for (const bill of bills) {
    const share = bill.amount / bill.participants.length;
    balance[bill.payer_id] = (balance[bill.payer_id] ?? 0) + bill.amount;
    for (const pid of bill.participants) {
      balance[pid] = (balance[pid] ?? 0) - share;
    }
  }
  return balance;
}

export default async function TripDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: trip }, { data: members }, { data: bills }] = await Promise.all([
    supabase.from("trips").select("*").eq("id", id).maybeSingle(),
    supabase.from("members").select("id, name").eq("trip_id", id).order("created_at"),
    supabase.from("bills").select("id, amount, payer_id, participants, currency").eq("trip_id", id),
  ]);

  if (!trip) notFound();

  // group totals and balances by currency
  const totalByCurrency = (bills ?? []).reduce((acc, b) => {
    acc[b.currency] = (acc[b.currency] ?? 0) + Number(b.amount);
    return acc;
  }, {} as Record<string, number>);

  const balancesByCurrency = Object.keys(totalByCurrency).reduce((acc, currency) => {
    const currBills = (bills ?? []).filter((b) => b.currency === currency);
    acc[currency] = computeBalances(members ?? [], currBills.map((b) => ({ ...b, amount: Number(b.amount) })));
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const memberMap = Object.fromEntries((members ?? []).map((m) => [m.id, m.name]));

  const dateRange =
    trip.start_date && trip.end_date
      ? `${trip.start_date} – ${trip.end_date}`
      : trip.start_date
      ? trip.start_date
      : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <TripTracker tripId={id} tripName={trip.name} />
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3">
        <div className="relative mx-auto min-w-0 max-w-sm text-center">
          <h1 className="font-semibold text-slate-900 truncate">{trip.name}</h1>
          {dateRange && <p className="text-xs text-slate-400">{dateRange}</p>}
          <Link
            href="/"
            aria-label="ออกจากทริป"
            className="absolute left-0 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="max-w-sm mx-auto px-4 py-6 pb-28 space-y-5">
        {/* Trip ID + Share */}
        <div className="bg-white rounded-2xl border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Trip ID</span>
            <span className="font-mono font-bold text-lg tracking-widest text-slate-900">{id}</span>
          </div>
          <ShareButton tripId={id} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "สมาชิก", value: (members ?? []).length + " คน" },
            { label: "บิล", value: (bills ?? []).length + " รายการ" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border p-3 text-center">
              <p className="text-lg font-bold text-slate-900 leading-tight">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
          {/* ยอดรวมแยกต่อ currency */}
          <div className="bg-white rounded-2xl border p-3 text-center">
            {Object.keys(totalByCurrency).length === 0 ? (
              <p className="text-lg font-bold text-slate-900 leading-tight">0</p>
            ) : (
              <div className="space-y-0.5">
                {Object.entries(totalByCurrency).map(([cur, amt]) => (
                  <p key={cur} className="text-base font-bold text-slate-900 leading-tight tabular-nums">
                    {amt.toLocaleString("th-TH", { minimumFractionDigits: 0 })} {cur}
                  </p>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-0.5">ยอดรวม</p>
          </div>
        </div>

        {/* Quick balance */}
        {(members ?? []).length > 0 && (bills ?? []).length > 0 && (
          <div className="bg-white rounded-2xl border p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">ยอดสรุปรายคน</h2>
            <ul className="space-y-2">
              {(members ?? []).map((m) => {
                const currencyBalances = Object.entries(balancesByCurrency)
                  .map(([currency, bals]) => ({
                    currency,
                    bal: Math.round((bals[m.id] ?? 0) * 100) / 100,
                  }))
                  .filter((c) => Math.abs(c.bal) >= 0.005);
                return (
                  <li key={m.id} className="flex items-start justify-between text-sm gap-2">
                    <span className="text-slate-700 shrink-0">{m.name}</span>
                    <div className="text-right space-y-0.5">
                      {currencyBalances.length === 0 ? (
                        <span className="text-slate-400 text-xs">เสมอกัน</span>
                      ) : (
                        currencyBalances.map(({ currency, bal }) => (
                          <p
                            key={currency}
                            className={`tabular-nums text-xs font-medium ${
                              bal > 0 ? "text-green-600" : "text-red-500"
                            }`}
                          >
                            {bal > 0 ? "+" : ""}
                            {bal.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {currency}
                          </p>
                        ))
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <Link href={`/trips/${id}/report`} className="text-xs text-slate-500 underline underline-offset-2">
              ดูรายละเอียดทั้งหมด →
            </Link>
          </div>
        )}

      </div>
      <TripTabBar tripId={id} />
    </div>
  );
}

