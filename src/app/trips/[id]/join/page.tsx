import Link from "next/link";
import { notFound } from "next/navigation";
import { isExpenseEntry, parseBillNote } from "@/lib/bill-entry";
import { supabase } from "@/lib/supabase";
import { buttonVariants } from "@/components/ui/button";
import { Section, row } from "@/components/ui/grouped";
import { AvatarColorProvider } from "@/components/member-avatar";
import { MemberGroups } from "@/components/member-groups";
import { avatarColorKey } from "@/lib/avatar";
import { formatTripDates } from "@/lib/dates";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: trip }, { data: members }, { data: bills }] = await Promise.all([
    supabase.from("trips").select("*").eq("id", id).maybeSingle(),
    supabase.from("members").select("id, name, group_name").eq("trip_id", id).order("created_at"),
    supabase.from("bills").select("amount, note").eq("trip_id", id),
  ]);

  if (!trip) notFound();

  const total = (bills ?? [])
    .filter((bill) => isExpenseEntry(parseBillNote(bill.note).entryType))
    .reduce((s, b) => s + Number(b.amount), 0);

  const dates = formatTripDates(trip.start_date, trip.end_date);

  return (
    <AvatarColorProvider keys={(members ?? []).map(avatarColorKey)}>
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+3rem)]">
      <div className="flex-1 space-y-7">
        <div className="px-4 text-center">
          <h1 className="text-balance text-title1 font-bold">{trip.name}</h1>
          {dates && <p className="mt-1 text-subhead text-label-2">{dates}</p>}
        </div>

        <Section>
          <div className={`${row} justify-between`}>
            <span>Trip ID</span>
            <span className="font-mono tracking-wide text-label-2">{id}</span>
          </div>
          <div className={`${row} justify-between`}>
            <span>สมาชิก</span>
            <span className="tabular-nums text-label-2">{(members ?? []).length} คน</span>
          </div>
          <div className={`${row} justify-between`}>
            <span>บิล</span>
            <span className="tabular-nums text-label-2">{(bills ?? []).length} รายการ</span>
          </div>
          <div className={`${row} justify-between`}>
            <span>ยอดรวม</span>
            <span className="tabular-nums text-label-2">
              {total.toLocaleString("th-TH", { minimumFractionDigits: 0 })} THB
            </span>
          </div>
        </Section>

        {(members ?? []).length > 0 && (
          <Section header="สมาชิกในทริป">
            <MemberGroups members={members ?? []} />
          </Section>
        )}
      </div>

      <div className="sticky bottom-0 -mx-4 mt-6 px-4 pb-2 pt-3">
        <Link href={`/trips/${id}`} className={`${buttonVariants({ size: "lg" })} w-full`}>
          เข้าร่วมทริปนี้
        </Link>
      </div>
    </div>
    </AvatarColorProvider>
  );
}
