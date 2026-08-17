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
    supabase.from("members").select("id, name, group_name").eq("trip_id", id).order("created_at"),
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
    groupName: m.group_name as string | null ?? null,
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

  // group-level aggregates
  const groupMap = new Map<string, string[]>(); // groupName → memberIds
  for (const m of members ?? []) {
    if (m.group_name) {
      groupMap.set(m.group_name, [...(groupMap.get(m.group_name) ?? []), m.id]);
    }
  }
  const groupSummaries = Array.from(groupMap.entries()).map(([groupName, memberIds]) => ({
    groupName,
    memberCount: memberIds.length,
    currencies: currencies
      .map((currency) => {
        const currBills = (bills ?? []).filter((b) => b.currency === currency);
        const paid = currBills
          .filter((b) => memberIds.includes(b.payer_id))
          .reduce((s, b) => s + Number(b.amount), 0);
        const owed = currBills.reduce((s, b) => {
          const cnt = (b.participants as string[]).filter((pid) => memberIds.includes(pid)).length;
          return s + (Number(b.amount) / b.participants.length) * cnt;
        }, 0);
        return { currency, paid, owed, balance: paid - owed };
      })
      .filter((c) => c.paid > 0.005 || c.owed > 0.005),
  }));

  const settlements = computeSettlementMultiCurrency(
    members ?? [],
    (bills ?? []).map((b) => ({ ...b, amount: Number(b.amount), currency: b.currency as string }))
  );

  // group-to-group settlement (aggregate individual balances by group)
  const groupSettlements = currencies.flatMap((currency) => {
    const groupBals = new Map<string, number>();
    for (const p of perPerson) {
      if (!p.groupName) continue;
      const c = p.currencies.find((c) => c.currency === currency);
      if (c) groupBals.set(p.groupName, (groupBals.get(p.groupName) ?? 0) + c.balance);
    }
    const creds = [...groupBals.entries()]
      .filter(([, b]) => b > 0.005)
      .map(([n, a]) => ({ id: n, amount: a }))
      .sort((a, b) => b.amount - a.amount);
    const debs = [...groupBals.entries()]
      .filter(([, b]) => b < -0.005)
      .map(([n, a]) => ({ id: n, amount: -a }))
      .sort((a, b) => b.amount - a.amount);
    const result: { fromId: string; fromName: string; toId: string; toName: string; amount: number; currency: string }[] = [];
    while (creds.length && debs.length) {
      const c = creds[0], d = debs[0];
      const amount = Math.min(c.amount, d.amount);
      if (amount > 0.005)
        result.push({ fromId: d.id, fromName: d.id, toId: c.id, toName: c.id, amount: Math.round(amount * 100) / 100, currency });
      c.amount -= amount;
      d.amount -= amount;
      if (c.amount < 0.005) creds.shift();
      if (d.amount < 0.005) debs.shift();
    }
    return result;
  });

  return (
    <ReportClient
      tripId={id}
      billBreakdown={billBreakdown}
      perPerson={perPerson}
      groupSummaries={groupSummaries}
      settlements={settlements}
      groupSettlements={groupSettlements}
    />
  );
}
