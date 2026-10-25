// Shared by server and client pages, so it can't live in the "use client" avatar module.

/** The colour key for a member: their group if they have one, otherwise their own name. */
export function avatarColorKey(member: { name: string; group_name?: string | null }) {
  return member.group_name?.trim() || member.name;
}
