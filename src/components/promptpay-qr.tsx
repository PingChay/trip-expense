"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Check, CircleCheck, Copy, LoaderCircle, QrCode, Settings, X } from "lucide-react";
import { formatPromptPay, isValidPromptPay, promptPayPayload } from "@/lib/promptpay";
import type { PromptPayTarget } from "@/lib/members";
import { recordPayment } from "@/app/trips/[id]/payment-actions";
import { setMemberPromptPay } from "@/app/trips/[id]/members/actions";

function QrSvg({ value }: { value: string }) {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
  const size = modules.size;
  const quiet = 2;
  let path = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (modules.get(x, y)) path += `M${x + quiet} ${y + quiet}h1v1h-1z`;
    }
  }
  return (
    <svg
      viewBox={`0 0 ${size + quiet * 2} ${size + quiet * 2}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR พร้อมเพย์"
      className="size-full"
    >
      <rect width="100%" height="100%" fill="#fff" />
      <path d={path} fill="#0f172a" />
    </svg>
  );
}

type PaymentRecord = { tripId: string; from: string; fromMemberId: string; toMemberId: string };

/**
 * QR button for one settlement row; opens a sheet with a PromptPay QR for the exact amount.
 * Confirming records the transfer as a payment bill so the debt disappears from the summary.
 */
export function PromptPayQrButton({
  to,
  owner,
  promptpay,
  amount,
  payment,
}: {
  to: string;
  owner: string;
  promptpay: string;
  amount: number;
  payment: PaymentRecord;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const [isRecording, startRecording] = useTransition();
  const [recorded, setRecorded] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  function confirmPayment() {
    setRecordError(null);
    startRecording(async () => {
      try {
        await recordPayment(payment.tripId, {
          fromMemberId: payment.fromMemberId,
          toMemberId: payment.toMemberId,
          amount,
          currency: "THB",
          title: `${payment.from} โอนให้ ${to}`,
        });
        setRecorded(true);
        // let the confirmation register before the row (and this dialog) leaves the page
        setTimeout(() => {
          dialogRef.current?.close();
          router.refresh();
        }, 900);
      } catch {
        setRecordError("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    });
  }

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const amountText = amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`QR พร้อมเพย์ โอนให้ ${to} ${amountText} บาท`}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-slate-800"
      >
        <QrCode className="h-4 w-4" />
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[min(22rem,calc(100vw-2rem))] rounded-3xl bg-white p-0 text-slate-900 shadow-[0_24px_48px_-16px_rgb(15_23_42/0.45)] backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-slate-500">โอนให้ {to}</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums">{amountText} ฿</p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="ปิด"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mx-auto mt-4 aspect-square w-full max-w-64 overflow-hidden rounded-2xl border border-slate-200 p-2">
            <QrSvg value={promptPayPayload(promptpay, amount)} />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5">
            <div className="min-w-0 text-sm">
              <p className="text-xs text-slate-500">พร้อมเพย์{owner !== to ? ` ของ ${owner}` : ""}</p>
              <p className="font-medium tabular-nums">{formatPromptPay(promptpay)}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(promptpay);
                setCopied(true);
              }}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-positive" /> : <Copy className="h-3.5 w-3.5" />}
              <span aria-live="polite">{copied ? "คัดลอกแล้ว" : "คัดลอก"}</span>
            </button>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            {recorded ? (
              <p role="status" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-50 text-sm font-medium text-positive">
                <CircleCheck className="h-5 w-5" />
                บันทึกการจ่ายเงินแล้ว
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={confirmPayment}
                  disabled={isRecording}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-[15px] font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-70"
                >
                  {isRecording && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  {isRecording ? "กำลังบันทึก..." : "จ่ายเงินเรียบร้อยแล้ว"}
                </button>
                <p className="mt-2 text-center text-xs text-slate-500">
                  {recordError ?? `กดหลังโอนแล้ว ระบบจะบันทึกบิลการจ่ายเงิน ${payment.from} → ${to}`}
                </p>
              </>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}

type SetupCandidate = { id: string; name: string };

/**
 * Shown where a QR would be when the receiver has no PromptPay yet: opens a small form to
 * save one. For a family it asks whose PromptPay to use.
 */
export function PromptPaySetupButton({
  tripId,
  to,
  candidates,
}: {
  tripId: string;
  to: string;
  candidates: SetupCandidate[];
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [ownerId, setOwnerId] = useState(candidates[0]?.id ?? "");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  // several rows can owe the same receiver, so ids come from React, not the name
  const fieldId = useId();

  function save() {
    if (!isValidPromptPay(value)) {
      setError("ใส่เบอร์มือถือ 10 หลัก หรือเลขบัตรประชาชน 13 หลัก");
      return;
    }
    setError(null);
    startSaving(async () => {
      try {
        await setMemberPromptPay(tripId, ownerId, value);
        dialogRef.current?.close();
        router.refresh();
      } catch {
        setError("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`ตั้งค่าพร้อมเพย์ของ ${to}`}
        title="ตั้งค่าพร้อมเพย์เพื่อสร้าง QR"
        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-800"
      >
        <Settings className="h-4 w-4" />
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[min(22rem,calc(100vw-2rem))] rounded-3xl bg-white p-0 text-slate-900 shadow-[0_24px_48px_-16px_rgb(15_23_42/0.45)] backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm"
      >
        <form
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-semibold">ตั้งค่าพร้อมเพย์</p>
              <p className="mt-0.5 text-sm text-slate-500">ใช้สร้าง QR รับเงินของ {to}</p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="ปิด"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {candidates.length > 1 && (
            <div className="space-y-2">
              <p id={`${fieldId}-owner`} className="text-sm font-medium text-slate-700">ใช้พร้อมเพย์ของ</p>
              <div role="radiogroup" aria-labelledby={`${fieldId}-owner`} className="flex flex-wrap gap-2">
                {candidates.map((candidate) => {
                  const selected = candidate.id === ownerId;
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setOwnerId(candidate.id)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                        selected
                          ? "border-slate-900 bg-slate-900 font-medium text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {candidate.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor={`${fieldId}-promptpay`} className="text-sm font-medium text-slate-700">
              เบอร์พร้อมเพย์
            </label>
            <div className="relative">
              <QrCode className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id={`${fieldId}-promptpay`}
                inputMode="numeric"
                autoComplete="off"
                placeholder="เบอร์มือถือ หรือ เลขบัตรประชาชน"
                value={value}
                aria-invalid={!!error}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                className="h-12 w-full rounded-xl border border-input bg-white pl-10 pr-3.5 text-[15px] tabular-nums outline-none placeholder:text-slate-400 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive"
              />
            </div>
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-[15px] font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-70"
          >
            {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {isSaving ? "กำลังบันทึก..." : "บันทึกและสร้าง QR"}
          </button>
        </form>
      </dialog>
    </>
  );
}

/**
 * For a baht transfer: the QR button when the receiver has PromptPay, otherwise (when
 * PromptPay can be stored) a button to set it up. Nothing for other currencies.
 */
export function SettlementQr({
  target,
  tripId,
  from,
  fromMemberId,
  to,
  amount,
  currency,
  setupCandidates,
}: {
  target: PromptPayTarget | undefined;
  tripId: string;
  from: string;
  fromMemberId: string | undefined;
  to: string;
  amount: number;
  currency: string;
  /** who could own the receiver's PromptPay; undefined until the promptpay column exists */
  setupCandidates?: SetupCandidate[];
}) {
  if (currency !== "THB") return null;
  if (!target) {
    return setupCandidates?.length ? (
      <PromptPaySetupButton tripId={tripId} to={to} candidates={setupCandidates} />
    ) : null;
  }
  if (!fromMemberId) return null;
  return (
    <PromptPayQrButton
      to={to}
      owner={target.owner}
      promptpay={target.promptpay}
      amount={amount}
      payment={{ tripId, from, fromMemberId, toMemberId: target.ownerId }}
    />
  );
}
