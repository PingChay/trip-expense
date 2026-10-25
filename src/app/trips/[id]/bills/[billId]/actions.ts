"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { serializeBillNote } from "@/lib/bill-entry";
import type { BillInput } from "@/lib/types";

export async function updateBill(billId: string, tripId: string, data: BillInput) {
  const { error } = await supabase
    .from("bills")
    .update({
      title: data.title.trim(),
      amount: data.amount,
      currency: data.currency,
      payer_id: data.payerId,
      participants: data.participants,
      date: data.date,
      note: serializeBillNote(data.note, data.entryType, data.personalAmounts),
    })
    .eq("id", billId);
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}/bills`);
}

export async function deleteBill(billId: string, tripId: string) {
  const { error } = await supabase.from("bills").delete().eq("id", billId);
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}/bills`);
}
