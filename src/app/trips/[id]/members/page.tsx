import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchMembersWithPromptPay } from "@/lib/members";
import { MembersClient } from "./members-client";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: trip }, members, { data: bills }] = await Promise.all([
    supabase.from("trips").select("name").eq("id", id).maybeSingle(),
    fetchMembersWithPromptPay<{ id: string; name: string; active: boolean; group_name: string | null }>(
      id,
      "id, name, active, group_name"
    ),
    supabase.from("bills").select("payer_id, participants").eq("trip_id", id),
  ]);

  if (!trip) notFound();

  // count bills per member (as payer or participant)
  const billCounts: Record<string, number> = {};
  for (const bill of bills ?? []) {
    const involved = new Set([bill.payer_id, ...bill.participants]);
    for (const pid of involved) {
      billCounts[pid] = (billCounts[pid] ?? 0) + 1;
    }
  }

  return (
    <MembersClient
      tripId={id}
      initialMembers={members ?? []}
      billCounts={billCounts}
      promptPayEnabled={(members ?? []).some((m) => "promptpay" in m)}
    />
  );
}
