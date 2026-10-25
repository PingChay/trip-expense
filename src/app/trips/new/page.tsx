"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, X, Pencil, Check, LoaderCircle } from "lucide-react";
import { PageHeader, headerIconButton } from "@/components/page-header";
import { AvatarColorProvider, MemberAvatar } from "@/components/member-avatar";
import { createTrip } from "./actions";

export default function NewTripPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [newMember, setNewMember] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [errors, setErrors] = useState<{ name?: string; members?: string; duplicate?: string }>({});

  const newMemberRef = useRef<HTMLInputElement>(null);

  function addMember() {
    const trimmed = newMember.trim();
    if (!trimmed) return;
    if (members.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      setErrors((e) => ({ ...e, duplicate: `"${trimmed}" มีแล้วในทริปนี้` }));
      return;
    }
    setMembers((prev) => [...prev, trimmed]);
    setNewMember("");
    setErrors((e) => ({ ...e, duplicate: undefined, members: undefined }));
    newMemberRef.current?.focus();
  }

  function deleteMember(idx: number) {
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  }

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setEditValue(members[idx]);
  }

  function saveEdit(idx: number) {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    if (members.some((m, i) => i !== idx && m.toLowerCase() === trimmed.toLowerCase())) {
      return; // skip duplicate silently while editing
    }
    setMembers((prev) => prev.map((m, i) => (i === idx ? trimmed : m)));
    setEditingIdx(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "กรุณากรอกชื่อทริป";
    if (members.length === 0) newErrors.members = "ต้องมีผู้เข้าร่วมอย่างน้อย 1 คน";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    startTransition(async () => {
      await createTrip({ name, startDate, endDate, members });
    });
  }

  return (
    <AvatarColorProvider keys={members}>
    <div className="min-h-screen">
      <PageHeader
        title="สร้างทริปใหม่"
        left={
          <button type="button" onClick={() => router.push("/")} aria-label="ย้อนกลับ" className={headerIconButton}>
            <ArrowLeft className="h-5 w-5" />
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-6 px-4 pb-10 pt-5">
        {/* Trip name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">ชื่อทริป *</label>
          <Input
            placeholder="เช่น เชียงใหม่ มี.ค. 68"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value.trim()) setErrors((er) => ({ ...er, name: undefined }));
            }}
            className="h-12 rounded-xl bg-white px-3.5 text-[15px]"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        {/* Date range */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">วันที่เดินทาง (ไม่บังคับ)</label>
          <div className="flex gap-2 items-center">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-12 flex-1 rounded-xl bg-white px-3 text-[15px]"
            />
            <span className="text-slate-400 text-sm shrink-0">ถึง</span>
            <Input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-12 flex-1 rounded-xl bg-white px-3 text-[15px]"
            />
          </div>
        </div>

        {/* Members */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            ผู้เข้าร่วม *
            {members.length > 0 && (
              <span className="ml-2 text-xs font-normal text-slate-500">{members.length} คน</span>
            )}
          </label>

          {/* Member list */}
          {members.length > 0 && (
            <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
              {members.map((m, idx) => (
                <li key={idx} className="flex items-center gap-2 px-3 py-2">
                  {editingIdx === idx ? (
                    <>
                      <Input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); saveEdit(idx); }
                          if (e.key === "Escape") setEditingIdx(null);
                        }}
                        className="h-9 flex-1 rounded-lg bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit(idx)}
                        aria-label="บันทึก"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <MemberAvatar name={m} />
                      <span className="ml-1 min-w-0 flex-1 truncate text-sm text-slate-900">{m}</span>
                      <button
                        type="button"
                        onClick={() => startEdit(idx)}
                        aria-label={`แก้ไข ${m}`}
                        className="flex size-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMember(idx)}
                        aria-label={`ลบ ${m}`}
                        className="flex size-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Add member input */}
          <div className="flex gap-2">
            <Input
              ref={newMemberRef}
              placeholder="ชื่อผู้เข้าร่วม"
              value={newMember}
              onChange={(e) => {
                setNewMember(e.target.value);
                setErrors((er) => ({ ...er, duplicate: undefined }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addMember(); }
              }}
              className="h-12 flex-1 rounded-xl bg-white px-3 text-[15px]"
            />
            <Button type="button" variant="outline" onClick={addMember} aria-label="เพิ่มผู้เข้าร่วม" className="h-12 w-12 shrink-0 rounded-xl bg-white p-0">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          {errors.duplicate && <p className="text-xs text-destructive">{errors.duplicate}</p>}
          {errors.members && <p className="text-xs text-destructive">{errors.members}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1 rounded-xl bg-white text-[15px]"
            onClick={() => router.push("/")}
          >
            ยกเลิก
          </Button>
          <Button type="submit" className="h-12 flex-1 rounded-xl text-[15px]" disabled={isPending}>
            {isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {isPending ? "กำลังสร้าง..." : "สร้างทริป"}
          </Button>
        </div>
      </form>
    </div>
    </AvatarColorProvider>
  );
}

