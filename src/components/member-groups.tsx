"use client";

import { GroupAvatar, MemberAvatar, useAvatarTint } from "@/components/member-avatar";

type Member = { id: string; name: string; group_name?: string | null };

function MemberCapsule({ member }: { member: Member }) {
  return (
    // long names wrap instead of being cut to "…"; the 16px radius reads as a pill on one line
    <span className="inline-flex max-w-full items-start gap-1.5 rounded-2xl bg-white py-1 pl-1 pr-3 text-sm text-slate-700 shadow-[0_1px_2px_rgb(15_23_42/0.06)]">
      <MemberAvatar name={member.name} group={member.group_name} size="sm" />
      <span className="min-w-0 break-words py-0.5 leading-5">{member.name}</span>
    </span>
  );
}

/** One family: a rounded box washed in the family's colour, its members as capsules. */
function FamilyBox({ group, members, wide }: { group: string; members: Member[]; wide: boolean }) {
  const tint = useAvatarTint(group);
  return (
    <div
      className={`min-w-0 rounded-2xl border p-3 ${wide ? "col-span-2" : ""}`}
      style={{ backgroundColor: tint.surface, borderColor: tint.edge }}
    >
      <div className="mb-2.5 flex min-w-0 items-start gap-2">
        <GroupAvatar group={group} />
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold leading-snug text-slate-900">{group}</p>
          <p className="text-xs font-medium leading-snug" style={{ color: tint.color }}>
            {members.length} คน
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {members.map((member) => (
          <MemberCapsule key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}

/**
 * Families first (in the order their first member joined), two boxes to a row with long
 * names wrapping inside their box; members without a family share one neutral box across
 * the full width. Needs an AvatarColorProvider above.
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
    <div className="grid grid-cols-2 gap-2">
      {[...groups.entries()].map(([group, groupMembers], index) => (
        // an odd last family stretches so the grid never ends on a half-empty row
        <FamilyBox
          key={group}
          group={group}
          members={groupMembers}
          wide={groups.size % 2 === 1 && index === groups.size - 1}
        />
      ))}

      {solo.length > 0 && (
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          {groups.size > 0 && <p className="mb-2.5 text-xs font-medium text-slate-500">ไม่มีกลุ่ม</p>}
          <div className="flex flex-wrap gap-1.5">
            {solo.map((member) => (
              <MemberCapsule key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
