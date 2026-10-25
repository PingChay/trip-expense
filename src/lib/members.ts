import { supabase } from "@/lib/supabase";

const UNDEFINED_COLUMN = "42703";

/**
 * Trip members including their PromptPay ID. Until `members.promptpay` exists
 * (see supabase-schema.sql) this retries without it, so pages keep working.
 */
export async function fetchMembersWithPromptPay<T extends { id: string; name: string }>(
  tripId: string,
  columns: string
): Promise<Array<T & { promptpay?: string | null }> | null> {
  const withPromptPay = await supabase
    .from("members")
    .select(`${columns}, promptpay`)
    .eq("trip_id", tripId)
    .order("created_at");
  if (withPromptPay.error?.code !== UNDEFINED_COLUMN) {
    return withPromptPay.data as Array<T & { promptpay?: string | null }> | null;
  }

  const { data } = await supabase.from("members").select(columns).eq("trip_id", tripId).order("created_at");
  return data as T[] | null;
}

export type PromptPayTarget = { owner: string; promptpay: string };

/**
 * Who receives a transfer addressed to a settlement label: the member with that
 * name, or for a group label the first member of that group who has PromptPay.
 */
export function promptPayByLabel(
  members: Array<{ name: string; group_name?: string | null; promptpay?: string | null }>
): Record<string, PromptPayTarget> {
  const targets: Record<string, PromptPayTarget> = {};
  for (const member of members) {
    if (!member.promptpay) continue;
    const target = { owner: member.name, promptpay: member.promptpay };
    targets[member.name] ??= target;
    const group = member.group_name?.trim();
    if (group) targets[group] ??= target;
  }
  return targets;
}
