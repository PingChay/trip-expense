"use client";

import { Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareButton({ tripId }: { tripId: string }) {
  const url = `${window.location.origin}/trips/${tripId}/join`;

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: "เข้าร่วมทริป", url });
    } else {
      await navigator.clipboard.writeText(url);
      alert("คัดลอกลิงก์แล้ว!");
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    alert("คัดลอกลิงก์แล้ว!");
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
        <Copy className="h-3.5 w-3.5" />
        คัดลอกลิงก์
      </Button>
      {typeof navigator !== "undefined" && "share" in navigator && (
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
          <Share2 className="h-3.5 w-3.5" />
          แชร์
        </Button>
      )}
    </div>
  );
}
