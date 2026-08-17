"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Settlement } from "@/lib/balance";

type BillBreakdown = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  payerName: string;
  date: string | null;
  shares: { name: string; share: number }[];
};

type PersonSummary = {
  id: string;
  name: string;
  groupName: string | null;
  currencies: {
    currency: string;
    paid: number;
    owed: number;
    balance: number;
  }[];
};

type GroupSummary = {
  groupName: string;
  memberCount: number;
  currencies: {
    currency: string;
    paid: number;
    owed: number;
    balance: number;
  }[];
};

interface Props {
  tripId: string;
  billBreakdown: BillBreakdown[];
  perPerson: PersonSummary[];
  groupSummaries: GroupSummary[];
  settlements: Settlement[];
  groupSettlements: Settlement[];
}

type Tab = "breakdown" | "person" | "settlement";

export function ReportClient({ tripId, billBreakdown, perPerson, groupSummaries, settlements, groupSettlements }: Props) {
  const [tab, setTab] = useState<Tab>("breakdown");

  const tabs: { id: Tab; label: string }[] = [
    { id: "breakdown", label: "แยกบิล" },
    { id: "person", label: "รายคน" },
    { id: "settlement", label: "สรุปโอนเงิน" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link
          href={`/trips/${tripId}`}
          className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold text-slate-900">Report</h1>
      </header>

      {/* Tabs */}
      <div className="sticky top-14 z-10 bg-white border-b">
        <div className="max-w-sm mx-auto px-4 flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 py-4">
        {/* Bill Breakdown */}
        {tab === "breakdown" && (
          <div className="space-y-4">
            {billBreakdown.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-16">ยังไม่มีรายการ</p>
            ) : (
              billBreakdown.map((bill) => (
                <div key={bill.id} className="bg-white rounded-xl border overflow-hidden">
                  <div className="px-4 py-3 border-b bg-slate-50">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-slate-900">{bill.title}</p>
                      <p className="font-semibold text-slate-900 tabular-nums shrink-0">
                        {bill.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}{" "}
                        {bill.currency}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      จ่ายโดย: {bill.payerName}
                      {bill.date ? ` · ${bill.date}` : ""}
                    </p>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {bill.shares.map((s, i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="px-4 py-2 text-slate-700">{s.name}</td>
                          <td className="px-4 py-2 text-right text-slate-600 tabular-nums">
                            {s.share.toLocaleString("th-TH", { minimumFractionDigits: 2 })}{" "}
                            {bill.currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "person" && (
          <div className="space-y-4">
            {/* Group summary — only if there are groups */}
            {groupSummaries.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">
                  สรุปรายกลุ่ม
                </p>
                {groupSummaries.map((g) => (
                  <div key={g.groupName} className="bg-white rounded-xl border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>👨‍👩‍👧</span> {g.groupName}
                      </p>
                      <span className="text-xs text-slate-400">{g.memberCount} คน</span>
                    </div>
                    {g.currencies.map(({ currency, paid, owed, balance }) => {
                      const rounded = Math.round(balance * 100) / 100;
                      return (
                        <div key={currency} className="space-y-1 text-sm">
                          {g.currencies.length > 1 && (
                            <p className="text-xs font-medium text-slate-400 uppercase">{currency}</p>
                          )}
                          <div className="flex justify-between text-slate-500">
                            <span>จ่ายแทนไปทั้งหมด</span>
                            <span className="tabular-nums">
                              {paid.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {currency}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>ส่วนแบ่งรวมของกลุ่ม</span>
                            <span className="tabular-nums">
                              {owed.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {currency}
                            </span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-1.5 mt-1">
                            <span className="text-slate-700">ยอดสุทธิกลุ่ม</span>
                            <span
                              className={`tabular-nums ${
                                rounded > 0.005
                                  ? "text-green-600"
                                  : rounded < -0.005
                                  ? "text-red-500"
                                  : "text-slate-400"
                              }`}
                            >
                              {rounded > 0 ? "+" : ""}
                              {rounded.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {currency}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div className="border-t pt-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1 mb-2">
                    ยอดรายคน
                  </p>
                </div>
              </div>
            )}
            {perPerson.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-16">ยังไม่มีรายการ</p>
            ) : (
              <div className="space-y-3">
              {perPerson.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border p-4">
                  <p className="font-semibold text-slate-900 mb-3">{p.name}</p>
                  {p.currencies.length === 0 ? (
                    <p className="text-xs text-slate-400">ยังไม่มีบิลเกี่ยวข้อง</p>
                  ) : (
                    p.currencies.map(({ currency, paid, owed, balance }) => {
                      const rounded = Math.round(balance * 100) / 100;
                      return (
                        <div key={currency} className="mb-3 last:mb-0">
                          {p.currencies.length > 1 && (
                            <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                              {currency}
                            </p>
                          )}
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-500">สถานะ</span>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                rounded > 0.005
                                  ? "bg-green-50 text-green-600"
                                  : rounded < -0.005
                                  ? "bg-red-50 text-red-500"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {rounded > 0.005 ? "ได้รับเงิน" : rounded < -0.005 ? "ต้องจ่าย" : "เสมอกัน"}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between text-slate-500">
                              <span>จ่ายแทนไป</span>
                              <span className="tabular-nums">
                                {paid.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {currency}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                              <span>ส่วนแบ่งของตัวเอง</span>
                              <span className="tabular-nums">
                                {owed.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {currency}
                              </span>
                            </div>
                            <div className="flex justify-between font-medium border-t pt-2 mt-1">
                              <span className="text-slate-700">ยอดสุทธิ</span>
                              <span
                                className={`tabular-nums ${
                                  rounded > 0.005
                                    ? "text-green-600"
                                    : rounded < -0.005
                                    ? "text-red-500"
                                    : "text-slate-400"
                                }`}
                              >
                                {rounded > 0 ? "+" : ""}
                                {rounded.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {currency}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ))}
              </div>
            )}
          </div>
        )}

        {tab === "settlement" && (
          <div className="space-y-4">
            {settlements.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-400 text-sm">
                  {perPerson.length === 0 ? "ยังไม่มีรายการ" : "ทุกคนเสมอกัน ไม่มีการโอนเงิน 🎉"}
                </p>
              </div>
            ) : (
              <>
                {/* Group-to-group settlements — only if there are groups */}
                {groupSettlements.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">
                      สรุปรายกลุ่ม
                    </p>
                    {groupSettlements.map((s, i) => (
                      <div
                        key={i}
                        className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            <span className="mr-1">👨‍👩‍👧</span>
                            <span className="text-red-500">{s.fromName}</span>
                            <span className="text-slate-400 mx-1.5">→</span>
                            <span className="text-green-600">{s.toName}</span>
                          </p>
                        </div>
                        <p className="font-bold text-slate-900 tabular-nums shrink-0">
                          {s.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {s.currency}
                        </p>
                      </div>
                    ))}
                    <div className="border-t pt-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1 mb-2">
                        รายละเอียดรายคน
                      </p>
                    </div>
                  </div>
                )}

                {/* Individual settlements */}
                <div className="space-y-2">
                  {!groupSettlements.length && (
                    <p className="text-xs text-slate-400 text-center">
                      การโอนเงินที่ต้องทำ ({settlements.length} รายการ)
                    </p>
                  )}
                  {settlements.map((s, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl border p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          <span className="text-red-500">{s.fromName}</span>
                          <span className="text-slate-400 mx-1.5">→</span>
                          <span className="text-green-600">{s.toName}</span>
                        </p>
                      </div>
                      <p className="font-bold text-slate-900 tabular-nums shrink-0">
                        {s.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {s.currency}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
