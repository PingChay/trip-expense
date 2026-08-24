"use client";

import { useState } from "react";
import Link from "next/link";
import { TripTabBar } from "@/components/trip-tab-bar";
import { getBillEntryLabel, type BillEntryType } from "@/lib/bill-entry";
import type { Settlement } from "@/lib/balance";

type BillBreakdown = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  entryType: BillEntryType;
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
  advanceCurrencies: {
    currency: string;
    paid: number;
    owed: number;
    balance: number;
  }[];
};

type GroupSummary = {
  groupName: string;
  isGroup: boolean;
  memberCount: number;
  currencies: {
    currency: string;
    paid: number;
    owed: number;
    balance: number;
  }[];
  advanceCurrencies: {
    currency: string;
    paid: number;
    owed: number;
    balance: number;
  }[];
};

type GroupSettlement = Settlement & {
  fromIsGroup: boolean;
  toIsGroup: boolean;
};

interface Props {
  tripId: string;
  billBreakdown: BillBreakdown[];
  perPerson: PersonSummary[];
  groupSummaries: GroupSummary[];
  settlements: Settlement[];
  groupSettlements: GroupSettlement[];
}

type Tab = "breakdown" | "person" | "group" | "settlement";

type CurrencyBalance = {
  currency: string;
  balance: number;
};

function mergeBalances(primary: CurrencyBalance[], secondary: CurrencyBalance[]) {
  const totals = new Map<string, number>();

  for (const item of primary) {
    totals.set(item.currency, (totals.get(item.currency) ?? 0) + item.balance);
  }

  for (const item of secondary) {
    totals.set(item.currency, (totals.get(item.currency) ?? 0) + item.balance);
  }

  return Array.from(totals.entries()).map(([currency, balance]) => ({ currency, balance }));
}

