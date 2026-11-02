"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Copy, Share } from "lucide-react";

const pill =
  "inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-subhead font-semibold transition-[background-color,color,transform] duration-150 active:scale-95 focus-visible:outline-white";

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
        className={`${pill} ${copied ? "bg-green text-white" : "bg-white text-black"}`}
      >
        {copied ? <Check className="size-4" strokeWidth={2.75} /> : <Copy className="size-4" />}
        <span aria-live="polite">{copied ? "คัดลอกลิงก์แล้ว" : "คัดลอกลิงก์"}</span>
      </button>
      {canShare && (
        <button type="button" onClick={handleShare} className={`${pill} bg-white/15 text-white`}>
          <Share className="size-4" />
          แชร์
        </button>
      )}
    </div>
  );
}
