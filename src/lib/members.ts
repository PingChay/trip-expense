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

export type PromptPayTarget = { owner: string; ownerId: string; promptpay: string };

/**
 * Who receives a transfer addressed to a settlement label: the member with that
 * name, or for a group label the first member of that group who has PromptPay.
 */
export function promptPayByLabel(
  members: Array<{ id: string; name: string; group_name?: string | null; promptpay?: string | null }>
): Record<string, PromptPayTarget> {
  const targets: Record<string, PromptPayTarget> = {};
  for (const member of members) {
    if (!member.promptpay) continue;
    const target = { owner: member.name, ownerId: member.id, promptpay: member.promptpay };
    targets[member.name] ??= target;
    const group = member.group_name?.trim();
    if (group) targets[group] ??= target;
  }
  return targets;
}

/**
 * Member who pays on behalf of a settlement label: the member with that name,
 * or the first member of that group.
 */
export function payerIdByLabel(members: Array<{ id: string; name: string; group_name?: string | null }>) {
  const ids: Record<string, string> = {};
  for (const member of members) {
    ids[member.name] ??= member.id;
    const group = member.group_name?.trim();
    if (group) ids[group] ??= member.id;
  }
  return ids;
}

/** Members behind each settlement label: the member with that name, or everyone in that group. */
export function membersByLabel(members: Array<{ id: string; name: string; group_name?: string | null }>) {
  const byLabel: Record<string, Array<{ id: string; name: string }>> = {};
  for (const member of members) {
    const entry = { id: member.id, name: member.name };
    (byLabel[member.name] ??= []).push(entry);
    const group = member.group_name?.trim();
    if (group) (byLabel[group] ??= []).push(entry);
  }
  return byLabel;
}
