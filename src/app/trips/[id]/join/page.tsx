import Link from "next/link";
import { notFound } from "next/navigation";
import { isExpenseEntry, parseBillNote } from "@/lib/bill-entry";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/member-avatar";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: trip }, { data: members }, { data: bills }] = await Promise.all([
    supabase.from("trips").select("*").eq("id", id).maybeSingle(),
    supabase.from("members").select("name").eq("trip_id", id),
    supabase.from("bills").select("amount, note").eq("trip_id", id),
  ]);

  if (!trip) notFound();

  const total = (bills ?? [])
    .filter((bill) => isExpenseEntry(parseBillNote(bill.note).entryType))
    .reduce((s, b) => s + Number(b.amount), 0);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1">
          <p className="font-mono text-xs tracking-[0.2em] text-slate-500">{id}</p>
          <h1 className="text-balance text-2xl font-bold tracking-tight text-slate-900">{trip.name}</h1>
          {trip.start_date && (
            <p className="text-sm text-slate-500">
              {trip.start_date}
              {trip.end_date ? ` – ${trip.end_date}` : ""}
            </p>
          )}
        </div>

        <dl className="grid grid-cols-2 divide-x divide-slate-100 rounded-2xl border border-slate-200/80 bg-white py-4 text-center shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
          <div>
            <dd className="text-2xl font-bold text-slate-900">{(members ?? []).length}</dd>
            <dt className="mt-0.5 text-xs text-slate-500">สมาชิก</dt>
          </div>
          <div>
            <dd className="text-2xl font-bold text-slate-900">{(bills ?? []).length}</dd>
            <dt className="mt-0.5 text-xs text-slate-500">บิล</dt>
          </div>
        </dl>

        {(members ?? []).length > 0 && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
            <p className="mb-3 text-sm font-semibold text-slate-700">สมาชิกในทริป</p>
            <div className="flex flex-wrap gap-2">
              {(members ?? []).map((m, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-sm text-slate-700"
                >
                  <MemberAvatar name={m.name} size="sm" />
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {total > 0 && (
          <div className="rounded-2xl bg-slate-900 p-5 text-center text-white shadow-[0_12px_32px_-12px_rgb(15_23_42/0.55)]">
            <p className="text-xs text-slate-400">ยอดรวมค่าใช้จ่าย</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {total.toLocaleString("th-TH", { minimumFractionDigits: 0 })} ฿
            </p>
          </div>
        )}

        <Link href={`/trips/${id}`} className="block">
          <Button className="h-12 w-full rounded-xl text-base">เข้าร่วมทริปนี้</Button>
        </Link>
      </div>
    </div>
  );
}
