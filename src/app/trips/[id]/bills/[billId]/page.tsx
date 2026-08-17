import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BillFormClient } from "../bill-form-client";
import { updateBill, deleteBill } from "./actions";
import type { BillInput } from "@/lib/types";

export default async function EditBillPage({
  params,
}: {
  params: Promise<{ id: string; billId: string }>;
}) {
  const { id, billId } = await params;

  const [{ data: bill }, { data: members }] = await Promise.all([
    supabase
      .from("bills")
      .select("*")
      .eq("id", billId)
      .eq("trip_id", id)
      .maybeSingle(),
    supabase.from("members").select("id, name, group_name").eq("trip_id", id).order("created_at"),
  ]);

  if (!bill || !members) notFound();

  const initialData: BillInput = {
    title: bill.title,
    amount: Number(bill.amount),
    currency: bill.currency,
    payerId: bill.payer_id,
    participants: bill.participants,
    date: bill.date ?? new Date().toISOString().split("T")[0],
    note: bill.note ?? "",
  };

  const boundUpdate = updateBill.bind(null, billId, id);
  const boundDelete = deleteBill.bind(null, billId, id);

  return (
    <BillFormClient
      tripId={id}
      members={members}
      initialData={initialData}
      saveAction={boundUpdate}
      deleteAction={boundDelete}
    />
  );
}
