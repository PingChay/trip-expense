"use client";

import { Fragment, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBillEntryLabel, type BillEntryType, type PersonalAmounts } from "@/lib/bill-entry";
import { billShares } from "@/lib/balance";
import { PageHeader, headerIconButton } from "@/components/page-header";
import { AvatarColorProvider, GroupAvatar, MemberAvatar, useAvatarTint } from "@/components/member-avatar";
import { avatarColorKey } from "@/lib/avatar";
import { ArrowLeft, ChevronDown, Divide, LoaderCircle, Trash2 } from "lucide-react";
import type { BillInput } from "@/lib/types";

const fieldLabel = "text-sm font-medium text-slate-700";
const fieldInput = "h-12 rounded-xl border-input bg-white px-3.5 text-[15px]";
const fieldError = "text-xs text-destructive";

const lastPayerKey = (tripId: string) => `tripsplit_last_payer_${tripId}`;
const noopSubscribe = () => () => {};

function readLastPayer(tripId: string) {
  try {
    return localStorage.getItem(lastPayerKey(tripId));
  } catch {
    return null;
  }
}

/** One family in the participant picker: a box in the family's colour with a select-all toggle. */
function FamilyBox({
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
  const tint = useAvatarTint(family);
  return (
    <div className="rounded-2xl border p-2" style={{ backgroundColor: tint.surface, borderColor: tint.edge }}>
      <div className="flex items-center gap-2 px-2 pb-2 pt-1">
        <GroupAvatar group={family} />
        <p className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-900">
          {family} <span className="text-xs font-medium" style={{ color: tint.color }}>· {count} คน</span>
        </p>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={allSelected}
          className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-medium shadow-[0_1px_2px_rgb(15_23_42/0.08)] transition-colors hover:bg-slate-50"
          style={{ color: tint.color }}
        >
          {allSelected ? "ยกเลิกครอบครัว" : "เลือกครอบครัว"}
        </button>
      </div>
      {children}
    </div>
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

  return (
    <AvatarColorProvider keys={members.map(avatarColorKey)}>
    <div className="min-h-screen">
      <PageHeader
        title={initialData ? "แก้ไขบิล" : "เพิ่มบิล"}
        left={
          <button type="button" onClick={() => router.back()} aria-label="ย้อนกลับ" className={headerIconButton}>
            <ArrowLeft className="h-5 w-5" />
          </button>
        }
        right={
          deleteAction && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="ลบบิล"
              className={`${headerIconButton} text-red-500 hover:bg-red-50 hover:text-red-600`}
            >
              <Trash2 className="h-[18px] w-[18px]" />
            </button>
          )
        }
      />

      <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-6 px-4 pt-5">
        {/* Amount + Currency */}
        <div className="space-y-2">
          <label className={fieldLabel}>จำนวนเงิน *</label>
          <div
            className={[
              "flex h-14 items-center overflow-hidden rounded-xl border bg-white transition-shadow focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30",
              errors.amount ? "border-destructive" : "border-input",
            ].join(" ")}
          >
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              autoFocus={!initialData}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrors((er) => ({ ...er, amount: undefined }));
              }}
              className="h-full min-w-0 flex-1 bg-transparent px-4 text-xl font-semibold tabular-nums text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-300"
            />
            <div className="relative h-full shrink-0 border-l border-slate-200">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                aria-label="สกุลเงิน"
                className="h-full w-24 appearance-none bg-slate-50 pl-4 pr-8 text-sm font-semibold text-slate-700 outline-none"
              >
                {["THB", "USD", "EUR", "JPY"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          {errors.amount && <p className={fieldError}>{errors.amount}</p>}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label className={fieldLabel}>ชื่อรายการ *</label>
          <Input
            placeholder="เช่น ค่าที่พัก, ค่าอาหารเย็น"
            value={title}
            aria-invalid={!!errors.title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErrors((er) => ({ ...er, title: undefined }));
            }}
            className={fieldInput}
          />
          {errors.title && <p className={fieldError}>{errors.title}</p>}
        </div>

        {/* Payer */}
        <div className="space-y-2">
          <label id="payer-label" className={fieldLabel}>ใครจ่าย *</label>
          <div
            role="radiogroup"
            aria-labelledby="payer-label"
            className="flex flex-wrap gap-2"
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
                    "flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-sm transition-[background-color,border-color,color] duration-150",
                    selected
                      ? "border-slate-900 bg-slate-900 font-medium text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
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
          {errors.payer && <p className={fieldError}>{errors.payer}</p>}
        </div>

        {/* Participants */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={fieldLabel}>ผู้ร่วมหาร *</label>
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setParticipants(members.map((m) => m.id))}
                className="rounded-full px-2 py-1 font-medium text-slate-700 hover:bg-slate-200/60"
              >
                เลือกทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setParticipants([])}
                className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-200/60"
              >
                ล้างทั้งหมด
              </button>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={usePersonal}
            onClick={() => {
              setUsePersonal((prev) => !prev);
              setErrors((er) => ({ ...er, personal: undefined }));
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-left transition-colors hover:border-slate-300"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-slate-900">ระบุราคาเฉพาะคน</span>
              <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                ใส่ยอดที่บางคนจ่ายเองตามจริง คนที่เหลือหารยอดที่เหลือเท่ากัน
              </span>
            </span>
            <span
              aria-hidden
              className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ${usePersonal ? "bg-slate-900" : "bg-slate-300"}`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${usePersonal ? "translate-x-[18px]" : "translate-x-0.5"}`}
              />
            </span>
          </button>

          {/* Families in their own colour boxes, members without a family last */}
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
                <div key={m.id} className="transition-colors hover:bg-slate-50">
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleParticipant(m.id)}
                      className="size-[18px] shrink-0 rounded"
                    />
                    <MemberAvatar name={m.name} group={m.group_name} size="sm" />
                    <span className={`flex-1 text-sm ${checked ? "text-slate-900" : "text-slate-400"}`}>{m.name}</span>
                    {amountNum > 0 && checked && (
                      <span
                        className={`text-xs tabular-nums ${personalAmounts[m.id] ? "font-semibold text-slate-900" : "text-slate-500"}`}
                      >
                        {formatMoney(shares[m.id] ?? 0)} {currency}
                      </span>
                    )}
                  </label>
                  {usePersonal && checked && (
                    <div className="-mt-1 flex items-center gap-2 pb-2.5 pl-[4.25rem] pr-4">
                      <span className="shrink-0 whitespace-nowrap text-xs text-slate-500">ราคาเฉพาะ</span>
                      <div className="flex h-9 min-w-0 flex-1 items-center rounded-lg border border-input bg-white focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
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
                          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm tabular-nums outline-none placeholder:text-slate-300"
                        />
                        <span className="pr-3 text-xs text-slate-400">{currency}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            };

            const rowList = (list: Member[]) => (
              <div className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white">
                {list.map((m) => (
                  <Fragment key={m.id}>{renderRow(m)}</Fragment>
                ))}
              </div>
            );

            return (
              <div className="space-y-2">
                {[...families.entries()].map(([family, familyMembers]) => {
                  const ids = familyMembers.map((m) => m.id);
                  const allSelected = ids.every((id) => participants.includes(id));
                  return (
                    <FamilyBox
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
                      {rowList(familyMembers)}
                    </FamilyBox>
                  );
                })}
                {solo.length > 0 &&
                  (families.size > 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2">
                      <p className="px-2 pb-2 pt-1 text-xs font-medium text-slate-500">ไม่มีกลุ่ม</p>
                      {rowList(solo)}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80">{rowList(solo)}</div>
                  ))}
              </div>
            );
          })()}

          {amountNum > 0 && selectedCount > 0 && !personalMismatch && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-900/[0.05] px-4 py-2.5 text-sm text-slate-700">
              <Divide className="h-4 w-4 shrink-0 text-slate-400" />
              <span>
                {personalTotal > 0 && (
                  <span className="block text-xs text-slate-500">
                    ราคาเฉพาะคน {formatMoney(personalTotal)}
                    {evenCount > 0 && ` · ที่เหลือ ${formatMoney(remainder)} หาร ${evenCount} คน`}
                  </span>
                )}
                {evenCount > 0 ? (
                  <>
                    <span className="font-semibold tabular-nums text-slate-900">
                      {formatMoney(perPerson)} {currency} / คน
                    </span>
                    &nbsp;·&nbsp;{evenCount} คน
                  </>
                ) : (
                  <span className="font-semibold text-slate-900">ทุกคนจ่ายตามราคาเฉพาะ</span>
                )}
              </span>
            </div>
          )}
          {(personalMismatch || errors.personal) && (
            <p role="alert" className={fieldError}>{personalMismatch ? personalMismatchMessage : errors.personal}</p>
          )}
          {errors.participants && (
            <p className={fieldError}>{errors.participants}</p>
          )}
        </div>

        {/* Rarely changed details stay folded so the common path is short */}
        <details
          open={showMore}
          onToggle={(e) => setShowMore(e.currentTarget.open)}
          className="group rounded-2xl border border-slate-200/80 bg-white"
        >
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-slate-900">เพิ่มเติม</span>
              <span className="mt-0.5 block truncate text-xs text-slate-500">
                {[getBillEntryLabel(entryType), date, note.trim() ? "มีหมายเหตุ" : "ไม่มีหมายเหตุ"].join(" · ")}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="space-y-6 border-t border-slate-100 px-4 pb-4 pt-4">
        <div className="space-y-2">
          <label className={fieldLabel}>ประเภทบิล</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: "expense", description: "นับรวมยอดค่าใช้จ่ายและยอดหาร" },
              { value: "advance", description: "โอนคืน/จ่ายให้กัน ไม่นับรวมเป็นค่าใช้จ่าย" },
            ] as const).map((option) => {
              const active = entryType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setEntryType(option.value)}
                  className={[
                    "rounded-xl border px-3.5 py-3 text-left transition-[background-color,border-color,box-shadow] duration-150",
                    active
                      ? "border-slate-900 bg-slate-900 text-white shadow-[0_6px_16px_-8px_rgb(15_23_42/0.6)]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                  ].join(" ")}
                >
                  <p className="text-sm font-semibold">{getBillEntryLabel(option.value)}</p>
                  <p className={`mt-1 text-xs leading-snug ${active ? "text-slate-300" : "text-slate-500"}`}>
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className={fieldLabel}>วันที่</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldInput}
          />
        </div>

        {/* Note */}
        <div className="space-y-2">
          <label className={fieldLabel}>หมายเหตุ</label>
          <textarea
            placeholder="(ไม่บังคับ)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[88px] w-full resize-none rounded-xl border border-input bg-white px-3.5 py-3 text-[15px] outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
          {entryType === "advance" && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
              การจ่ายเงินไม่ถูกรวมในยอดค่าใช้จ่าย แต่นำไปหักลบยอดที่ต้องโอน
            </p>
          )}
        </div>

          </div>
        </details>
        {/* Save stays reachable without scrolling past every field */}
        <div className="sticky bottom-0 -mx-4 border-t border-slate-200/80 bg-background/90 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-md">
          <Button type="submit" className="h-12 w-full rounded-xl text-[15px]" disabled={isPending || isDeleting}>
            {isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {isPending ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </form>
    </div>
    </AvatarColorProvider>
  );
}
