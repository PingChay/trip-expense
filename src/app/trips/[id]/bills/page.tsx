import Link from "next/link";
import { notFound } from "next/navigation";
import { getBillEntryLabel, isExpenseEntry, parseBillNote } from "@/lib/bill-entry";
import { supabase } from "@/lib/supabase";
import { avatarColorKey } from "@/lib/avatar";
import { PageHeader } from "@/components/page-header";
import { TripTabBar } from "@/components/trip-tab-bar";
import { AvatarColorProvider, GroupAvatar, MemberAvatar } from "@/components/member-avatar";
import { ArrowRight, ChevronRight, Plus, Receipt } from "lucide-react";

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
        <span key={person.id} className={`rounded-full ring-2 ring-white ${index > 0 ? "-ml-1.5" : ""}`}>
          <MemberAvatar name={person.name} group={person.group_name} size="sm" />
        </span>
      ))}
      {extra > 0 && (
        <span className="-ml-1.5 flex size-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500 ring-2 ring-white">
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
          title="บิลทั้งหมด"
          subtitle={bills?.length ? `${bills.length} รายการ` : undefined}
          right={
            <Link
              href={`/trips/${id}/bills/new`}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-slate-900 pl-2.5 pr-3 text-[13px] font-medium text-white transition-colors hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> เพิ่ม
            </Link>
          }
        />

        <div className="mx-auto max-w-sm space-y-5 px-4 pb-32 pt-5">
          {!bills?.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center">
              <Receipt className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700">ยังไม่มีบิล</p>
              <Link
                href={`/trips/${id}/bills/new`}
                className="mt-4 inline-flex h-9 items-center gap-1 rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" /> เพิ่มบิลแรก
              </Link>
            </div>
          ) : (
            [...days.entries()].map(([day, dayBills]) => {
              const spent = new Map<string, number>();
              for (const bill of dayBills) {
                if (isExpenseEntry(bill.entryType)) spent.set(bill.currency, (spent.get(bill.currency) ?? 0) + bill.amount);
              }
              return (
                <section key={day || "undated"} className="space-y-2">
                  <div className="flex items-baseline justify-between px-1">
                    <h2 className="text-sm font-semibold text-slate-700">{formatDay(day || null)}</h2>
                    {spent.size > 0 && (
                      <p className="text-xs tabular-nums text-slate-500">
                        ใช้ไป{" "}
                        {[...spent.entries()].map(([currency, total]) => `${money(total)} ${currency}`).join(" · ")}
                      </p>
                    )}
                  </div>
                  <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
                    {dayBills.map((bill) => {
                      const payment = !isExpenseEntry(bill.entryType);
                      return (
                        <li key={bill.id}>
                          <Link
                            href={`/trips/${id}/bills/${bill.id}`}
                            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 active:bg-slate-100"
                          >
                            {bill.payer.group_name?.trim() ? (
                              <GroupAvatar group={bill.payer.group_name.trim()} size="md" />
                            ) : (
                              <MemberAvatar name={bill.payer.name} />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="break-words font-medium leading-snug text-slate-900">
                                {bill.title}
                                {payment && (
                                  <span className="ml-1.5 inline-block rounded-full bg-amber-100/80 px-2 py-0.5 align-[1px] text-[11px] font-medium text-amber-800">
                                    {getBillEntryLabel(bill.entryType)}
                                  </span>
                                )}
                              </p>
                              {payment ? (
                                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                                  <span>{partyLabel(bill.payer)}</span>
                                  <ArrowRight aria-label="โอนให้" className="h-3 w-3 text-slate-400" />
                                  <span>{[...new Set(bill.people.map((person: Member) => partyLabel(person)))].join(", ")}</span>
                                </p>
                              ) : (
                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                                  <span>{partyLabel(bill.payer)} จ่าย</span>
                                  <span className="flex items-center gap-1.5">
                                    <ParticipantStack people={bill.people} />
                                    <span>หาร {bill.people.length} คน</span>
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="font-semibold tabular-nums text-slate-900">{money(bill.amount)}</p>
                              <p className="text-[11px] font-medium text-slate-400">{bill.currency}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })
          )}
        </div>
        <TripTabBar tripId={id} />
      </div>
    </AvatarColorProvider>
  );
}
