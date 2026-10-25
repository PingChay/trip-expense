import { ArrowRight, Users } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";

function TransferParty({ name, isGroup, tone }: { name: string; isGroup?: boolean; tone: "from" | "to" }) {
  return (
    <span className="flex items-center gap-1.5">
      {isGroup ? (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Users className="h-3.5 w-3.5" />
        </span>
      ) : (
        <MemberAvatar name={name} size="sm" />
      )}
      <span className={`break-words ${tone === "from" ? "text-negative" : "text-positive"}`}>{name}</span>
    </span>
  );
}

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
    <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 text-sm font-medium">
      <TransferParty name={from} isGroup={fromIsGroup} tone="from" />
      {/* arrow stays with the receiver so a wrapped row reads "from" / "→ to" */}
      <span className="flex items-center gap-2">
        <ArrowRight aria-label="โอนให้" className="h-4 w-4 shrink-0 text-slate-400" />
        <TransferParty name={to} isGroup={toIsGroup} tone="to" />
      </span>
    </p>
  );
}