function SummaryRows({
  items,
  paidLabel,
  owedLabel,
  totalLabel,
  reversePrimarySecondary = false,
  showTotal = true,
}: {
  items: Array<{ currency: string; paid: number; owed: number; balance: number }>;
  paidLabel: string;
  owedLabel: string;
  totalLabel: string;
  reversePrimarySecondary?: boolean;
  showTotal?: boolean;
}) {
  return items.map(({ currency, paid, owed, balance }) => {
    const rounded = Math.round(balance * 100) / 100;
    const primaryRows = reversePrimarySecondary
      ? [
          { label: owedLabel, value: owed },
          { label: paidLabel, value: paid },
        ]
      : [
          { label: paidLabel, value: paid },
          { label: owedLabel, value: owed },
        ];

    return (
      <div key={currency} className="mb-3 last:mb-0">
        {items.length > 1 && (
          <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{currency}</p>
        )}
        <div className="space-y-1 text-sm">
          {primaryRows.map((row) => (
            <div key={row.label} className="flex justify-between text-slate-500">
              <span>{row.label}</span>
              <span className="tabular-nums">
                {row.value.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {currency}
              </span>
            </div>
          ))}
          {showTotal && (
            <div className="flex justify-between font-medium border-t pt-2 mt-1">
              <span className="text-slate-700">{totalLabel}</span>
              <span
                className={`tabular-nums ${
                  rounded > 0.005 ? "text-green-600" : rounded < -0.005 ? "text-red-500" : "text-slate-400"
                }`}
              >
                {rounded > 0 ? "+" : ""}
                {rounded.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {currency}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  });
}

function SummaryTotals({
  items,
  totalLabel,
}: {
  items: CurrencyBalance[];
  totalLabel: string;
}) {
  return items.map(({ currency, balance }) => {
    const rounded = Math.round(balance * 100) / 100;

    return (
      <div key={currency} className="mt-3 border-t pt-2">
        {items.length > 1 && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{currency}</p>
        )}
        <div className="flex justify-between font-medium">
          <span className="text-slate-700">{totalLabel}</span>
          <span
            className={`tabular-nums ${
              rounded > 0.005 ? "text-green-600" : rounded < -0.005 ? "text-red-500" : "text-slate-400"
            }`}
          >
            {rounded > 0 ? "+" : ""}
            {rounded.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {currency}
          </span>
        </div>
      </div>
    );
  });
}

export function ReportClient({ tripId, billBreakdown, perPerson, groupSummaries, settlements, groupSettlements }: Props) {
  const hasGroups = groupSummaries.length > 0;
  const [tab, setTab] = useState<Tab>("breakdown");

  const tabs: { id: Tab; label: string }[] = [
    { id: "breakdown", label: "แยกบิล" },
    { id: "person", label: "รายคน" },
    ...(hasGroups ? [{ id: "group" as const, label: "รายกลุ่ม" }] : []),
    { id: "settlement", label: "สรุปโอนเงิน" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3">
        <div className="text-center">
          <h1 className="font-semibold text-slate-900">สรุป</h1>
        </div>
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

      <div className="max-w-sm mx-auto px-4 py-4 pb-28">
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
                      <div>
                        <p className="font-medium text-slate-900">{bill.title}</p>
                        {bill.entryType === "advance" && (
                          <p className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            {getBillEntryLabel(bill.entryType)}
                          </p>
                        )}
                      </div>
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
            {perPerson.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-16">ยังไม่มีรายการ</p>
            ) : (
              <div className="space-y-3">
              {perPerson.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border p-4">
                  <p className="font-semibold text-slate-900 mb-3">{p.name}</p>
                  {p.currencies.length === 0 && p.advanceCurrencies.length === 0 ? (
                    <p className="text-xs text-slate-400">ยังไม่มีบิลเกี่ยวข้อง</p>
                  ) : (
                    <>
                      {p.currencies.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">ค่าใช้จ่ายจริง</span>
                          </div>
                          <SummaryRows
                            items={p.currencies}
                            paidLabel="จ่ายแทนไป"
                            owedLabel="ส่วนแบ่งของตัวเอง"
                            totalLabel="ยอดสุทธิ"
                            showTotal={p.advanceCurrencies.length === 0}
                          />
                        </div>
                      )}

                      {p.advanceCurrencies.length > 0 && (
                        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">เงินสำรอง</span>
                          </div>
                          <SummaryRows
                            items={p.advanceCurrencies}
                            paidLabel="จ่ายสำรองออกไปก่อน"
                            owedLabel="เงินสำรองที่รับไปถือ"
                            totalLabel="ยอดเงินสำรองสุทธิ"
                            reversePrimarySecondary
                          />
                        </div>
                      )}

                      {p.currencies.length > 0 && p.advanceCurrencies.length > 0 && (
                        <SummaryTotals
                          items={mergeBalances(p.currencies, p.advanceCurrencies)}
                          totalLabel="ยอดสุทธิ"
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
              </div>
            )}
          </div>
        )}

        {tab === "group" && hasGroups && (
          <div className="space-y-4">
            <div className="space-y-2">
              {groupSummaries.map((g) => (
                <div key={g.groupName} className="bg-white rounded-xl border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      {g.isGroup && <span>👨‍👩‍👧</span>} {g.groupName}
                    </p>
                    <span className="text-xs text-slate-400">{g.memberCount} คน</span>
                  </div>
                  {g.currencies.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">ค่าใช้จ่ายจริง</span>
                      </div>
                      <SummaryRows
                        items={g.currencies}
                        paidLabel="จ่ายแทนไปทั้งหมด"
                        owedLabel="ส่วนแบ่งรวมของกลุ่ม"
                        totalLabel="ยอดสุทธิกลุ่ม"
                        showTotal={g.advanceCurrencies.length === 0}
                      />
                    </div>
                  )}

                  {g.advanceCurrencies.length > 0 && (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">เงินสำรอง</span>
                      </div>
                      <SummaryRows
                        items={g.advanceCurrencies}
                        paidLabel="จ่ายสำรองออกไปก่อน"
                        owedLabel="เงินสำรองที่รับไปถือ"
                        totalLabel="ยอดเงินสำรองสุทธิ"
                        reversePrimarySecondary
                      />
                    </div>
                  )}

                  {g.currencies.length > 0 && g.advanceCurrencies.length > 0 && (
                    <SummaryTotals
                      items={mergeBalances(g.currencies, g.advanceCurrencies)}
                      totalLabel="ยอดสุทธิกลุ่ม"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "settlement" && (
          <div className="space-y-4">
            {settlements.length === 0 && groupSettlements.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-400 text-sm">
                  {perPerson.length === 0 ? "ยังไม่มีรายการ" : "ทุกคนเสมอกัน ไม่มีการโอนเงิน 🎉"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupSettlements.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 text-center">
                      การโอนเงินระหว่างกลุ่ม ({groupSettlements.length} รายการ)
                    </p>
                    {groupSettlements.map((s, i) => (
                      <div
                        key={i}
                        className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {s.fromIsGroup && <span className="mr-1">👨‍👩‍👧</span>}
                            <span className="text-red-500">{s.fromName}</span>
                            <span className="text-slate-400 mx-1.5">→</span>
                            {s.toIsGroup && <span className="mr-1">👨‍👩‍👧</span>}
                            <span className="text-green-600">{s.toName}</span>
                          </p>
                        </div>
                        <p className="font-bold text-slate-900 tabular-nums shrink-0">
                          {s.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {s.currency}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {groupSettlements.length === 0 && settlements.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 text-center">
                      การโอนเงินที่ต้องทำ ({settlements.length} รายการ)
                    </p>
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
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <TripTabBar tripId={tripId} />
    </div>
  );
}
