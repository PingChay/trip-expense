import { notFound } from "next/navigation";
import { isExpenseEntry, parseBillNote } from "@/lib/bill-entry";
import { supabase } from "@/lib/supabase";
import { fetchMembersWithPromptPay, promptPayByLabel } from "@/lib/members";
import { billShares, computeGroupSettlements, computeSettlementMultiCurrency } from "@/lib/balance";
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

  const [{ data: trip }, members, { data: bills }] = await Promise.all([
    supabase.from("trips").select("name").eq("id", id).maybeSingle(),
    fetchMembersWithPromptPay<{ id: string; name: string; group_name: string | null }>(id, "id, name, group_name"),
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
      personalAmounts: parsedNote.personalAmounts,
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
        const owed = currBills.reduce(
          (sum, bill) => sum + (billShares(bill.amount, bill.participants, bill.personalAmounts)[memberId] ?? 0),
          0
        );
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
          const shares = billShares(bill.amount, bill.participants, bill.personalAmounts);
          return sum + memberIds.reduce((groupSum, pid) => groupSum + (shares[pid] ?? 0), 0);
        }, 0);
        return { currency, paid, owed, balance: paid - owed };
      })
      .filter((entry) => entry.paid > 0.005 || entry.owed > 0.005);
  }

  const memberMap = Object.fromEntries((members ?? []).map((m) => [m.id, m.name]));

  const billBreakdown = normalizedBills.map((b) => {
    const shares = billShares(b.amount, b.participants, b.personalAmounts);
    return {
    id: b.id,
    title: b.title,
    amount: b.amount,
    currency: b.currency,
    entryType: b.entryType,
    payerName: memberMap[b.payer_id] ?? "-",
    date: b.date ?? null,
    shares: (b.participants as string[]).map((pid) => ({
      name: memberMap[pid] ?? "-",
      share: shares[pid] ?? 0,
      personal: b.participants.includes(pid) ? (b.personalAmounts[pid] ?? 0) : 0,
    })),
    };
  });

  // compute per-person summary grouped by currency
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
  const groupSettlements = computeGroupSettlements(members ?? [], normalizedBills);

  return (
    <ReportClient
      tripId={id}
      billBreakdown={billBreakdown}
      perPerson={perPerson}
      groupSummaries={groupSummaries}
      settlements={settlements}
      groupSettlements={groupSettlements}
      promptPayTargets={promptPayByLabel(members ?? [])}
    />
  );
}
