import { notFound } from "next/navigation";
import { isExpenseEntry, parseBillNote } from "@/lib/bill-entry";
import { supabase } from "@/lib/supabase";
import { computeBalances, computeSettlementMultiCurrency } from "@/lib/balance";
import { ReportClient } from "./report-client";

type SummaryCurrency = {
  currency: string;
  paid: number;
  owed: number;
  balance: number;
};

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

  const normalizedBills = (bills ?? []).map((bill) => {
    const parsedNote = parseBillNote(bill.note);
    return {
      ...bill,
      amount: Number(bill.amount),
      entryType: parsedNote.entryType,
      note: parsedNote.note,
    };
  });
  const expenseBills = normalizedBills.filter((bill) => isExpenseEntry(bill.entryType));

  const hasNamedGroups = (members ?? []).some((member) => Boolean(member.group_name?.trim()));
  const namedGroups = new Set(
    (members ?? []).map((member) => member.group_name?.trim()).filter(Boolean) as string[]
  );

  function getGroupLabel(member: { name: string; group_name?: string | null }) {
    return member.group_name?.trim() || member.name;
  }

  function summarizeMemberCurrencies(memberId: string, sourceBills: typeof normalizedBills): SummaryCurrency[] {
    const billCurrencies = [...new Set(sourceBills.map((bill) => bill.currency as string))];
    return billCurrencies
      .map((currency) => {
        const currBills = sourceBills.filter((bill) => bill.currency === currency);
        const paid = currBills.filter((bill) => bill.payer_id === memberId).reduce((sum, bill) => sum + bill.amount, 0);
        const owed = currBills.reduce((sum, bill) => {
          if (!(bill.participants as string[]).includes(memberId)) return sum;
          return sum + bill.amount / bill.participants.length;
        }, 0);
        return { currency, paid, owed, balance: paid - owed };
      })
      .filter((entry) => entry.paid > 0.005 || entry.owed > 0.005);
  }

  function summarizeGroupCurrencies(memberIds: string[], sourceBills: typeof normalizedBills): SummaryCurrency[] {
    const billCurrencies = [...new Set(sourceBills.map((bill) => bill.currency as string))];
    return billCurrencies
      .map((currency) => {
        const currBills = sourceBills.filter((bill) => bill.currency === currency);
        const paid = currBills
          .filter((bill) => memberIds.includes(bill.payer_id))
          .reduce((sum, bill) => sum + bill.amount, 0);
        const owed = currBills.reduce((sum, bill) => {
          const participantsInGroup = (bill.participants as string[]).filter((pid) => memberIds.includes(pid)).length;
          return sum + (bill.amount / bill.participants.length) * participantsInGroup;
        }, 0);
        return { currency, paid, owed, balance: paid - owed };
      })
      .filter((entry) => entry.paid > 0.005 || entry.owed > 0.005);
  }

  const memberMap = Object.fromEntries((members ?? []).map((m) => [m.id, m.name]));

  const billBreakdown = normalizedBills.map((b) => ({
    id: b.id,
    title: b.title,
    amount: b.amount,
    currency: b.currency,
    entryType: b.entryType,
    payerName: memberMap[b.payer_id] ?? "-",
    date: b.date ?? null,
    shares: (b.participants as string[]).map((pid) => ({
      name: memberMap[pid] ?? "-",
      share: b.amount / b.participants.length,
    })),
  }));

  // compute per-person summary grouped by currency
  const settlementCurrencies = [...new Set(normalizedBills.map((b) => b.currency as string))];
  const advanceBills = normalizedBills.filter((bill) => !isExpenseEntry(bill.entryType));
  const perPerson = (members ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    groupName: hasNamedGroups ? getGroupLabel(m) : null,
    currencies: summarizeMemberCurrencies(m.id, expenseBills),
    advanceCurrencies: summarizeMemberCurrencies(m.id, advanceBills),
  }));

  // group-level aggregates
  const groupMap = new Map<string, string[]>(); // groupName → memberIds
  if (hasNamedGroups) {
    for (const m of members ?? []) {
      const groupName = getGroupLabel(m);
      groupMap.set(groupName, [...(groupMap.get(groupName) ?? []), m.id]);
    }
  }
  const groupSummaries = Array.from(groupMap.entries())
    .sort(([left], [right]) => left.localeCompare(right, "th"))
    .map(([groupName, memberIds]) => ({
    groupName,
    isGroup: namedGroups.has(groupName),
    memberCount: memberIds.length,
    currencies: summarizeGroupCurrencies(memberIds, expenseBills),
    advanceCurrencies: summarizeGroupCurrencies(memberIds, advanceBills),
    }));

  const settlements = computeSettlementMultiCurrency(
    members ?? [],
    normalizedBills.map((b) => ({ ...b, amount: b.amount, currency: b.currency as string }))
  );

  // group-to-group settlement combines expense bills and direct transfer entries.
  const groupSettlements = settlementCurrencies.flatMap((currency) => {
    const currBills = normalizedBills.filter((bill) => bill.currency === currency);
    const memberBalances = computeBalances(members ?? [], currBills);
    const groupBals = new Map<string, number>();
    for (const member of members ?? []) {
      const groupName = hasNamedGroups ? getGroupLabel(member) : member.name;
      groupBals.set(groupName, (groupBals.get(groupName) ?? 0) + (memberBalances[member.id] ?? 0));
    }
    const creds = [...groupBals.entries()]
      .filter(([, b]) => b > 0.005)
      .map(([n, a]) => ({ id: n, amount: a }))
      .sort((a, b) => b.amount - a.amount);
    const debs = [...groupBals.entries()]
      .filter(([, b]) => b < -0.005)
      .map(([n, a]) => ({ id: n, amount: -a }))
      .sort((a, b) => b.amount - a.amount);
    const result: {
      fromId: string;
      fromName: string;
      fromIsGroup: boolean;
      toId: string;
      toName: string;
      toIsGroup: boolean;
      amount: number;
      currency: string;
    }[] = [];
    while (creds.length && debs.length) {
      const c = creds[0], d = debs[0];
      const amount = Math.min(c.amount, d.amount);
      if (amount > 0.005)
        result.push({
          fromId: d.id,
          fromName: d.id,
          fromIsGroup: namedGroups.has(d.id),
          toId: c.id,
          toName: c.id,
          toIsGroup: namedGroups.has(c.id),
          amount: Math.round(amount * 100) / 100,
          currency,
        });
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
