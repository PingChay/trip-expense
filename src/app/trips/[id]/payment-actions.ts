"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { serializeBillNote } from "@/lib/bill-entry";

/** Records a settled transfer as a payment bill, which cancels that debt in every balance. */
export async function recordPayment(
  tripId: string,
  payment: { fromMemberId: string; toMemberId: string; amount: number; currency: string; title: string }
) {
  if (!(payment.amount > 0)) throw new Error("Amount must be positive");
  if (payment.fromMemberId === payment.toMemberId) throw new Error("Payer and receiver must differ");

  const { error } = await supabase.from("bills").insert({
    trip_id: tripId,
    title: payment.title.trim(),
    amount: Math.round(payment.amount * 100) / 100,
    currency: payment.currency,
    payer_id: payment.fromMemberId,
    participants: [payment.toMemberId],
    date: new Date().toISOString().split("T")[0],
    note: serializeBillNote("", "advance"),
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/bills`);
  revalidatePath(`/trips/${tripId}/report`);
}
