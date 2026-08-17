"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import type { BillInput } from "@/lib/types";

export async function createBill(tripId: string, data: BillInput) {
  const { error } = await supabase.from("bills").insert({
    trip_id: tripId,
    title: data.title.trim(),
    amount: data.amount,
    currency: data.currency,
    payer_id: data.payerId,
    participants: data.participants,
    date: data.date || new Date().toISOString().split("T")[0],
    note: data.note.trim(),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}/bills`);
}
