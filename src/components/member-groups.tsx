"use client";

import { GroupAvatar, MemberAvatar } from "@/components/member-avatar";
import { AVATAR_INSET, row } from "@/components/ui/grouped";

type Member = { id: string; name: string; group_name?: string | null };

/**
 * Rows for a grouped section: one per family (in the order its first member joined) with its
 * members' names beneath, then everyone without a family. Needs an AvatarColorProvider above.
 */
export function MemberGroups({ members }: { members: Member[] }) {
  const groups = new Map<string, Member[]>();
  const solo: Member[] = [];
  for (const member of members) {
    const group = member.group_name?.trim();
    if (group) groups.set(group, [...(groups.get(group) ?? []), member]);
    else solo.push(member);
  }

  return (
    <div className="ios-list" style={{ "--separator-inset": AVATAR_INSET } as React.CSSProperties}>
      {[...groups.entries()].map(([group, groupMembers]) => (
        <div key={group} className={`${row} items-start`}>
          <GroupAvatar group={group} size="md" />
          <div className="min-w-0 flex-1">
            <p className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 break-words font-semibold text-label">{group}</span>
              <span className="shrink-0 text-subhead text-label-2">{groupMembers.length} คน</span>
            </p>
            <p className="mt-0.5 break-words text-subhead text-label-2">
              {groupMembers.map((member) => member.name).join(", ")}
            </p>
          </div>
        </div>
      ))}

      {solo.map((member) => (
        <div key={member.id} className={row}>
          <MemberAvatar name={member.name} />
          <span className="min-w-0 flex-1 break-words text-label">{member.name}</span>
        </div>
      ))}
    </div>
  );
}
