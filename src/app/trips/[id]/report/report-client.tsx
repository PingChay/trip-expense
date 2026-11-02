"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { TripTabBar } from "@/components/trip-tab-bar";
import { PageHeader } from "@/components/page-header";
import { AVATAR_INSET, Section, row } from "@/components/ui/grouped";
import { AvatarColorProvider, GroupAvatar, MemberAvatar } from "@/components/member-avatar";
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
  /** members behind each settlement label; null until the promptpay column exists */
  setupCandidates: Record<string, Array<{ id: string; name: string }>> | null;
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
  const tone = sign === "+" ? "text-positive" : sign === "−" ? "text-negative" : "text-label-2";
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
        const currencyTag = lines.length > 1 && <span className="text-caption font-medium"> {line.currency}</span>;
        if (isZero(line.balance)) {
          const status = settledStatus(line);
          return status ? (
            <span
              key={line.currency}
              className="inline-flex items-center gap-1 rounded-full bg-green/15 px-2.5 py-1 text-footnote font-semibold text-positive"
            >
              <Check className="size-3.5" strokeWidth={3} />
              {status}
              {currencyTag}
            </span>
          ) : (
            <span key={line.currency} className="rounded-full bg-fill-3 px-2.5 py-1 text-footnote font-medium text-label-2">
              ไม่ต้องโอน{currencyTag}
            </span>
          );
        }
        const v = signed(line.balance);
        return (
          <span key={line.currency} className={`text-title3 font-bold tabular-nums ${v.tone}`}>
            {v.text} <span className="text-caption font-semibold">{line.currency}</span>
          </span>
        );
      })}
    </div>
  );
}

function SignLegend() {
  return (
    <p className="flex items-center gap-4 px-4 text-footnote text-label-2">
      <span><b className="font-bold text-positive">+</b> ได้คืน</span>
      <span><b className="font-bold text-negative">−</b> ต้องจ่าย</span>
    </p>
  );
}

function LedgerRow({ label, value, currency }: { label: string; value: string; currency: string }) {
  return (
    <div className={`${row} min-h-10 justify-between py-2 text-subhead`}>
      <span className="text-label-2">{label}</span>
      <span className="tabular-nums text-label">
        {value} {currency}
      </span>
    </div>
  );
}

