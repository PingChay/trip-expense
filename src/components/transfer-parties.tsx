import { ArrowRight } from "lucide-react";
import { GroupAvatar, MemberAvatar } from "@/components/member-avatar";

function TransferParty({ name, isGroup }: { name: string; isGroup?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {isGroup ? <GroupAvatar group={name} /> : <MemberAvatar name={name} size="sm" />}
      <span className="min-w-0 break-words">{name}</span>
    </span>
  );
}

/** "payer → receiver"; the amount beside it carries the money, the names stay in label colour. */
export function TransferParties({
  from,
  to,
  fromIsGroup,
  toIsGroup,
}: {
  from: string;
  to: string;
  fromIsGroup?: boolean;
  toIsGroup?: boolean;
}) {
  return (
    <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-body text-label">
      <TransferParty name={from} isGroup={fromIsGroup} />
      {/* arrow stays with the receiver so a wrapped row reads "from" / "→ to" */}
      <span className="flex min-w-0 items-center gap-1.5">
        <ArrowRight aria-label="โอนให้" className="size-4 shrink-0 text-label-3" strokeWidth={2.25} />
        <TransferParty name={to} isGroup={toIsGroup} />
      </span>
    </p>
  );
}
