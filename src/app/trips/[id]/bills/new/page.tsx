import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BillFormClient } from "../bill-form-client";
import { createBill } from "./actions";

export default async function NewBillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: members } = await supabase
    .from("members")
    .select("id, name, group_name")
    .eq("trip_id", id)
    .eq("active", true)
    .order("created_at");

  if (!members) notFound();

  const boundCreate = createBill.bind(null, id);

  return <BillFormClient tripId={id} members={members} saveAction={boundCreate} />;
}
