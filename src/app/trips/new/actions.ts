"use server";

import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

function generateTripId(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I, O to avoid confusion
  const digits = "0123456789";
  const l = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  const d = Array.from({ length: 4 }, () => digits[Math.floor(Math.random() * digits.length)]).join("");
  return `${l}-${d}`;
}

export async function createTrip(formData: {
  name: string;
  startDate?: string;
  endDate?: string;
  members: string[];
}) {
  // Generate unique trip ID with collision retry
  let tripId = generateTripId();
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase.from("trips").select("id").eq("id", tripId).maybeSingle();
    if (!data) break;
    tripId = generateTripId();
  }

  const { error: tripError } = await supabase.from("trips").insert({
    id: tripId,
    name: formData.name.trim(),
    start_date: formData.startDate || null,
    end_date: formData.endDate || null,
  });
  if (tripError) throw new Error(tripError.message);

  const memberRows = formData.members.map((name) => ({ trip_id: tripId, name: name.trim() }));
  const { error: memberError } = await supabase.from("members").insert(memberRows);
  if (memberError) throw new Error(memberError.message);

  redirect(`/trips/${tripId}`);
}
