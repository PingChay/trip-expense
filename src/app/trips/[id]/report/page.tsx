import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { computeSettlementMultiCurrency } from "@/lib/balance";
import { ReportClient } from "./report-client";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: trip }, { data: members }, { data: bills }] = await Promise.all([
    supabase.from("trips").select("name").eq("id", id).maybeSingle(),
    supabase.from("members").select("id, name").eq("trip_id", id).order("created_at"),
    supabase
      .from("bills")
      .select("*")
      .eq("trip_id", id)
      .order("date", { ascending: true }),
  ]);

  if (!trip) notFound();

  const memberMap = Object.fromEntries((members ?? []).map((m) => [m.id, m.name]));

  const billBreakdown = (bills ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    amount: Number(b.amount),
    currency: b.currency,
    payerName: memberMap[b.payer_id] ?? "-",
    date: b.date ?? null,
    shares: (b.participants as string[]).map((pid) => ({
      name: memberMap[pid] ?? "-",
      share: Number(b.amount) / b.participants.length,
    })),
  }));

  // compute per-person summary grouped by currency
  const currencies = [...new Set((bills ?? []).map((b) => b.currency as string))];
  const perPerson = (members ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    currencies: currencies
      .map((currency) => {
        const currBills = (bills ?? []).filter((b) => b.currency === currency);
        const paid = currBills
          .filter((b) => b.payer_id === m.id)
          .reduce((s, b) => s + Number(b.amount), 0);
        const owed = currBills.reduce((s, b) => {
          if (!(b.participants as string[]).includes(m.id)) return s;
          return s + Number(b.amount) / b.participants.length;
        }, 0);
        return { currency, paid, owed, balance: paid - owed };
      })
      .filter((c) => c.paid > 0.005 || c.owed > 0.005),
  }));

  const settlements = computeSettlementMultiCurrency(
    members ?? [],
    (bills ?? []).map((b) => ({ ...b, amount: Number(b.amount), currency: b.currency as string }))
  );

  return (
    <ReportClient
      tripId={id}
      billBreakdown={billBreakdown}
      perPerson={perPerson}
      settlements={settlements}
    />
  );
}
