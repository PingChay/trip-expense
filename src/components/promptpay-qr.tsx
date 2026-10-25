"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, QrCode, X } from "lucide-react";
import { formatPromptPay, promptPayPayload } from "@/lib/promptpay";
import type { PromptPayTarget } from "@/lib/members";

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

/** QR button for one settlement row; opens a sheet with a PromptPay QR for the exact amount. */
export function PromptPayQrButton({
  to,
  owner,
  promptpay,
  amount,
}: {
  to: string;
  owner: string;
  promptpay: string;
  amount: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

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
        </div>
      </dialog>
    </>
  );
}

/** QR button when the receiver has PromptPay and the transfer is in baht; nothing otherwise. */
export function SettlementQr({
  target,
  to,
  amount,
  currency,
}: {
  target: PromptPayTarget | undefined;
  to: string;
  amount: number;
  currency: string;
}) {
  if (!target || currency !== "THB") return null;
  return <PromptPayQrButton to={to} owner={target.owner} promptpay={target.promptpay} amount={amount} />;
}
