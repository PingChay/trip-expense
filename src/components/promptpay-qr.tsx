"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Check, CircleCheck, Copy, Download, LoaderCircle, QrCode } from "lucide-react";
import { formatPromptPay, isValidPromptPay, promptPayPayload } from "@/lib/promptpay";
import type { PromptPayTarget } from "@/lib/members";
import { recordPayment } from "@/app/trips/[id]/payment-actions";
import { setMemberPromptPay } from "@/app/trips/[id]/members/actions";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

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
      <path d={path} fill="#000" />
    </svg>
  );
}

const IMAGE_FONT = '-apple-system, BlinkMacSystemFont, "Sukhumvit Set", "Noto Sans Thai", sans-serif';

/**
 * The QR as a PNG to keep in Photos: who to pay and how much above it, the PromptPay number below,
 * so a banking app's "scan from image" reads it and the picture still makes sense later.
 */
async function qrImageFile({
  payload,
  to,
  owner,
  amountText,
  promptpayText,
}: {
  payload: string;
  to: string;
  owner: string;
  amountText: string;
  promptpayText: string;
}): Promise<File> {
  const width = 900;
  const height = 1120;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const maxText = width - 120;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "center";

  ctx.fillStyle = "#6e6e73";
  ctx.font = `500 40px ${IMAGE_FONT}`;
  ctx.fillText(`โอนให้ ${to}`, width / 2, 100, maxText);
  ctx.fillStyle = "#000";
  ctx.font = `700 76px ${IMAGE_FONT}`;
  ctx.fillText(`${amountText} ฿`, width / 2, 190, maxText);

  // a 4-module quiet zone, the size scanners expect from a photo
  const { modules } = QRCode.create(payload, { errorCorrectionLevel: "M" });
  const quiet = 4;
  const qrSize = 680;
  const cell = qrSize / (modules.size + quiet * 2);
  const left = (width - qrSize) / 2;
  const top = 230;
  for (let y = 0; y < modules.size; y++) {
    for (let x = 0; x < modules.size; x++) {
      if (modules.get(x, y)) {
        ctx.fillRect(
          Math.floor(left + (x + quiet) * cell),
          Math.floor(top + (y + quiet) * cell),
          Math.ceil(cell),
          Math.ceil(cell)
        );
      }
    }
  }

  ctx.font = `600 44px ${IMAGE_FONT}`;
  ctx.fillText(promptpayText, width / 2, top + qrSize + 80, maxText);
  ctx.fillStyle = "#6e6e73";
  ctx.font = `400 34px ${IMAGE_FONT}`;
  ctx.fillText(`พร้อมเพย์${owner !== to ? ` ของ ${owner}` : ""} · TripSplit`, width / 2, top + qrSize + 140, maxText);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png")
  );
  return new File([blob], `PromptPay-${to}-${amountText.replace(/,/g, "")}.png`, { type: "image/png" });
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
  // made when the sheet opens, so tapping save can hand it to the share sheet while the tap still counts
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);
  const [isRecording, startRecording] = useTransition();
  const [recorded, setRecorded] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const titleId = useId();

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

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [saved]);

  const amountText = amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const payload = promptPayPayload(promptpay, amount);

  function openSheet() {
    dialogRef.current?.showModal();
    if (!qrFile) {
      qrImageFile({ payload, to, owner, amountText, promptpayText: formatPromptPay(promptpay) })
        .then(setQrFile)
        .catch(() => setQrFile(null));
    }
  }

  async function saveQr() {
    if (!qrFile) return;
    // on phones the share sheet has "Save Image", which puts it in Photos for the banking app
    if (navigator.canShare?.({ files: [qrFile] })) {
      try {
        await navigator.share({ files: [qrFile] });
        setSaved(true);
      } catch {
        // dismissed the share sheet
      }
      return;
    }
    const url = URL.createObjectURL(qrFile);
    const link = document.createElement("a");
    link.href = url;
    link.download = qrFile.name;
    link.click();
    URL.revokeObjectURL(url);
    setSaved(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-label={`QR พร้อมเพย์ โอนให้ ${to} ${amountText} บาท`}
        className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-tint text-white transition-transform duration-150 after:absolute after:-inset-1 after:content-[''] active:scale-90"
      >
        <QrCode className="size-[18px]" strokeWidth={2.25} />
      </button>

      <Sheet
        ref={dialogRef}
        labelledBy={titleId}
        header={
          <>
            <p id={titleId} className="text-subhead text-label-2">โอนให้ {to}</p>
            <p className="mt-0.5 text-title1 font-bold tabular-nums">{amountText} ฿</p>
          </>
        }
      >
        <div className="mx-auto aspect-square w-full max-w-64 overflow-hidden rounded-3xl bg-white p-3 shadow-[0_2px_12px_-4px_rgb(0_0_0/0.18)]">
          <QrSvg value={payload} />
        </div>

        <div className="mt-3 flex justify-center">
          <Button variant="secondary" size="sm" onClick={saveQr} disabled={!qrFile}>
            {saved ? <Check className="size-4" strokeWidth={2.75} /> : <Download className="size-4" />}
            <span aria-live="polite">{saved ? "บันทึกแล้ว" : "บันทึกรูป QR"}</span>
          </Button>
        </div>

        <div className="mt-5 flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-fill-3 py-2 pl-4 pr-2">
          <div className="min-w-0">
            <p className="text-footnote text-label-2">พร้อมเพย์{owner !== to ? ` ของ ${owner}` : ""}</p>
            <p className="font-medium tabular-nums">{formatPromptPay(promptpay)}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(promptpay);
              setCopied(true);
            }}
          >
            {copied ? <Check className="size-4" strokeWidth={2.75} /> : <Copy className="size-4" />}
            <span aria-live="polite">{copied ? "คัดลอกแล้ว" : "คัดลอก"}</span>
          </Button>
        </div>

        <div className="mt-5">
          {recorded ? (
            <p
              role="status"
              className="flex h-[3.25rem] items-center justify-center gap-2 rounded-full bg-green/15 font-semibold text-positive"
            >
              <CircleCheck className="size-5" />
              บันทึกการจ่ายเงินแล้ว
            </p>
          ) : (
            <>
              <Button size="lg" className="w-full" onClick={confirmPayment} disabled={isRecording}>
                {isRecording && <LoaderCircle className="animate-spin" />}
                {isRecording ? "กำลังบันทึก..." : "จ่ายเงินเรียบร้อยแล้ว"}
              </Button>
              <p className={`mt-2.5 text-center text-footnote ${recordError ? "text-negative" : "text-label-2"}`}>
                {recordError ?? `กดหลังโอนแล้ว ระบบจะบันทึกบิลการจ่ายเงิน ${payment.from} → ${to}`}
              </p>
            </>
          )}
        </div>
      </Sheet>
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
        className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-fill-3 text-tint transition-transform duration-150 after:absolute after:-inset-1 after:content-[''] active:scale-90"
      >
        <QrCode className="size-[18px]" strokeWidth={2.25} />
      </button>

      <Sheet
        ref={dialogRef}
        labelledBy={`${fieldId}-title`}
        header={
          <>
            <p id={`${fieldId}-title`} className="text-title3 font-bold">ตั้งค่าพร้อมเพย์</p>
            <p className="mt-0.5 text-subhead text-label-2">ใช้สร้าง QR รับเงินของ {to}</p>
          </>
        }
      >
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          {candidates.length > 1 && (
            <div className="space-y-2">
              <p id={`${fieldId}-owner`} className="px-1 text-footnote text-label-2">ใช้พร้อมเพย์ของ</p>
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
                      className={`h-9 rounded-full px-4 text-subhead transition-colors duration-150 ${
                        selected ? "bg-tint font-semibold text-white" : "bg-fill-3 text-label"
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
            <label htmlFor={`${fieldId}-promptpay`} className="block px-1 text-footnote text-label-2">
              เบอร์พร้อมเพย์
            </label>
            <div className="relative">
              <QrCode className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-label-2" />
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
                className="h-12 w-full rounded-xl bg-fill-3 pl-11 pr-3.5 text-body tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-tint/40 aria-invalid:ring-2 aria-invalid:ring-red/50"
              />
            </div>
            {error && (
              <p role="alert" className="px-1 text-footnote text-negative">
                {error}
              </p>
            )}
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isSaving}>
            {isSaving && <LoaderCircle className="animate-spin" />}
            {isSaving ? "กำลังบันทึก..." : "บันทึกและสร้าง QR"}
          </Button>
        </form>
      </Sheet>
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
