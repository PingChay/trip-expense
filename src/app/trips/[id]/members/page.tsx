import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MembersClient } from "./members-client";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: trip }, { data: members }, { data: bills }] = await Promise.all([
    supabase.from("trips").select("name").eq("id", id).maybeSingle(),
    supabase.from("members").select("id, name, active").eq("trip_id", id).order("created_at"),
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
    />
  );
}
