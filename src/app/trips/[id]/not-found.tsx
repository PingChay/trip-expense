import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function TripNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-xs">
        <div className="flex justify-center">
          <div className="rounded-2xl bg-slate-200 p-4">
            <MapPin className="h-8 w-8 text-slate-500" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-slate-900">ไม่พบทริปนี้</h1>
        <p className="text-sm text-slate-500">
          Trip ID อาจไม่ถูกต้อง หรือทริปนี้ยังไม่ได้สร้าง
        </p>
        <Link href="/">
          <Button className="w-full">กลับหน้าแรก</Button>
        </Link>
      </div>
    </div>
  );
}
