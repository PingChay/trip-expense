import Link from "next/link";
import { notFound } from "next/navigation";
import { getBillEntryLabel, parseBillNote } from "@/lib/bill-entry";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { TripTabBar } from "@/components/trip-tab-bar";
import { Plus, ChevronRight, Receipt } from "lucide-react";

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
    supabase.from("members").select("id, name").eq("trip_id", id),
  ]);

  if (!trip) notFound();

  const memberMap = Object.fromEntries((members ?? []).map((m) => [m.id, m.name]));
  const normalizedBills = (bills ?? []).map((bill) => {
    const parsedNote = parseBillNote(bill.note);
    return { ...bill, entryType: parsedNote.entryType };
  });

  return (
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

      <div className="mx-auto max-w-sm px-4 pb-32 pt-5">
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
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
            {normalizedBills.map((bill) => (
              <li key={bill.id}>
                <Link
                  href={`/trips/${id}/bills/${bill.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 active:bg-slate-100"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-slate-900">{bill.title}</p>
                      {bill.entryType === "advance" && (
                        <span className="shrink-0 rounded-full bg-amber-100/80 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                          {getBillEntryLabel(bill.entryType)}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      จ่ายโดย {memberMap[bill.payer_id] ?? "-"} ·{" "}
                      {bill.participants.length} คน
                      {bill.date && ` · ${bill.date}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold tabular-nums text-slate-900">
                      {Number(bill.amount).toLocaleString("th-TH", {
                        minimumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400">{bill.currency}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <TripTabBar tripId={id} />
    </div>
  );
}
