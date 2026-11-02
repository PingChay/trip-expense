import Link from "next/link";
import { notFound } from "next/navigation";
import { getBillEntryLabel, isExpenseEntry, parseBillNote } from "@/lib/bill-entry";
import { supabase } from "@/lib/supabase";
import { avatarColorKey } from "@/lib/avatar";
import { PageHeader } from "@/components/page-header";
import { TripTabBar } from "@/components/trip-tab-bar";
import { AvatarColorProvider, GroupAvatar, MemberAvatar } from "@/components/member-avatar";
import { Disclosure, Section, pressableRow } from "@/components/ui/grouped";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Plus, ReceiptText } from "lucide-react";

type Member = { id: string; name: string; group_name: string | null };

const STACK_LIMIT = 4;

/** Members of a family are shown as their family, matching how "who paid" is picked. */
const partyLabel = (member: Member) => member.group_name?.trim() || member.name;

const money = (value: number) =>
  value.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function formatDay(date: string | null) {
  if (!date) return "ไม่ระบุวันที่";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Who shares a bill, as overlapping avatars in their family colours. */
function ParticipantStack({ people }: { people: Member[] }) {
  const shown = people.slice(0, STACK_LIMIT);
  const extra = people.length - shown.length;
  return (
    <span className="flex items-center">
      {shown.map((person, index) => (
        <span key={person.id} className={`rounded-full ring-2 ring-cell ${index > 0 ? "-ml-1.5" : ""}`}>
          <MemberAvatar name={person.name} group={person.group_name} size="sm" />
        </span>
      ))}
      {extra > 0 && (
        <span className="-ml-1.5 flex size-6 items-center justify-center rounded-full bg-fill-2 text-caption2 font-semibold text-label-2 ring-2 ring-cell">
          +{extra}
        </span>
      )}
    </span>
  );
}

export default async function BillsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: trip }, { data: bills }, { data: members }] = await Promise.all([
    supabase.from("trips").select("name").eq("id", id).maybeSingle(),
    supabase
      .from("bills")
      .select("*")
      .eq("trip_id", id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("members").select("id, name, group_name").eq("trip_id", id).order("created_at"),
  ]);

  if (!trip) notFound();

  const memberById = new Map<string, Member>((members ?? []).map((m) => [m.id, m]));
  const unknown = (memberId: string): Member => ({ id: memberId, name: "-", group_name: null });
  const normalizedBills = (bills ?? []).map((bill) => ({
    ...bill,
    amount: Number(bill.amount),
    entryType: parseBillNote(bill.note).entryType,
    payer: memberById.get(bill.payer_id) ?? unknown(bill.payer_id),
    people: (bill.participants as string[]).map((pid): Member => memberById.get(pid) ?? unknown(pid)),
  }));

  // already newest first; keep that order while grouping by day
  const days = new Map<string, typeof normalizedBills>();
  for (const bill of normalizedBills) {
    const key = bill.date ?? "";
    days.set(key, [...(days.get(key) ?? []), bill]);
  }

  return (
    <AvatarColorProvider keys={(members ?? []).map(avatarColorKey)}>
      <div className="min-h-screen">
        <PageHeader
          large
          title="บิลทั้งหมด"
          subtitle={bills?.length ? `${bills.length} รายการ` : undefined}
        />

        <div className="mx-auto max-w-md space-y-7 px-4 pb-[calc(env(safe-area-inset-bottom)+7.5rem)] pt-3">
          {!bills?.length ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <ReceiptText className="size-12 text-label-3" strokeWidth={1.5} />
              <p className="mt-3 text-title3 font-bold">ยังไม่มีบิล</p>
              <p className="mt-1 text-subhead text-label-2">บิลที่เพิ่มจะเรียงตามวัน ล่าสุดอยู่บนสุด</p>
              <Link href={`/trips/${id}/bills/new`} className={`${buttonVariants({ variant: "secondary" })} mt-5`}>
                <Plus /> เพิ่มบิลแรก
              </Link>
            </div>
          ) : (
            [...days.entries()].map(([day, dayBills]) => {
              const spent = new Map<string, number>();
              for (const bill of dayBills) {
                if (isExpenseEntry(bill.entryType)) spent.set(bill.currency, (spent.get(bill.currency) ?? 0) + bill.amount);
              }
              return (
                <Section
                  key={day || "undated"}
                  as="ul"
                  inset="3.75rem"
                  header={formatDay(day || null)}
                  action={
                    spent.size > 0 && (
                      <p className="shrink-0 text-footnote tabular-nums text-label-2">
                        ใช้ไป{" "}
                        {[...spent.entries()].map(([currency, total]) => `${money(total)} ${currency}`).join(" · ")}
                      </p>
                    )
                  }
                >
                  {dayBills.map((bill) => {
                    const payment = !isExpenseEntry(bill.entryType);
                    return (
                      <li key={bill.id}>
                        <Link href={`/trips/${id}/bills/${bill.id}`} className={`${pressableRow} items-start py-3`}>
                          {bill.payer.group_name?.trim() ? (
                            <GroupAvatar group={bill.payer.group_name.trim()} size="md" />
                          ) : (
                            <MemberAvatar name={bill.payer.name} />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="break-words font-medium text-label">
                              {bill.title}
                              {payment && (
                                <span className="ml-1.5 inline-block rounded-full bg-orange/15 px-2 py-0.5 align-[2px] text-caption font-semibold text-orange-ink">
                                  {getBillEntryLabel(bill.entryType)}
                                </span>
                              )}
                            </p>
                            {payment ? (
                              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-subhead text-label-2">
                                <span>{partyLabel(bill.payer)}</span>
                                <ArrowRight aria-label="โอนให้" className="size-3.5 text-label-3" strokeWidth={2.25} />
                                <span>{[...new Set(bill.people.map((person: Member) => partyLabel(person)))].join(", ")}</span>
                              </p>
                            ) : (
                              <div className="mt-0.5 space-y-1 text-subhead text-label-2">
                                <p>{partyLabel(bill.payer)} จ่าย</p>
                                <p className="flex items-center gap-1.5">
                                  <ParticipantStack people={bill.people} />
                                  <span>หาร {bill.people.length} คน</span>
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2 self-center">
                            <div className="text-right">
                              <p className="font-semibold tabular-nums text-label">{money(bill.amount)}</p>
                              <p className="text-caption font-medium text-label-2">{bill.currency}</p>
                            </div>
                            <Disclosure />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </Section>
              );
            })
          )}
        </div>
        <TripTabBar tripId={id} />
      </div>
    </AvatarColorProvider>
  );
}
