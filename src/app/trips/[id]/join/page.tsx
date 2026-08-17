import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: trip }, { data: members }, { data: bills }] = await Promise.all([
    supabase.from("trips").select("*").eq("id", id).maybeSingle(),
    supabase.from("members").select("name").eq("trip_id", id),
    supabase.from("bills").select("amount").eq("trip_id", id),
  ]);

  if (!trip) notFound();

  const total = (bills ?? []).reduce((s, b) => s + Number(b.amount), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1">
          <p className="text-xs text-slate-400 font-mono tracking-widest">{id}</p>
          <h1 className="text-2xl font-bold text-slate-900">{trip.name}</h1>
          {trip.start_date && (
            <p className="text-sm text-slate-500">
              {trip.start_date}
              {trip.end_date ? ` – ${trip.end_date}` : ""}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{(members ?? []).length}</p>
            <p className="text-xs text-slate-400 mt-0.5">สมาชิก</p>
          </div>
          <div className="bg-white rounded-2xl border p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{(bills ?? []).length}</p>
            <p className="text-xs text-slate-400 mt-0.5">บิล</p>
          </div>
        </div>

        {(members ?? []).length > 0 && (
          <div className="bg-white rounded-2xl border p-4">
            <p className="text-xs font-medium text-slate-500 mb-2">สมาชิกในทริป</p>
            <div className="flex flex-wrap gap-2">
              {(members ?? []).map((m, i) => (
                <span
                  key={i}
                  className="bg-slate-100 text-slate-700 text-sm px-2.5 py-1 rounded-full"
                >
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {total > 0 && (
          <div className="bg-white rounded-2xl border p-4 text-center">
            <p className="text-xs text-slate-500">ยอดรวมค่าใช้จ่าย</p>
            <p className="text-2xl font-bold text-slate-900">
              {total.toLocaleString("th-TH", { minimumFractionDigits: 0 })} ฿
            </p>
          </div>
        )}

        <Link href={`/trips/${id}`} className="block">
          <Button className="w-full h-12 text-base">เข้าร่วมทริปนี้</Button>
        </Link>
      </div>
    </div>
  );
}
