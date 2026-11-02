import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MapPinOff } from "lucide-react";

export default function TripNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <MapPinOff className="size-14 text-label-3" strokeWidth={1.5} />
      <h1 className="mt-4 text-title2 font-bold">ไม่พบทริปนี้</h1>
      <p className="mt-1.5 max-w-xs text-subhead text-label-2">
        Trip ID อาจไม่ถูกต้อง หรือทริปนี้ยังไม่ได้สร้าง ลองเช็ก ID อีกครั้ง
      </p>
      <Link href="/" className={`${buttonVariants({ variant: "secondary" })} mt-6`}>
        กลับหน้าแรก
      </Link>
    </div>
  );
}
