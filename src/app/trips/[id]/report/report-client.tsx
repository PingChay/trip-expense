"use client";

import { useState } from "react";
import { ArrowRight, Users } from "lucide-react";
import { TripTabBar } from "@/components/trip-tab-bar";
import { PageHeader } from "@/components/page-header";
import { MemberAvatar } from "@/components/member-avatar";
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
          <p className="mb-1.5 text-xs font-semibold text-slate-500">{currency}</p>
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
            <div className="mt-1 flex justify-between border-t border-slate-100 pt-2 font-semibold">
              <span className="text-slate-700">{totalLabel}</span>
              <span
                className={`tabular-nums ${
                  rounded > 0.005 ? "text-positive" : rounded < -0.005 ? "text-negative" : "text-slate-400"
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
      <div key={currency} className="mt-3 border-t border-slate-100 pt-2.5">
        {items.length > 1 && (
          <p className="mb-1.5 text-xs font-semibold text-slate-500">{currency}</p>
        )}
        <div className="flex justify-between font-semibold">
          <span className="text-slate-700">{totalLabel}</span>
          <span
            className={`tabular-nums ${
              rounded > 0.005 ? "text-positive" : rounded < -0.005 ? "text-negative" : "text-slate-400"
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

function TransferParty({ name, isGroup, tone }: { name: string; isGroup?: boolean; tone: "from" | "to" }) {
  return (
    <span className="flex items-center gap-1.5">
      {isGroup ? (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Users className="h-3.5 w-3.5" />
        </span>
      ) : (
        <MemberAvatar name={name} size="sm" />
      )}
      <span className={`break-words ${tone === "from" ? "text-negative" : "text-positive"}`}>{name}</span>
    </span>
  );
}

function TransferParties({
  from,
  to,
  fromIsGroup,
  toIsGroup,
}: {
  from: string;
  to: string;
  fromIsGroup?: boolean;
  toIsGroup?: boolean;
}) {
  return (
    <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 text-sm font-medium">
      <TransferParty name={from} isGroup={fromIsGroup} tone="from" />
      {/* arrow stays with the receiver so a wrapped row reads "from" / "→ to" */}
      <span className="flex items-center gap-2">
        <ArrowRight aria-label="โอนให้" className="h-4 w-4 shrink-0 text-slate-400" />
        <TransferParty name={to} isGroup={toIsGroup} tone="to" />
      </span>
    </p>
  );
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
    <div className="min-h-screen">
      <PageHeader title="สรุป" />

      {/* Tabs */}
      <div className="sticky top-14 z-10 bg-background/90 backdrop-blur-md">
        <div role="tablist" className="mx-auto max-w-sm px-4 py-3">
          <div className="flex rounded-full bg-slate-200/60 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 whitespace-nowrap rounded-full px-2 py-1.5 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-150 ${
                  tab === t.id
                    ? "bg-white text-slate-900 shadow-[0_1px_3px_rgb(15_23_42/0.12)]"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-sm px-4 pb-32 pt-1">
        {/* Bill Breakdown */}
        {tab === "breakdown" && (
          <div className="space-y-4">
            {billBreakdown.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 py-14 text-center text-sm text-slate-500">ยังไม่มีรายการ</p>
            ) : (
              billBreakdown.map((bill) => (
                <div key={bill.id} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">{bill.title}</p>
                        {bill.entryType === "advance" && (
                          <p className="mt-1 inline-flex rounded-full bg-amber-100/80 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                            {getBillEntryLabel(bill.entryType)}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold text-slate-900 tabular-nums shrink-0">
                        {bill.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}{" "}
                        {bill.currency}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      จ่ายโดย: {bill.payerName}
                      {bill.date ? ` · ${bill.date}` : ""}
                    </p>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {bill.shares.map((s, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-4 py-2 text-slate-700">
                            <span className="flex items-center gap-2">
                              <MemberAvatar name={s.name} size="sm" />
                              {s.name}
                            </span>
                          </td>
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
              <p className="rounded-2xl border border-dashed border-slate-300 py-14 text-center text-sm text-slate-500">ยังไม่มีรายการ</p>
            ) : (
              <div className="space-y-3">
              {perPerson.map((p) => (
                <div key={p.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
                  <p className="mb-3 flex items-center gap-2.5 font-semibold text-slate-900">
                    <MemberAvatar name={p.name} />
                    {p.name}
                  </p>
                  {p.currencies.length === 0 && p.advanceCurrencies.length === 0 ? (
                    <p className="text-xs text-slate-400">ยังไม่มีบิลเกี่ยวข้อง</p>
                  ) : (
                    <>
                      {p.currencies.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-500">ค่าใช้จ่ายจริง</span>
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
                        <div className="mt-4 rounded-xl bg-amber-50 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-amber-800">เงินสำรอง</span>
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
            <div className="space-y-3">
              {groupSummaries.map((g) => (
                <div key={g.groupName} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      {g.isGroup ? <Users className="h-4 w-4 text-slate-400" /> : <MemberAvatar name={g.groupName} size="sm" />} {g.groupName}
                    </p>
                    <span className="text-xs text-slate-400">{g.memberCount} คน</span>
                  </div>
                  {g.currencies.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500">ค่าใช้จ่ายจริง</span>
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
                    <div className="mt-4 rounded-xl bg-amber-50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-amber-800">เงินสำรอง</span>
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
                <p className="text-sm text-slate-500">
                  {perPerson.length === 0 ? "ยังไม่มีรายการ" : "ทุกคนเสมอกัน ไม่มีการโอนเงิน"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupSettlements.length > 0 && (
                  <div className="space-y-2">
                    <p className="px-1 text-sm font-semibold text-slate-700">
                      การโอนเงินระหว่างกลุ่ม ({groupSettlements.length} รายการ)
                    </p>
                    {groupSettlements.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)]"
                      >
                        <TransferParties
                          from={s.fromName}
                          to={s.toName}
                          fromIsGroup={s.fromIsGroup}
                          toIsGroup={s.toIsGroup}
                        />
                        <p className="shrink-0 font-bold tabular-nums text-slate-900">
                          {s.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {s.currency}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {groupSettlements.length === 0 && settlements.length > 0 && (
                  <div className="space-y-2">
                    <p className="px-1 text-sm font-semibold text-slate-700">
                      การโอนเงินที่ต้องทำ ({settlements.length} รายการ)
                    </p>
                    {settlements.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)]"
                      >
                        <TransferParties from={s.fromName} to={s.toName} />
                        <p className="shrink-0 font-bold tabular-nums text-slate-900">
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
