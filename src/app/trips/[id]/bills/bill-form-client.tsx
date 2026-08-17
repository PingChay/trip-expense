"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trash2 } from "lucide-react";
import type { BillInput } from "@/lib/types";

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
  const [payerId, setPayerId] = useState(initialData?.payerId ?? members[0]?.id ?? "");
  const [participants, setParticipants] = useState<string[]>(
    initialData?.participants ?? members.map((m) => m.id)
  );
  const [date, setDate] = useState(initialData?.date ?? today);
  const [note, setNote] = useState(initialData?.note ?? "");
  const [errors, setErrors] = useState<{
    title?: string;
    amount?: string;
    participants?: string;
    payer?: string;
  }>({});

  const amountNum = parseFloat(amount) || 0;
  const selectedCount = participants.length;
  const perPerson = selectedCount > 0 ? amountNum / selectedCount : 0;

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
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    startTransition(async () => {
      await saveAction({ title, amount: amountNum, currency, payerId, participants, date, note });
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
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-semibold text-slate-900 flex-1">
          {initialData ? "แก้ไขบิล" : "เพิ่มบิล"}
        </h1>
        {deleteAction && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </header>

      <form onSubmit={handleSubmit} className="max-w-sm mx-auto px-4 py-6 space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">ชื่อรายการ *</label>
          <Input
            placeholder="เช่น ค่าที่พัก, ค่าอาหารเย็น"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErrors((er) => ({ ...er, title: undefined }));
            }}
            className="h-12"
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
        </div>

        {/* Amount + Currency */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">จำนวนเงิน *</label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrors((er) => ({ ...er, amount: undefined }));
              }}
              className="h-12 flex-1"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-12 w-24 rounded-md border border-input bg-background px-3 text-sm"
            >
              {["THB", "USD", "EUR", "JPY"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
        </div>

        {/* Payer */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">ผู้จ่าย *</label>
          <select
            value={payerId}
            onChange={(e) => {
              setPayerId(e.target.value);
              setErrors((er) => ({ ...er, payer: undefined }));
            }}
            className="w-full h-12 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">-- เลือกผู้จ่าย --</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          {errors.payer && <p className="text-xs text-red-500">{errors.payer}</p>}
        </div>

        {/* Participants */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">ผู้ร่วมหาร *</label>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setParticipants(members.map((m) => m.id))}
                className="text-blue-500 hover:underline"
              >
                เลือกทั้งหมด
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setParticipants([])}
                className="text-slate-400 hover:underline"
              >
                ล้างทั้งหมด
              </button>
            </div>
          </div>

          {/* Group members for display */}
          {(() => {
            const UNGROUPED = "__ungrouped__";
            const grouped = members.reduce((acc, m) => {
              const key = m.group_name || UNGROUPED;
              (acc[key] = acc[key] || []).push(m);
              return acc;
            }, {} as Record<string, Member[]>);
            const groupKeys = [
              ...(grouped[UNGROUPED] ? [UNGROUPED] : []),
              ...Object.keys(grouped).filter((k) => k !== UNGROUPED).sort(),
            ];

            return (
              <div className="bg-white rounded-xl border overflow-hidden divide-y">
                {groupKeys.map((groupKey) => (
                  <div key={groupKey}>
                    {groupKey !== UNGROUPED && (
                      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b">
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <span>👨‍👩‍👧</span> {groupKey}
                        </span>
                        <button
                          type="button"
                          className="text-xs text-blue-500 hover:underline"
                          onClick={() => {
                            const groupIds = grouped[groupKey].map((m) => m.id);
                            const allSelected = groupIds.every((id) => participants.includes(id));
                            if (allSelected) {
                              setParticipants((prev) => prev.filter((id) => !groupIds.includes(id)));
                            } else {
                              setParticipants((prev) => [...new Set([...prev, ...groupIds])]);
                            }
                          }}
                        >
                          {grouped[groupKey].every((m) => participants.includes(m.id))
                            ? "ยกเลิกกลุ่ม"
                            : "เลือกกลุ่ม"}
                        </button>
                      </div>
                    )}
                    {grouped[groupKey].map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={participants.includes(m.id)}
                          onChange={() => toggleParticipant(m.id)}
                          className="h-4 w-4 rounded"
                        />
                        <span className="flex-1 text-sm text-slate-800">{m.name}</span>
                        {amountNum > 0 && participants.includes(m.id) && (
                          <span className="text-xs text-slate-400 tabular-nums">
                            {perPerson.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {currency}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}

          {amountNum > 0 && selectedCount > 0 && (
            <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700">
              {perPerson.toLocaleString("th-TH", { minimumFractionDigits: 2 })} {currency} / คน
              &nbsp;·&nbsp;{selectedCount} คน
            </div>
          )}
          {errors.participants && (
            <p className="text-xs text-red-500">{errors.participants}</p>
          )}
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">วันที่</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-12"
          />
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">หมายเหตุ</label>
          <textarea
            placeholder="(ไม่บังคับ)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12"
            onClick={() => router.back()}
          >
            ยกเลิก
          </Button>
          <Button type="submit" className="flex-1 h-12" disabled={isPending || isDeleting}>
            {isPending ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </form>
    </div>
  );
}
