"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { TripTabBar } from "@/components/trip-tab-bar";
import { PageHeader } from "@/components/page-header";
import { MemberAvatar } from "@/components/member-avatar";
import { TransferParties } from "@/components/transfer-parties";
import { SettlementQr } from "@/components/promptpay-qr";
import type { PromptPayTarget } from "@/lib/members";
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
  shares: { name: string; share: number; personal: number }[];
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
  promptPayTargets: Record<string, PromptPayTarget>;
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

type SummaryItem = { currency: string; paid: number; owed: number; balance: number };

const money = (value: number) =>
  value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const round2 = (value: number) => Math.round(value * 100) / 100;

/** "+" = gets money back, "−" = needs to pay; colour carries the same meaning at a glance. */
function signed(balance: number, advance = false) {
  const rounded = round2(balance);
  const sign = rounded > 0.005 ? "+" : rounded < -0.005 ? "−" : "";
  const tone = advance
    ? sign
      ? "text-amber-700"
      : "text-amber-700/60"
    : sign === "+"
      ? "text-positive"
      : sign === "−"
        ? "text-negative"
        : "text-slate-400";
  return { text: `${sign}${money(Math.abs(rounded))}`, tone, sign };
}

function Verdict({ items }: { items: CurrencyBalance[] }) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      {items.map((item) => {
        const v = signed(item.balance);
        const pill =
          v.sign === "+" ? "bg-emerald-50" : v.sign === "−" ? "bg-red-50" : "bg-slate-100";
        return (
          <span
            key={item.currency}
            className={`rounded-full px-2.5 py-1 text-[15px] font-semibold leading-none tabular-nums ${pill} ${v.tone}`}
          >
            {v.text} <span className="text-xs font-medium">{item.currency}</span>
          </span>
        );
      })}
    </div>
  );
}

function SignLegend() {
  return (
    <p className="flex items-center gap-3 px-1 text-xs text-slate-500">
      <span><b className="font-semibold text-positive">+</b> ได้คืน</span>
      <span><b className="font-semibold text-negative">−</b> ต้องจ่าย</span>
      <span className="flex items-center gap-1">
        <span className="size-2.5 rounded-sm bg-amber-200" /> การจ่ายเงิน
      </span>
    </p>
  );
}

