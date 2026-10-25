"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

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
  groupName?: string
) {
  const { error } = await supabase
    .from("members")
    .update({ name: name.trim(), group_name: groupName?.trim() || null })
    .eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}/members`);
}

export async function deleteMember(memberId: string, tripId: string) {
  const { error } = await supabase.from("members").delete().eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}/members`);
  revalidatePath(`/trips/${tripId}`);
}