/** Receipt-style rows: paid, minus own share, then transfers already settled, equals what is left. */
function Ledger({ lines, labels }: { lines: LedgerLine[]; labels: { paid: string; owed: string } }) {
  return (
    <>
      {lines.map((line) => {
        const net = signed(line.balance);
        return (
          <div key={line.currency} className="ios-list">
            {lines.length > 1 && (
              <p className="px-4 pb-0.5 pt-2.5 text-caption font-semibold text-label-2">{line.currency}</p>
            )}
            <LedgerRow label={labels.paid} value={money(line.paid)} currency={line.currency} />
            <LedgerRow label={labels.owed} value={`− ${money(line.owed)}`} currency={line.currency} />
            {line.sent > 0.005 && <LedgerRow label="โอนแล้ว" value={`+ ${money(line.sent)}`} currency={line.currency} />}
            {line.received > 0.005 && (
              <LedgerRow label="ได้รับแล้ว" value={`− ${money(line.received)}`} currency={line.currency} />
            )}
            <div className={`${row} min-h-10 justify-between py-2 text-subhead font-semibold`}>
              <span>สรุป</span>
              <span className={`tabular-nums ${net.tone}`}>
                {net.text} {line.currency}
              </span>
            </div>
          </div>
        );
      })}
    </>
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
    <Section>
      <div className={`${row} items-center justify-between py-3`}>
        {heading}
        {lines.length > 0 && <Verdict lines={lines} />}
      </div>
      {lines.length === 0 ? (
        <p className={`${row} text-subhead text-label-2`}>ยังไม่มีบิล</p>
      ) : (
        <Ledger lines={lines} labels={labels} />
      )}
    </Section>
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
  setupCandidates,
}: Props) {
  const hasGroups = groupSummaries.length > 0;
  // bill rows only carry names; groupName is the member's group label when the trip has groups
  const groupOf = Object.fromEntries(perPerson.map((p) => [p.name, p.groupName]));
  const [tab, setTab] = useState<Tab>("settlement");

  const tabs: { id: Tab; label: string }[] = [
    { id: "settlement", label: "สรุปโอนเงิน" },
    { id: "breakdown", label: "แยกบิล" },
    { id: "person", label: "รายคน" },
    ...(hasGroups ? [{ id: "group" as const, label: "รายกลุ่ม" }] : []),
  ];

  const settlementRow = (
    key: string | number,
    s: Settlement & { fromIsGroup?: boolean; toIsGroup?: boolean }
  ) => (
    <li key={key} className={`${row} justify-between py-3`}>
      <TransferParties from={s.fromName} to={s.toName} fromIsGroup={s.fromIsGroup} toIsGroup={s.toIsGroup} />
      <div className="flex shrink-0 items-center gap-3">
        <p className="text-right font-semibold tabular-nums">
          {s.amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="block text-caption font-medium text-label-2">{s.currency}</span>
        </p>
        <SettlementQr
          target={promptPayTargets[s.toName]}
          tripId={tripId}
          from={s.fromName}
          fromMemberId={payerIds[s.fromName]}
          to={s.toName}
          amount={s.amount}
          currency={s.currency}
          setupCandidates={setupCandidates?.[s.toName]}
        />
      </div>
    </li>
  );

  const emptyState = (text: string) => (
    <p className="px-6 py-16 text-center text-subhead text-label-2">{text}</p>
  );

  return (
    <AvatarColorProvider keys={perPerson.map((p) => p.groupName ?? p.name)}>
    <div className="min-h-screen">
      <PageHeader large title="สรุป" />

      {/* iOS segmented control, pinned under the bar */}
      <div className="material-bar sticky top-[calc(env(safe-area-inset-top)+3.25rem)] z-10">
        <div role="tablist" aria-label="มุมมองสรุป" className="mx-auto max-w-md px-4 pb-2.5 pt-1">
          <div className="flex rounded-full bg-fill-3 p-0.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`h-8 flex-1 whitespace-nowrap rounded-full px-2 text-footnote font-semibold transition-[background-color,box-shadow] duration-200 ${
                  tab === t.id
                    ? "bg-cell text-label shadow-[0_3px_8px_rgb(0_0_0/0.12),0_3px_1px_rgb(0_0_0/0.04)] dark:bg-[#636366]"
                    : "text-label"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+7.5rem)] pt-4">
        {/* Bill Breakdown */}
        {tab === "breakdown" && (
          <div className="space-y-6">
            {billBreakdown.length === 0
              ? emptyState("ยังไม่มีรายการ")
              : billBreakdown.map((bill) => (
                  <Section key={bill.id} inset={AVATAR_INSET} groupClassName="[&>*:first-child+*]:before:left-0">
                    <div className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 break-words font-semibold">
                          {bill.title}
                          {bill.entryType === "advance" && (
                            <span className="ml-1.5 inline-block rounded-full bg-orange/15 px-2 py-0.5 align-[2px] text-caption font-semibold text-orange-ink">
                              {getBillEntryLabel(bill.entryType)}
                            </span>
                          )}
                        </p>
                        <p className="shrink-0 font-semibold tabular-nums">
                          {bill.amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                          <span className="text-caption font-medium text-label-2">{bill.currency}</span>
                        </p>
                      </div>
                      <p className="mt-0.5 text-footnote text-label-2">
                        จ่ายโดย {bill.payerName}
                        {bill.date ? ` · ${bill.date}` : ""}
                      </p>
                    </div>
                    {bill.shares.map((share, i) => (
                      <div key={i} className={`${row} justify-between text-subhead`}>
                        <span className="flex min-w-0 items-center gap-3">
                          <MemberAvatar name={share.name} group={groupOf[share.name]} />
                          <span className="min-w-0 break-words">{share.name}</span>
                        </span>
                        <span className="shrink-0 text-right tabular-nums text-label-2">
                          {share.share.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                          {bill.currency}
                          {share.personal > 0 && <span className="block text-caption text-label-2">ราคาเฉพาะ</span>}
                        </span>
                      </div>
                    ))}
                  </Section>
                ))}
          </div>
        )}

        {tab === "person" && (
          <div className="space-y-4">
            {perPerson.length > 0 && <SignLegend />}
            {perPerson.length === 0
              ? emptyState("ยังไม่มีรายการ")
              : perPerson.map((p) => (
                  <SummaryCard
                    key={p.id}
                    heading={
                      <p className="flex min-w-0 items-center gap-3 font-semibold">
                        <MemberAvatar name={p.name} group={p.groupName} />
                        <span className="break-words">{p.name}</span>
                      </p>
                    }
                    currencies={p.currencies}
                    advanceCurrencies={p.advanceCurrencies}
                    labels={LEDGER_LABELS}
                  />
                ))}
          </div>
        )}

        {tab === "group" && hasGroups && (
          <div className="space-y-4">
            <SignLegend />
            {groupSummaries.map((g) => (
              <SummaryCard
                key={g.groupName}
                heading={
                  <p className="flex min-w-0 items-center gap-3">
                    {g.isGroup ? <GroupAvatar group={g.groupName} size="md" /> : <MemberAvatar name={g.groupName} />}
                    <span className="min-w-0">
                      <span className="block break-words font-semibold">{g.groupName}</span>
                      {g.isGroup && <span className="block text-footnote text-label-2">{g.memberCount} คน</span>}
                    </span>
                  </p>
                }
                currencies={g.currencies}
                advanceCurrencies={g.advanceCurrencies}
                labels={g.isGroup ? GROUP_LEDGER_LABELS : LEDGER_LABELS}
              />
            ))}
          </div>
        )}

        {tab === "settlement" &&
          (settlements.length === 0 && groupSettlements.length === 0 ? (
            perPerson.length === 0 ? (
              emptyState("ยังไม่มีรายการ")
            ) : (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-green text-white">
                  <Check className="size-7" strokeWidth={3} />
                </span>
                <p className="mt-4 text-title3 font-bold">ไม่ต้องโอน</p>
                <p className="mt-1 text-subhead text-label-2">ทุกคนจ่ายพอดี</p>
              </div>
            )
          ) : groupSettlements.length > 0 ? (
            <Section header={`ต้องโอน ${groupSettlements.length} รายการ`} as="ul" inset="3rem">
              {groupSettlements.map((s, i) => settlementRow(i, s))}
            </Section>
          ) : (
            <Section header={`ต้องโอน ${settlements.length} รายการ`} as="ul" inset="3rem">
              {settlements.map((s, i) => settlementRow(i, s))}
            </Section>
          ))}
      </div>
      <TripTabBar tripId={tripId} />
    </div>
    </AvatarColorProvider>
  );
}
