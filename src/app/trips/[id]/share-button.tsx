"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Copy, Share2 } from "lucide-react";

const pill =
  "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60";

const noopSubscribe = () => () => {};

export function ShareButton({ tripId }: { tripId: string }) {
  const [copied, setCopied] = useState(false);
  // false on the server, real capability after hydration
  const canShare = useSyncExternalStore(
    noopSubscribe,
    () => "share" in navigator,
    () => false
  );

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const joinUrl = () => `${window.location.origin}/trips/${tripId}/join`;

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: "เข้าร่วมทริป", url: joinUrl() });
    } else {
      await handleCopy();
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(joinUrl());
    setCopied(true);
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className={`${pill} ${copied ? "bg-emerald-400/20 text-emerald-200" : "bg-white text-slate-900 hover:bg-slate-100"}`}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        <span aria-live="polite">{copied ? "คัดลอกลิงก์แล้ว" : "คัดลอกลิงก์"}</span>
      </button>
      {canShare && (
        <button type="button" onClick={handleShare} className={`${pill} bg-white/10 text-white hover:bg-white/15`}>
          <Share2 className="h-3.5 w-3.5" />
          แชร์
        </button>
      )}
    </div>
  );
}
