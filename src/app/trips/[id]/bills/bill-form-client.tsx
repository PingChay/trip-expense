"use client";

import { useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getBillEntryLabel, type BillEntryType, type PersonalAmounts } from "@/lib/bill-entry";
import { billShares } from "@/lib/balance";
import { PageHeader, headerProminentButton, headerTextButton } from "@/components/page-header";
import { AvatarColorProvider, GroupAvatar, MemberAvatar } from "@/components/member-avatar";
import { Section, row } from "@/components/ui/grouped";
import { avatarColorKey } from "@/lib/avatar";
import { ChevronDown, ChevronsUpDown, LoaderCircle } from "lucide-react";
import type { BillInput } from "@/lib/types";

/** A borderless text field filling the rest of a grouped row. */
const rowInput = "h-11 min-w-0 flex-1 bg-transparent text-body text-label outline-none placeholder:text-label-2";
const fieldError = "text-negative";
/** Separator inset for participant rows: padding + check + avatar and their gaps. */
const PARTICIPANT_INSET = "5.875rem";

const lastPayerKey = (tripId: string) => `tripsplit_last_payer_${tripId}`;
const noopSubscribe = () => () => {};

function readLastPayer(tripId: string) {
  try {
    return localStorage.getItem(lastPayerKey(tripId));
  } catch {
    return null;
  }
}

/** One family in the participant picker: a grouped section headed by the family, with a select-all toggle. */
function FamilySection({
  family,
  count,
  allSelected,
  onToggle,
  children,
}: {
  family: string;
  count: number;
  allSelected: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <Section
      as="div"
      inset={PARTICIPANT_INSET}
      header={
        <span className="flex items-center gap-2">
          <GroupAvatar group={family} />
          <span className="min-w-0 break-words font-semibold text-label">{family}</span>
          <span className="shrink-0">· {count} คน</span>
        </span>
      }
      action={
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={allSelected}
          className="-mb-1 -mr-2 h-8 shrink-0 rounded-full px-2 text-subhead text-tint active:opacity-60"
        >
          {allSelected ? "ไม่เลือกทั้งครอบครัว" : "เลือกทั้งครอบครัว"}
        </button>
      }
    >
      {children}
    </Section>
  );
}

interface Member {
  id: string;
  name: string;
  group_name?: string | null;
}

interface Props {
  tripId: string;
  members: Member[];
  initialData?: BillInput;
  saveAction: (data: BillInput) => Promise<void>;
  deleteAction?: () => Promise<void>;
}

