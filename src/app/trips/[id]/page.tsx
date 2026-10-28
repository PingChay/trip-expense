import Link from "next/link";
import { notFound } from "next/navigation";
import { isExpenseEntry, parseBillNote } from "@/lib/bill-entry";
import { supabase } from "@/lib/supabase";
import { fetchMembersWithPromptPay, payerIdByLabel, promptPayByLabel } from "@/lib/members";
import { computeGroupSettlements } from "@/lib/balance";
import { ShareButton } from "./share-button";
import { TripTracker } from "@/components/trip-tracker";
import { TripTabBar } from "@/components/trip-tab-bar";
import { PageHeader, headerIconButton } from "@/components/page-header";
import { AvatarColorProvider } from "@/components/member-avatar";
import { avatarColorKey } from "@/lib/avatar";
import { TransferParties } from "@/components/transfer-parties";
import { SettlementQr } from "@/components/promptpay-qr";
import { Check, ChevronRight, LogOut, PlaneTakeoff, Receipt } from "lucide-react";

export default async function TripDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: trip }, members, { data: bills }] = await Promise.all([
    supabase.from("trips").select("*").eq("id", id).maybeSingle(),
    fetchMembersWithPromptPay<{ id: string; name: string; group_name: string | null }>(id, "id, name, group_name"),
    supabase.from("bills").select("id, amount, payer_id, participants, currency, note").eq("trip_id", id),
  ]);

  if (!trip) notFound();

  const normalizedBills = (bills ?? []).map((bill) => {
    const { entryType, personalAmounts } = parseBillNote(bill.note);
    return { ...bill, amount: Number(bill.amount), entryType, personalAmounts };
  });
  const expenseBills = normalizedBills.filter((bill) => isExpenseEntry(bill.entryType));

  // spending totals by currency
  const totalByCurrency = expenseBills.reduce((acc, b) => {
    acc[b.currency] = (acc[b.currency] ?? 0) + b.amount;
    return acc;
  }, {} as Record<string, number>);

  const dateRange =
    trip.start_date && trip.end_date
      ? `${trip.start_date} – ${trip.end_date}`
      : trip.start_date
      ? trip.start_date
      : null;

  const settlements = computeGroupSettlements(members ?? [], normalizedBills);
  const SETTLEMENT_PREVIEW = 3;
  const promptPayTargets = promptPayByLabel(members ?? []);
  const payerIds = payerIdByLabel(members ?? []);
  const memberCount = (members ?? []).length;
  const billCount = (bills ?? []).length;

  return (
    <AvatarColorProvider keys={(members ?? []).map(avatarColorKey)}>
    <div className="min-h-screen">
      <TripTracker tripId={id} tripName={trip.name} />
      <PageHeader
        title={trip.name}
        subtitle={dateRange}
        left={
          <Link href="/" aria-label="ออกจากทริป" className={headerIconButton}>
            <LogOut className="h-4 w-4" />
          </Link>
        }
      />

      <div className="mx-auto max-w-sm space-y-4 px-4 pb-32 pt-5">
        {/* Trip pass: ID, share, and the numbers that matter */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-[0_12px_32px_-12px_rgb(15_23_42/0.55)]">
          <div className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Trip ID</p>
                <p className="mt-1 font-mono text-[1.375rem] font-semibold leading-none tracking-[0.12em]">{id}</p>
              </div>
              <PlaneTakeoff className="mt-1 h-5 w-5 shrink-0 text-slate-500" />
            </div>
            <ShareButton tripId={id} />
          </div>

          {/* perforation */}
          <div aria-hidden className="relative h-0">
            <span className="absolute -left-2.5 -top-2.5 size-5 rounded-full bg-background" />
            <span className="absolute -right-2.5 -top-2.5 size-5 rounded-full bg-background" />
            <span className="absolute inset-x-5 top-0 border-t border-dashed border-white/15" />
          </div>

          <dl className="grid grid-cols-3 divide-x divide-white/10 px-1 py-4 text-center">
            <div className="px-2">
              <dt className="text-xs text-slate-400">สมาชิก</dt>
              <dd className="mt-1 text-lg font-semibold leading-tight">{memberCount} คน</dd>
            </div>
            <div className="px-2">
              <dt className="text-xs text-slate-400">บิล</dt>
              <dd className="mt-1 text-lg font-semibold leading-tight">{billCount} รายการ</dd>
            </div>
            <div className="px-2">
              <dt className="text-xs text-slate-400">ยอดรวม</dt>
              <dd className="mt-1 space-y-0.5">
                {Object.keys(totalByCurrency).length === 0 ? (
                  <p className="text-lg font-semibold leading-tight">0</p>
                ) : (
                  Object.entries(totalByCurrency).map(([cur, amt]) => (
                    <p key={cur} className="text-base font-semibold leading-tight tabular-nums">
                      {amt.toLocaleString("th-TH", { minimumFractionDigits: 0 })}{" "}
                      <span className="text-xs font-medium text-slate-400">{cur}</span>
                    </p>
                  ))
                )}
              </dd>
            </div>
          </dl>
        </section>

        {/* Who pays whom: the question people open the trip to answer */}
        {settlements.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
            <h2 className="px-4 pb-1 pt-4 text-sm font-semibold text-slate-900">ต้องโอนเงิน</h2>
            <ul className="divide-y divide-slate-100">
              {settlements.slice(0, SETTLEMENT_PREVIEW).map((s) => (
                <li key={`${s.fromId}-${s.toId}-${s.currency}`} className="flex items-center justify-between gap-3 px-4 py-3">
                  <TransferParties from={s.fromName} to={s.toName} fromIsGroup={s.fromIsGroup} toIsGroup={s.toIsGroup} />
                  <div className="flex shrink-0 items-center gap-2.5">
                    <p className="font-semibold tabular-nums text-slate-900">
                      {s.amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                      <span className="text-xs font-medium text-slate-400">{s.currency}</span>
                    </p>
                    <SettlementQr
                      target={promptPayTargets[s.toName]}
                      tripId={id}
                      from={s.fromName}
                      fromMemberId={payerIds[s.fromName]}
                      to={s.toName}
                      amount={s.amount}
                      currency={s.currency}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href={`/trips/${id}/report`}
              className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              {settlements.length > SETTLEMENT_PREVIEW
                ? `ดูการโอนทั้งหมด ${settlements.length} รายการ`
                : "ดูสรุปโอนเงิน"}
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
          </section>
        )}

        {/* Per-person detail lives on the summary page; here only what needs doing */}
        {normalizedBills.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center">
            <Receipt className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700">ยังไม่มีบิล</p>
            <p className="mt-1 text-sm text-slate-500">กดปุ่ม + ด้านล่างเพื่อเพิ่มบิลแรกของทริป</p>
          </section>
        ) : (
          settlements.length === 0 && (
            <Link
              href={`/trips/${id}/report`}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition-colors hover:bg-slate-50"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-positive">
                <Check className="h-4 w-4" strokeWidth={2.75} />
              </span>
              <span className="flex-1 text-sm font-medium text-slate-900">ไม่ต้องโอน ทุกคนจ่ายพอดี</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
          )
        )}
      </div>
      <TripTabBar tripId={id} />
    </div>
    </AvatarColorProvider>
  );
}