/** Receipt-style breakdown: paid, minus own share, equals what this part contributes. */
function LedgerSection({
  title,
  items,
  paidLabel,
  owedLabel,
  advance = false,
}: {
  title: string;
  items: SummaryItem[];
  paidLabel: string;
  owedLabel: string;
  advance?: boolean;
}) {
  return (
    <div className={advance ? "rounded-xl bg-amber-50 p-3" : ""}>
      <p className={`mb-2 text-xs font-semibold ${advance ? "text-amber-800" : "text-slate-500"}`}>
        {title}
      </p>
      {items.map(({ currency, paid, owed, balance }) => {
        const net = signed(balance, advance);
        return (
          <div key={currency} className="mb-3 space-y-1 text-sm last:mb-0">
            {items.length > 1 && <p className="text-xs font-semibold text-slate-500">{currency}</p>}
            <div className="flex justify-between text-slate-600">
              <span>{paidLabel}</span>
              <span className="tabular-nums">
                {money(paid)} {currency}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{owedLabel}</span>
              <span className="tabular-nums">
                − {money(owed)} {currency}
              </span>
            </div>
            <div
              className={`flex justify-between border-t pt-1.5 font-medium ${advance ? "border-amber-200/70" : "border-slate-100"}`}
            >
              <span className="text-slate-700">สรุป</span>
              <span className={`tabular-nums ${net.tone}`}>
                {net.text} {currency}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const LEDGER_LABELS = {
  paid: "จ่ายไป",
  owed: "ส่วนของตัวเอง",
  advancePaid: "จ่ายให้คนอื่น",
  advanceOwed: "ได้รับจากคนอื่น",
};

function SummaryCard({
  heading,
  currencies,
  advanceCurrencies,
  labels,
}: {
  heading: React.ReactNode;
  currencies: SummaryItem[];
  advanceCurrencies: SummaryItem[];
  labels: { paid: string; owed: string; advancePaid: string; advanceOwed: string };
}) {
  const empty = currencies.length === 0 && advanceCurrencies.length === 0;
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        {heading}
        {!empty && <Verdict items={mergeBalances(currencies, advanceCurrencies)} />}
      </div>
      {empty ? (
        <p className="text-xs text-slate-400">ยังไม่มีบิล</p>
      ) : (
        <div className="space-y-4">
          {currencies.length > 0 && (
            <LedgerSection title="ค่าใช้จ่าย" items={currencies} paidLabel={labels.paid} owedLabel={labels.owed} />
          )}
          {advanceCurrencies.length > 0 && (
            <LedgerSection
              advance
              title="การจ่ายเงิน"
              items={advanceCurrencies}
              paidLabel={labels.advancePaid}
              owedLabel={labels.advanceOwed}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function ReportClient({
  tripId,
  billBreakdown,
  perPerson,
  groupSummaries,
  settlements,
  groupSettlements,
  promptPayTargets,
}: Props) {
  const hasGroups = groupSummaries.length > 0;
  const [tab, setTab] = useState<Tab>("settlement");

  const tabs: { id: Tab; label: string }[] = [
    { id: "settlement", label: "สรุปโอนเงิน" },
    { id: "breakdown", label: "แยกบิล" },
    { id: "person", label: "รายคน" },
    ...(hasGroups ? [{ id: "group" as const, label: "รายกลุ่ม" }] : []),
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
                        {bill.amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
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
                            {s.share.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                            {bill.currency}
                            {s.personal > 0 && (
                              <span className="block text-[11px] text-slate-400">ราคาเฉพาะ</span>
                            )}
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
          <div className="space-y-3">
            {perPerson.length > 0 && <SignLegend />}
            {perPerson.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 py-14 text-center text-sm text-slate-500">ยังไม่มีรายการ</p>
            ) : (
              perPerson.map((p) => (
                <SummaryCard
                  key={p.id}
                  heading={
                    <p className="flex min-w-0 items-center gap-2.5 font-semibold text-slate-900">
                      <MemberAvatar name={p.name} />
                      <span className="truncate">{p.name}</span>
                    </p>
                  }
                  currencies={p.currencies}
                  advanceCurrencies={p.advanceCurrencies}
                  labels={LEDGER_LABELS}
                />
              ))
            )}
          </div>
        )}

        {tab === "group" && hasGroups && (
          <div className="space-y-3">
            <SignLegend />
            {groupSummaries.map((g) => (
              <SummaryCard
                key={g.groupName}
                heading={
                  <p className="flex min-w-0 items-center gap-1.5 font-semibold text-slate-900">
                    {g.isGroup ? <Users className="h-4 w-4 shrink-0 text-slate-400" /> : <MemberAvatar name={g.groupName} size="sm" />}
                    <span className="break-words">{g.groupName}</span>
                    {g.isGroup && <span className="shrink-0 text-xs font-normal text-slate-400">{g.memberCount} คน</span>}
                  </p>
                }
                currencies={g.currencies}
                advanceCurrencies={g.advanceCurrencies}
                labels={LEDGER_LABELS}
              />
            ))}
          </div>
        )}

        {tab === "settlement" && (
          <div className="space-y-4">
            {settlements.length === 0 && groupSettlements.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-slate-500">
                  {perPerson.length === 0 ? "ยังไม่มีรายการ" : "ไม่ต้องโอน ทุกคนจ่ายพอดี"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupSettlements.length > 0 && (
                  <div className="space-y-2">
                    <p className="px-1 text-sm font-semibold text-slate-700">
                      ต้องโอน {groupSettlements.length} รายการ
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
                        <div className="flex shrink-0 items-center gap-2.5">
                          <p className="font-bold tabular-nums text-slate-900">
                            {s.amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {s.currency}
                          </p>
                          <SettlementQr target={promptPayTargets[s.toName]} to={s.toName} amount={s.amount} currency={s.currency} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {groupSettlements.length === 0 && settlements.length > 0 && (
                  <div className="space-y-2">
                    <p className="px-1 text-sm font-semibold text-slate-700">
                      ต้องโอน {settlements.length} รายการ
                    </p>
                    {settlements.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)]"
                      >
                        <TransferParties from={s.fromName} to={s.toName} />
                        <div className="flex shrink-0 items-center gap-2.5">
                          <p className="font-bold tabular-nums text-slate-900">
                            {s.amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {s.currency}
                          </p>
                          <SettlementQr target={promptPayTargets[s.toName]} to={s.toName} amount={s.amount} currency={s.currency} />
                        </div>
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