export function BillFormClient({
  tripId,
  members,
  initialData,
  saveAction,
  deleteAction,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const today = new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "");
  const [currency, setCurrency] = useState(initialData?.currency ?? "THB");
  // new bills default to whoever paid last on this device; null on the server
  const lastPayer = useSyncExternalStore(noopSubscribe, () => readLastPayer(tripId), () => null);
  const [payerChoice, setPayerChoice] = useState<string | null>(initialData?.payerId ?? null);
  // "who paid" is chosen per family (any member of it) or per member without a family
  const payerOptions: { key: string; label: string; family: string | null; memberIds: string[] }[] = [];
  for (const m of members) {
    const family = m.group_name?.trim();
    if (!family) {
      payerOptions.push({ key: m.id, label: m.name, family: null, memberIds: [m.id] });
    } else if (!payerOptions.some((option) => option.family === family)) {
      payerOptions.push({
        key: `family:${family}`,
        label: family,
        family,
        memberIds: members.filter((other) => other.group_name?.trim() === family).map((other) => other.id),
      });
    }
  }
  const payerId =
    payerChoice ?? (members.some((m) => m.id === lastPayer) ? lastPayer! : members[0]?.id ?? "");
  const [participants, setParticipants] = useState<string[]>(
    initialData?.participants ?? members.map((m) => m.id)
  );
  const [date, setDate] = useState(initialData?.date ?? today);
  const [note, setNote] = useState(initialData?.note ?? "");
  const [entryType, setEntryType] = useState<BillEntryType>(initialData?.entryType ?? "expense");
  const [showMore, setShowMore] = useState(
    initialData?.entryType === "advance" || Boolean(initialData?.note?.trim())
  );
  const [usePersonal, setUsePersonal] = useState(
    Object.keys(initialData?.personalAmounts ?? {}).length > 0
  );
  const [personalInputs, setPersonalInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(initialData?.personalAmounts ?? {}).map(([id, value]) => [id, value.toString()])
    )
  );
  const [errors, setErrors] = useState<{
    title?: string;
    amount?: string;
    participants?: string;
    payer?: string;
    personal?: string;
  }>({});

  const amountNum = parseFloat(amount) || 0;
  const selectedCount = participants.length;
  // only ticked participants carry a personal amount; unticking someone drops theirs
  const personalAmounts: PersonalAmounts = usePersonal
    ? Object.fromEntries(
        participants
          .map((id) => [id, parseFloat(personalInputs[id] ?? "") || 0] as const)
          .filter(([, value]) => value > 0)
      )
    : {};
  const personalTotal = Object.values(personalAmounts).reduce((sum, value) => sum + value, 0);
  const remainder = amountNum - personalTotal;
  const evenCount = selectedCount - Object.keys(personalAmounts).length;
  const perPerson = evenCount > 0 ? remainder / evenCount : 0;
  const shares = billShares(amountNum, participants, personalAmounts);
  // over the total, or everyone has a fixed amount and they don't add up to the total
  const personalMismatch =
    amountNum > 0 &&
    personalTotal > 0 &&
    (remainder < -0.005 || (evenCount === 0 && Math.abs(remainder) > 0.005));
  const formatMoney = (value: number) => value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const personalMismatchMessage =
    remainder < 0
      ? `ราคาเฉพาะคนรวม ${formatMoney(personalTotal)} ${currency} เกินยอดบิล ${formatMoney(amountNum)} ${currency}`
      : `ทุกคนมีราคาเฉพาะแล้ว แต่รวมได้ ${formatMoney(personalTotal)} ${currency} ยังขาด ${formatMoney(remainder)} ${currency} จากยอดบิล`;

  function toggleParticipant(id: string) {
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
    setErrors((e) => ({ ...e, participants: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = "กรุณากรอกชื่อรายการ";
    if (!amountNum || amountNum <= 0) newErrors.amount = "จำนวนเงินต้องมากกว่า 0";
    if (participants.length === 0) newErrors.participants = "ต้องเลือกผู้ร่วมหารอย่างน้อย 1 คน";
    if (!payerId) newErrors.payer = "กรุณาเลือกผู้จ่าย";
    if (personalMismatch) newErrors.personal = personalMismatchMessage;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      localStorage.setItem(lastPayerKey(tripId), payerId);
    } catch {}
    startTransition(async () => {
      await saveAction({ title, amount: amountNum, currency, payerId, participants, date, note, entryType, personalAmounts });
    });
  }

  function handleDelete() {
    if (!deleteAction) return;
    if (!confirm("ลบบิลนี้?")) return;
    startDeleteTransition(async () => {
      await deleteAction();
    });
  }

  const saving = isPending || isDeleting;

  return (
    <AvatarColorProvider keys={members.map(avatarColorKey)}>
    <div className="min-h-screen">
      <form onSubmit={handleSubmit}>
      <PageHeader
        title={initialData ? "แก้ไขบิล" : "เพิ่มบิล"}
        left={
          <button type="button" onClick={() => router.back()} className={headerTextButton}>
            ยกเลิก
          </button>
        }
        right={
          <button type="submit" disabled={saving} className={headerProminentButton}>
            {isPending && <LoaderCircle className="size-4 animate-spin" />}
            {isPending ? "กำลังบันทึก" : "บันทึก"}
          </button>
        }
      />

      <div className="mx-auto max-w-md space-y-7 px-4 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] pt-3">
        {/* Amount + currency, then what it was for */}
        <Section
          footer={
            (errors.amount || errors.title) && (
              <p className={fieldError}>{[errors.amount, errors.title].filter(Boolean).join(" · ")}</p>
            )
          }
        >
          <div className={`${row} py-1`}>
            <label htmlFor="bill-amount" className="sr-only">จำนวนเงิน</label>
            <input
              id="bill-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              autoFocus={!initialData}
              value={amount}
              aria-invalid={!!errors.amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrors((er) => ({ ...er, amount: undefined }));
              }}
              className="h-16 min-w-0 flex-1 bg-transparent text-large-title font-bold tabular-nums text-label outline-none placeholder:text-label-2"
            />
            <div className="relative shrink-0">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                aria-label="สกุลเงิน"
                className="h-9 appearance-none rounded-full bg-fill-3 pl-3.5 pr-8 text-subhead font-semibold text-tint outline-none"
              >
                {["THB", "USD", "EUR", "JPY"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <ChevronsUpDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-tint" strokeWidth={2.5} />
            </div>
          </div>
          <div className={row}>
            <label htmlFor="bill-title" className="sr-only">ชื่อรายการ</label>
            <input
              id="bill-title"
              placeholder="ชื่อรายการ เช่น ค่าที่พัก, ค่าอาหารเย็น"
              value={title}
              aria-invalid={!!errors.title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((er) => ({ ...er, title: undefined }));
              }}
              className={rowInput}
            />
          </div>
        </Section>

        {/* Payer */}
        <Section
          header={<span id="payer-label">ใครจ่าย</span>}
          footer={errors.payer && <p className={fieldError}>{errors.payer}</p>}
        >
          <div
            role="radiogroup"
            aria-labelledby="payer-label"
            className="flex flex-wrap gap-2 p-3"
          >
            {payerOptions.map((option) => {
              const selected = option.memberIds.includes(payerId);
              return (
                <button
                  key={option.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    // a family pays through its first member; keep the stored payer if already in it
                    if (!selected) setPayerChoice(option.memberIds[0]);
                    setErrors((er) => ({ ...er, payer: undefined }));
                  }}
                  className={[
                    "flex min-h-10 shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-subhead transition-[background-color,color] duration-150 active:scale-[0.97]",
                    selected ? "bg-tint font-semibold text-white" : "bg-fill-3 text-label",
                  ].join(" ")}
                >
                  {option.family ? (
                    <GroupAvatar group={option.family} />
                  ) : (
                    <MemberAvatar name={option.label} size="sm" />
                  )}
                  {option.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Participants */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-x-3 px-4">
            <h2 className="text-footnote text-label-2">ผู้ร่วมหาร · เลือก {selectedCount} จาก {members.length} คน</h2>
            <div className="-mb-1 -mr-2 ml-auto flex shrink-0 items-center whitespace-nowrap">
              <button
                type="button"
                onClick={() => setParticipants(members.map((m) => m.id))}
                className="h-8 rounded-full px-2 text-subhead text-tint active:opacity-60"
              >
                เลือกทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setParticipants([])}
                className="h-8 rounded-full px-2 text-subhead text-tint active:opacity-60"
              >
                ล้าง
              </button>
            </div>
          </div>

          <Section
            footer="ใส่ยอดที่บางคนจ่ายเองตามจริง คนที่เหลือหารยอดที่เหลือเท่ากัน"
          >
            <label className={`${row} cursor-pointer`}>
              <span className="flex-1">ระบุราคาเฉพาะคน</span>
              <input
                type="checkbox"
                role="switch"
                checked={usePersonal}
                onChange={() => {
                  setUsePersonal((prev) => !prev);
                  setErrors((er) => ({ ...er, personal: undefined }));
                }}
                className="peer sr-only"
              />
              {/* iOS switch: 51×31, green when on */}
              <span
                aria-hidden
                className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-tint ${usePersonal ? "bg-green" : "bg-fill"}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 size-[27px] rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.15),0_1px_1px_rgb(0_0_0/0.16)] transition-transform duration-200 ease-out ${usePersonal ? "translate-x-5" : ""}`}
                />
              </span>
            </label>
          </Section>

          {/* Families as their own sections, members without a family last */}
          {(() => {
            const families = new Map<string, Member[]>();
            const solo: Member[] = [];
            for (const m of members) {
              const family = m.group_name?.trim();
              if (family) families.set(family, [...(families.get(family) ?? []), m]);
              else solo.push(m);
            }

            const renderRow = (m: Member) => {
              const checked = participants.includes(m.id);
              return (
                <div key={m.id}>
                  <label className={`${row} cursor-pointer transition-colors duration-100 active:bg-pressed`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleParticipant(m.id)}
                      className="ios-check"
                    />
                    <MemberAvatar name={m.name} group={m.group_name} />
                    <span className={`min-w-0 flex-1 break-words ${checked ? "text-label" : "text-label-2"}`}>{m.name}</span>
                    {amountNum > 0 && checked && (
                      <span
                        className={`shrink-0 text-subhead tabular-nums ${personalAmounts[m.id] ? "font-semibold text-label" : "text-label-2"}`}
                      >
                        {formatMoney(shares[m.id] ?? 0)}
                      </span>
                    )}
                  </label>
                  {usePersonal && checked && (
                    <div className="-mt-1 flex items-center gap-3 pb-2.5 pl-[5.875rem] pr-4">
                      <span className="shrink-0 whitespace-nowrap text-footnote text-label-2">ราคาเฉพาะ</span>
                      <div className="flex h-9 min-w-0 flex-1 items-center rounded-lg bg-fill-3 focus-within:ring-2 focus-within:ring-tint/40">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          aria-label={`ราคาเฉพาะของ ${m.name}`}
                          value={personalInputs[m.id] ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setPersonalInputs((prev) => ({ ...prev, [m.id]: value }));
                            setErrors((er) => ({ ...er, personal: undefined }));
                          }}
                          className="h-full min-w-0 flex-1 bg-transparent px-3 text-subhead tabular-nums outline-none placeholder:text-label-2"
                        />
                        <span className="pr-3 text-footnote text-label-2">{currency}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            };

            return (
              <>
                {[...families.entries()].map(([family, familyMembers]) => {
                  const ids = familyMembers.map((m) => m.id);
                  const allSelected = ids.every((id) => participants.includes(id));
                  return (
                    <FamilySection
                      key={family}
                      family={family}
                      count={familyMembers.length}
                      allSelected={allSelected}
                      onToggle={() => {
                        setParticipants((prev) =>
                          allSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]
                        );
                        setErrors((er) => ({ ...er, participants: undefined }));
                      }}
                    >
                      {familyMembers.map(renderRow)}
                    </FamilySection>
                  );
                })}
                {solo.length > 0 && (
                  <Section inset={PARTICIPANT_INSET} header={families.size > 0 ? "ไม่มีกลุ่ม" : undefined}>
                    {solo.map(renderRow)}
                  </Section>
                )}
              </>
            );
          })()}

          {/* the split, or why it can't be made */}
          {(amountNum > 0 && selectedCount > 0 && !personalMismatch) ||
          personalMismatch ||
          errors.personal ||
          errors.participants ? (
            <Section
              footer={
                <>
                  {(personalMismatch || errors.personal) && (
                    <p role="alert" className={fieldError}>{personalMismatch ? personalMismatchMessage : errors.personal}</p>
                  )}
                  {errors.participants && <p className={fieldError}>{errors.participants}</p>}
                  {!personalMismatch && personalTotal > 0 && (
                    <p>
                      ราคาเฉพาะคน {formatMoney(personalTotal)}
                      {evenCount > 0 && ` · ที่เหลือ ${formatMoney(remainder)} หาร ${evenCount} คน`}
                    </p>
                  )}
                </>
              }
            >
              {amountNum > 0 && selectedCount > 0 && !personalMismatch && (
                <div className={`${row} justify-between`}>
                  <span>{evenCount > 0 ? `หาร ${evenCount} คน` : "ทุกคนจ่ายตามราคาเฉพาะ"}</span>
                  {evenCount > 0 && (
                    <span className="font-semibold tabular-nums">
                      {formatMoney(perPerson)} {currency} / คน
                    </span>
                  )}
                </div>
              )}
            </Section>
          ) : null}
        </div>

        {/* Rarely changed details stay folded so the common path is short */}
        <details
          open={showMore}
          onToggle={(e) => setShowMore(e.currentTarget.open)}
          className="group overflow-hidden rounded-group bg-cell"
        >
          <summary className={`${row} cursor-pointer list-none transition-colors duration-100 active:bg-pressed [&::-webkit-details-marker]:hidden`}>
            <span className="min-w-0 flex-1">
              <span className="block">เพิ่มเติม</span>
              <span className="block truncate text-footnote text-label-2">
                {[getBillEntryLabel(entryType), date, note.trim() ? "มีหมายเหตุ" : "ไม่มีหมายเหตุ"].join(" · ")}
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-label-3 transition-transform duration-200 group-open:rotate-180" strokeWidth={2.5} />
          </summary>
          <div className="ios-list border-t-[0.5px] border-separator">
            <div className="space-y-2 px-4 py-3">
              <p id="entry-type-label" className="text-footnote text-label-2">ประเภทบิล</p>
              <div role="radiogroup" aria-labelledby="entry-type-label" className="flex rounded-full bg-fill-3 p-0.5">
                {(["expense", "advance"] as const).map((value) => {
                  const active = entryType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setEntryType(value)}
                      className={[
                        "h-8 flex-1 rounded-full text-footnote font-semibold transition-[background-color,box-shadow,color] duration-200",
                        active ? "bg-cell text-label shadow-[0_3px_8px_rgb(0_0_0/0.12),0_3px_1px_rgb(0_0_0/0.04)] dark:bg-[#636366]" : "text-label",
                      ].join(" ")}
                    >
                      {getBillEntryLabel(value)}
                    </button>
                  );
                })}
              </div>
              <p className="text-footnote text-label-2">
                {entryType === "expense"
                  ? "นับรวมยอดค่าใช้จ่ายและยอดหาร"
                  : "โอนคืน/จ่ายให้กัน ไม่นับรวมเป็นค่าใช้จ่าย แต่นำไปหักลบยอดที่ต้องโอน"}
              </p>
            </div>

            <label className={`${row} justify-between`}>
              <span>วันที่</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 rounded-lg bg-fill-3 px-3 text-body text-label outline-none focus-visible:ring-2 focus-visible:ring-tint/40"
              />
            </label>

            <div className="px-4 py-2.5">
              <label htmlFor="bill-note" className="sr-only">หมายเหตุ</label>
              <textarea
                id="bill-note"
                placeholder="หมายเหตุ (ไม่บังคับ)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[5.5rem] w-full resize-none bg-transparent text-body text-label outline-none placeholder:text-label-2"
              />
            </div>
          </div>
        </details>

        {deleteAction && (
          <Section>
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className={`${row} w-full justify-center text-negative transition-colors duration-100 active:bg-pressed disabled:opacity-50`}
            >
              {isDeleting && <LoaderCircle className="size-4 animate-spin" />}
              {isDeleting ? "กำลังลบ..." : "ลบบิล"}
            </button>
          </Section>
        )}
      </div>
      </form>
    </div>
    </AvatarColorProvider>
  );
}
