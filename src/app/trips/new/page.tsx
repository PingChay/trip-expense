"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, X, Pencil, Check } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-semibold text-slate-900">สร้างทริปใหม่</h1>
      </header>

      <form onSubmit={handleSubmit} className="max-w-sm mx-auto px-4 py-6 space-y-6">
        {/* Trip name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">ชื่อทริป *</label>
          <Input
            placeholder="เช่น เชียงใหม่ มี.ค. 68"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value.trim()) setErrors((er) => ({ ...er, name: undefined }));
            }}
            className="h-12"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        {/* Date range */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">วันที่เดินทาง (ไม่บังคับ)</label>
          <div className="flex gap-2 items-center">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-12 flex-1"
            />
            <span className="text-slate-400 text-sm shrink-0">ถึง</span>
            <Input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-12 flex-1"
            />
          </div>
        </div>

        {/* Members */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            ผู้เข้าร่วม *
            {members.length > 0 && (
              <span className="ml-2 text-xs text-slate-400 font-normal">{members.length} คน</span>
            )}
          </label>

          {/* Member list */}
          {members.length > 0 && (
            <ul className="rounded-xl border bg-white divide-y">
              {members.map((m, idx) => (
                <li key={idx} className="flex items-center gap-2 px-3 py-2.5">
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
                        className="h-8 flex-1"
                      />
                      <button type="button" onClick={() => saveEdit(idx)} className="text-green-600 p-1">
                        <Check className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-slate-800">{m}</span>
                      <button
                        type="button"
                        onClick={() => startEdit(idx)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMember(idx)}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
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
              className="h-12 flex-1"
            />
            <Button type="button" variant="outline" onClick={addMember} className="h-12 w-12 shrink-0 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {errors.duplicate && <p className="text-xs text-red-500">{errors.duplicate}</p>}
          {errors.members && <p className="text-xs text-red-500">{errors.members}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12"
            onClick={() => router.push("/")}
          >
            ยกเลิก
          </Button>
          <Button type="submit" className="flex-1 h-12" disabled={isPending}>
            {isPending ? "กำลังสร้าง..." : "สร้างทริป"}
          </Button>
        </div>
      </form>
    </div>
  );
}

