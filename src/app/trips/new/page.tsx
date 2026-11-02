"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Plus, MinusCircle, LoaderCircle } from "lucide-react";
import { PageHeader, headerProminentButton, headerTextButton } from "@/components/page-header";
import { AVATAR_INSET, Section, row } from "@/components/ui/grouped";
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
    <form onSubmit={handleSubmit} className="min-h-screen">
      <PageHeader
        title="ทริปใหม่"
        left={
          <button type="button" onClick={() => router.push("/")} className={headerTextButton}>
            ยกเลิก
          </button>
        }
        right={
          <button type="submit" disabled={isPending || !name.trim()} className={headerProminentButton}>
            {isPending && <LoaderCircle className="size-4 animate-spin" />}
            {isPending ? "กำลังสร้าง" : "สร้าง"}
          </button>
        }
      />

      <div className="mx-auto max-w-md space-y-7 px-4 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] pt-3">
        {/* Trip name */}
        <Section header="ชื่อทริป" footer={errors.name && <p className="text-negative">{errors.name}</p>}>
          <div className={`${row} py-0`}>
            <Input
              placeholder="เช่น เชียงใหม่ มี.ค. 68"
              aria-label="ชื่อทริป"
              aria-invalid={!!errors.name}
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setErrors((er) => ({ ...er, name: undefined }));
              }}
              className="h-12 rounded-none bg-transparent px-0 focus-visible:ring-0 aria-invalid:ring-0"
            />
          </div>
        </Section>

        {/* Date range */}
        <Section header="วันที่เดินทาง (ไม่บังคับ)">
          <label className={`${row} justify-between`}>
            <span>เริ่ม</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 min-w-[9rem] rounded-lg bg-fill-3 px-3 text-body text-label outline-none focus-visible:ring-2 focus-visible:ring-tint/40"
            />
          </label>
          <label className={`${row} justify-between`}>
            <span>ถึง</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 min-w-[9rem] rounded-lg bg-fill-3 px-3 text-body text-label outline-none focus-visible:ring-2 focus-visible:ring-tint/40"
            />
          </label>
        </Section>

        {/* Members */}
        <Section
          as="ul"
          inset={AVATAR_INSET}
          header={`ผู้เข้าร่วม${members.length > 0 ? ` · ${members.length} คน` : ""}`}
          footer={
            errors.duplicate || errors.members ? (
              <p className="text-negative">{errors.duplicate ?? errors.members}</p>
            ) : (
              "แตะชื่อเพื่อแก้ไข จัดกลุ่มครอบครัวได้ในหน้าสมาชิกหลังสร้างทริป"
            )
          }
        >
          {members.map((m, idx) => (
            <li key={idx} className={`${row} py-0`}>
              {editingIdx === idx ? (
                <>
                  <MemberAvatar name={editValue || m} />
                  <Input
                    autoFocus
                    aria-label={`แก้ไขชื่อ ${m}`}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => saveEdit(idx)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); saveEdit(idx); }
                      if (e.key === "Escape") setEditingIdx(null);
                    }}
                    className="h-11 flex-1 rounded-none bg-transparent px-0 focus-visible:ring-0"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => saveEdit(idx)}
                    className="h-9 shrink-0 rounded-full px-2 text-body font-semibold text-tint active:opacity-60"
                  >
                    เสร็จ
                  </button>
                </>
              ) : (
                <>
                  <MemberAvatar name={m} />
                  <button
                    type="button"
                    onClick={() => startEdit(idx)}
                    aria-label={`แก้ไข ${m}`}
                    className="flex min-h-11 min-w-0 flex-1 items-center text-left"
                  >
                    <span className="truncate">{m}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMember(idx)}
                    aria-label={`ลบ ${m}`}
                    className="-mr-2 flex size-11 shrink-0 items-center justify-center text-red active:opacity-60"
                  >
                    <MinusCircle className="size-[22px]" fill="currentColor" stroke="white" strokeWidth={2} />
                  </button>
                </>
              )}
            </li>
          ))}

          {/* Add member */}
          <li className={`${row} py-0 pr-2`}>
            <button
              type="button"
              onClick={addMember}
              aria-label="เพิ่มผู้เข้าร่วม"
              disabled={!newMember.trim()}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green text-white transition-opacity disabled:bg-fill disabled:text-label-3"
            >
              <Plus className="size-5" strokeWidth={3} />
            </button>
            <Input
              ref={newMemberRef}
              placeholder="เพิ่มชื่อผู้เข้าร่วม"
              aria-label="ชื่อผู้เข้าร่วม"
              value={newMember}
              onChange={(e) => {
                setNewMember(e.target.value);
                setErrors((er) => ({ ...er, duplicate: undefined }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addMember(); }
              }}
              className="h-12 flex-1 rounded-none bg-transparent px-0 focus-visible:ring-0"
            />
          </li>
        </Section>
      </div>
    </form>
    </AvatarColorProvider>
  );
}

