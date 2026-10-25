"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { isValidPromptPay, normalizePromptPay } from "@/lib/promptpay";

export async function addMember(tripId: string, name: string, groupName?: string): Promise<string> {
  const { data, error } = await supabase
    .from("members")
    .insert({ trip_id: tripId, name: name.trim(), group_name: groupName?.trim() || null })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}/members`);
  revalidatePath(`/trips/${tripId}`);
  return data.id;
}

export async function updateMember(
  memberId: string,
  tripId: string,
  name: string,
  groupName?: string,
  /** undefined leaves the stored PromptPay untouched (e.g. before the column exists) */
  promptpay?: string | null
) {
  const update: Record<string, string | null> = { name: name.trim(), group_name: groupName?.trim() || null };
  if (promptpay !== undefined) {
    const id = promptpay ? normalizePromptPay(promptpay) : null;
    if (id && !isValidPromptPay(id)) throw new Error("Invalid PromptPay ID");
    update.promptpay = id;
  }
  const { error } = await supabase.from("members").update(update).eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}/members`);
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/report`);
}

export async function deleteMember(memberId: string, tripId: string) {
  const { error } = await supabase.from("members").delete().eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}/members`);
  revalidatePath(`/trips/${tripId}`);
}
