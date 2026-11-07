import Link from "next/link";
import { notFound } from "next/navigation";
import { billCategory, isExpenseEntry, parseBillNote } from "@/lib/bill-entry";
import { spendingByCategory } from "@/lib/categories";
import { supabase } from "@/lib/supabase";
import { fetchMembersWithPromptPay } from "@/lib/members";
import { ShareButton } from "./share-button";
import { TripTracker } from "@/components/trip-tracker";
import { TripTabBar } from "@/components/trip-tab-bar";
import { PageHeader, headerIconButton } from "@/components/page-header";
import { AvatarColorProvider } from "@/components/member-avatar";
import { MemberGroups } from "@/components/member-groups";
import { CategoryPie } from "@/components/category-pie";
import { avatarColorKey } from "@/lib/avatar";
import { formatTripDates } from "@/lib/dates";
import { ChevronLeft, PlaneTakeoff, ReceiptText } from "lucide-react";
import { Section } from "@/components/ui/grouped";

export default async function TripDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: trip }, members, { data: bills }] = await Promise.all([
    supabase.from("trips").select("*").eq("id", id).maybeSingle(),
    fetchMembersWithPromptPay<{ id: string; name: string; group_name: string | null }>(id, "id, name, group_name"),
    supabase.from("bills").select("id, title, amount, payer_id, participants, currency, note").eq("trip_id", id),
  ]);

  if (!trip) notFound();

  const normalizedBills = (bills ?? []).map((bill) => {
    const { entryType, personalAmounts, category } = parseBillNote(bill.note);
    return {
      ...bill,
      amount: Number(bill.amount),
      entryType,
      personalAmounts,
      category: billCategory(bill.title, category),
    };
  });
  const expenseBills = normalizedBills.filter((bill) => isExpenseEntry(bill.entryType));

  // spending totals by currency
  const totalByCurrency = expenseBills.reduce((acc, b) => {
    acc[b.currency] = (acc[b.currency] ?? 0) + b.amount;
    return acc;
  }, {} as Record<string, number>);

  const categorySpending = spendingByCategory(expenseBills);

  const dateRange = formatTripDates(trip.start_date, trip.end_date);

  const memberCount = (members ?? []).length;
  const billCount = (bills ?? []).length;

  return (
    <AvatarColorProvider keys={(members ?? []).map(avatarColorKey)}>
    <div className="min-h-screen">
      <TripTracker tripId={id} tripName={trip.name} />
      <PageHeader
        large
        title={trip.name}
        subtitle={dateRange}
        left={
          <Link href="/" aria-label="ทริปทั้งหมด" className={headerIconButton}>
            <ChevronLeft className="size-6" strokeWidth={2.25} />
          </Link>
        }
      />

      <div className="mx-auto max-w-md space-y-7 px-4 pb-[calc(env(safe-area-inset-bottom)+7.5rem)] pt-3">
        {/* The trip as a Wallet boarding pass: ID, share, and the numbers that matter */}
        <section
          aria-label="บัตรทริป"
          className="relative overflow-hidden rounded-[1.375rem] bg-pass text-white shadow-[0_10px_30px_-12px_rgb(0_0_0/0.5)]"
        >
          <div className="space-y-4 px-5 pb-5 pt-4">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-subhead font-semibold">
                <PlaneTakeoff className="size-[18px]" strokeWidth={2.25} />
                TripSplit
              </p>
              <p className="text-footnote text-pass-label">บัตรทริป</p>
            </div>
            <div>
              <p className="text-caption font-medium text-pass-label">Trip ID</p>
              <p className="mt-1 font-mono text-[1.625rem] font-semibold leading-none tracking-[0.08em]">{id}</p>
            </div>
            <ShareButton tripId={id} />
          </div>

          {/* perforation, cut in the page colour like a Wallet pass */}
          <div aria-hidden className="relative h-0">
            <span className="absolute -left-3 -top-3 size-6 rounded-full bg-grouped" />
            <span className="absolute -right-3 -top-3 size-6 rounded-full bg-grouped" />
            <span className="absolute inset-x-6 top-0 border-t-2 border-dotted border-white/20" />
          </div>

          <dl className="grid grid-cols-3 gap-2 px-5 pb-5 pt-4">
            <div>
              <dt className="text-caption font-medium text-pass-label">สมาชิก</dt>
              <dd className="mt-0.5 text-title3 font-semibold tabular-nums">{memberCount} <span className="text-subhead font-normal">คน</span></dd>
            </div>
            <div>
              <dt className="text-caption font-medium text-pass-label">บิล</dt>
              <dd className="mt-0.5 text-title3 font-semibold tabular-nums">{billCount} <span className="text-subhead font-normal">รายการ</span></dd>
            </div>
            <div className="text-right">
              <dt className="text-caption font-medium text-pass-label">ยอดรวม</dt>
              <dd className="mt-0.5 space-y-0.5">
                {Object.keys(totalByCurrency).length === 0 ? (
                  <p className="text-title3 font-semibold">0</p>
                ) : (
                  Object.entries(totalByCurrency).map(([cur, amt]) => (
                    <p key={cur} className="text-title3 font-semibold leading-tight tabular-nums">
                      {amt.toLocaleString("th-TH", { minimumFractionDigits: 0 })}{" "}
                      <span className="text-caption font-medium text-pass-label">{cur}</span>
                    </p>
                  ))
                )}
              </dd>
            </div>
          </dl>
        </section>

        {/* Where the money went, one pie per currency */}
        {categorySpending.map((spending) => (
          <Section
            key={spending.currency}
            header={categorySpending.length > 1 ? `ใช้จ่ายตามหมวด · ${spending.currency}` : "ใช้จ่ายตามหมวด"}
            action={
              <Link
                href={`/trips/${id}/report`}
                className="-mb-1 -mr-2 inline-flex h-8 items-center rounded-full px-2 text-subhead text-tint active:opacity-60"
              >
                ดูสรุป
              </Link>
            }
          >
            <CategoryPie spending={spending} />
          </Section>
        ))}

        {normalizedBills.length === 0 && (
          <section className="flex flex-col items-center px-6 py-8 text-center">
            <ReceiptText className="size-12 text-label-3" strokeWidth={1.5} />
            <p className="mt-3 text-title3 font-bold">ยังไม่มีบิล</p>
            <p className="mt-1 text-subhead text-label-2">กดปุ่ม + ด้านล่างเพื่อเพิ่มบิลแรกของทริป</p>
          </section>
        )}

        {/* Who is on the trip, family by family */}
        {memberCount > 0 && (
          <Section
            header={`สมาชิก ${memberCount} คน`}
            action={
              <Link
                href={`/trips/${id}/members`}
                className="-mb-1 -mr-2 inline-flex h-8 items-center rounded-full px-2 text-subhead text-tint active:opacity-60"
              >
                จัดการ
              </Link>
            }
          >
            <MemberGroups members={members ?? []} />
          </Section>
        )}
      </div>
      <TripTabBar tripId={id} />
    </div>
    </AvatarColorProvider>
  );
}
