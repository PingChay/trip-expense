"use client";

import { useState } from "react";
import { Check, Users } from "lucide-react";
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
  payerIds: Record<string, string>;
}

type Tab = "breakdown" | "person" | "group" | "settlement";

type SummaryItem = { currency: string; paid: number; owed: number; balance: number };

/** One currency of a card: expense paid/share, plus transfers already made or received. */
type LedgerLine = {
  currency: string;
  paid: number;
  owed: number;
  sent: number;
  received: number;
  expenseBalance: number;
  balance: number;
};

const money = (value: number) =>
  value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const round2 = (value: number) => Math.round(value * 100) / 100;
const isZero = (value: number) => Math.abs(round2(value)) < 0.005;

function ledgerLines(expense: SummaryItem[], payments: SummaryItem[]): LedgerLine[] {
  const currencies = [...new Set([...expense, ...payments].map((item) => item.currency))];
  return currencies.map((currency) => {
    const e = expense.find((item) => item.currency === currency);
    const p = payments.find((item) => item.currency === currency);
    return {
      currency,
      paid: e?.paid ?? 0,
      owed: e?.owed ?? 0,
      sent: p?.paid ?? 0,
      received: p?.owed ?? 0,
      expenseBalance: e?.balance ?? 0,
      balance: (e?.balance ?? 0) + (p?.balance ?? 0),
    };
  });
}

/** "+" = gets money back, "−" = needs to pay; colour carries the same meaning at a glance. */
function signed(balance: number) {
  const rounded = round2(balance);
  const sign = rounded > 0.005 ? "+" : rounded < -0.005 ? "−" : "";
  const tone = sign === "+" ? "text-positive" : sign === "−" ? "text-negative" : "text-slate-400";
  return { text: `${sign}${money(Math.abs(rounded))}`, tone, sign };
}

/**
 * Settled lines say why they are settled: someone who owed and has transferred is
 * "paid", someone who was owed and got it back is "received", anyone else never owed.
 */
function settledStatus(line: LedgerLine) {
  if (line.expenseBalance < -0.005) return "จ่ายเรียบร้อยแล้ว";
  if (line.expenseBalance > 0.005) return "ได้รับครบแล้ว";
  return null;
}

function Verdict({ lines }: { lines: LedgerLine[] }) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      {lines.map((line) => {
        const currencyTag = lines.length > 1 && <span className="text-xs font-medium"> {line.currency}</span>;
        if (isZero(line.balance)) {
          const status = settledStatus(line);
          return status ? (
            <span
              key={line.currency}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[13px] font-semibold leading-none text-positive"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
              {status}
              {currencyTag}
            </span>
          ) : (
            <span key={line.currency} className="rounded-full bg-slate-100 px-2.5 py-1 text-[13px] font-medium leading-none text-slate-500">
              ไม่ต้องโอน{currencyTag}
            </span>
          );
        }
        const v = signed(line.balance);
        return (
          <span
            key={line.currency}
            className={`rounded-full px-2.5 py-1 text-[15px] font-semibold leading-none tabular-nums ${v.sign === "+" ? "bg-emerald-50" : "bg-red-50"} ${v.tone}`}
          >
            {v.text} <span className="text-xs font-medium">{line.currency}</span>
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
    </p>
  );
}

function LedgerRow({ label, value, currency }: { label: string; value: string; currency: string }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span className="tabular-nums">
        {value} {currency}
      </span>
    </div>
  );
}

/** Receipt-style breakdown: paid, minus own share, then transfers already settled, equals what is left. */
function Ledger({ lines, labels }: { lines: LedgerLine[]; labels: { paid: string; owed: string } }) {
  return (
    <div className="space-y-3">
      {lines.map((line) => {
        const net = signed(line.balance);
        return (
          <div key={line.currency} className="space-y-1 text-sm">
            {lines.length > 1 && <p className="text-xs font-semibold text-slate-500">{line.currency}</p>}
            <LedgerRow label={labels.paid} value={money(line.paid)} currency={line.currency} />
            <LedgerRow label={labels.owed} value={`− ${money(line.owed)}`} currency={line.currency} />
            {line.sent > 0.005 && <LedgerRow label="โอนแล้ว" value={`+ ${money(line.sent)}`} currency={line.currency} />}
            {line.received > 0.005 && (
              <LedgerRow label="ได้รับแล้ว" value={`− ${money(line.received)}`} currency={line.currency} />
            )}
            <div className="flex justify-between border-t border-slate-100 pt-1.5 font-medium">
              <span className="text-slate-700">สรุป</span>
              <span className={`tabular-nums ${net.tone}`}>
                {net.text} {line.currency}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const LEDGER_LABELS = { paid: "จ่ายไป", owed: "ส่วนของตัวเอง" };
const GROUP_LEDGER_LABELS = { paid: "จ่ายไป", owed: "ส่วนของกลุ่ม" };

function SummaryCard({
  heading,
  currencies,
  advanceCurrencies,
  labels,
}: {
  heading: React.ReactNode;
  currencies: SummaryItem[];
  advanceCurrencies: SummaryItem[];
  labels: { paid: string; owed: string };
}) {
  const lines = ledgerLines(currencies, advanceCurrencies);
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        {heading}
        {lines.length > 0 && <Verdict lines={lines} />}
      </div>
      {lines.length === 0 ? <p className="text-xs text-slate-400">ยังไม่มีบิล</p> : <Ledger lines={lines} labels={labels} />}
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
  payerIds,
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
                labels={g.isGroup ? GROUP_LEDGER_LABELS : LEDGER_LABELS}
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
                          <SettlementQr
                            target={promptPayTargets[s.toName]}
                            tripId={tripId}
                            from={s.fromName}
                            fromMemberId={payerIds[s.fromName]}
                            to={s.toName}
                            amount={s.amount}
                            currency={s.currency}
                          />
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
                          <SettlementQr
                            target={promptPayTargets[s.toName]}
                            tripId={tripId}
                            from={s.fromName}
                            fromMemberId={payerIds[s.fromName]}
                            to={s.toName}
                            amount={s.amount}
                            currency={s.currency}
                          />
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
