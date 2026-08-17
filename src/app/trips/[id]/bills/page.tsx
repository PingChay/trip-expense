import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, ChevronRight, Receipt } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link
          href={`/trips/${id}`}
          className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold text-slate-900 flex-1">บิลทั้งหมด</h1>
        <Link href={`/trips/${id}/bills/new`}>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> เพิ่ม
          </Button>
        </Link>
      </header>

      <div className="max-w-sm mx-auto px-4 py-4">
        {!bills?.length ? (
          <div className="text-center py-16 space-y-3">
            <Receipt className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-400">ยังไม่มีบิล</p>
            <Link href={`/trips/${id}/bills/new`}>
              <Button size="sm" variant="outline">
                + เพิ่มบิลแรก
              </Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {bills.map((bill) => (
              <li key={bill.id}>
                <Link
                  href={`/trips/${id}/bills/${bill.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl border px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{bill.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      จ่ายโดย {memberMap[bill.payer_id] ?? "-"} ·{" "}
                      {bill.participants.length} คน
                      {bill.date && ` · ${bill.date}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-slate-900 tabular-nums">
                      {Number(bill.amount).toLocaleString("th-TH", {
                        minimumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-xs text-slate-400">{bill.currency}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
