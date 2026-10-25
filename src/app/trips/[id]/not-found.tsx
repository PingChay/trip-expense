import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function TripNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5">
      <div className="text-center space-y-4 max-w-xs">
        <div className="flex justify-center">
          <div className="rounded-[1.25rem] bg-slate-200/70 p-4">
            <MapPin className="h-8 w-8 text-slate-500" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-slate-900">ไม่พบทริปนี้</h1>
        <p className="text-sm text-slate-500">
          Trip ID อาจไม่ถูกต้อง หรือทริปนี้ยังไม่ได้สร้าง
        </p>
        <Link href="/">
          <Button className="h-11 w-full rounded-xl">กลับหน้าแรก</Button>
        </Link>
      </div>
    </div>
  );
}
