"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TripTabBar } from "@/components/trip-tab-bar";
import { PageHeader } from "@/components/page-header";
import { MemberAvatar } from "@/components/member-avatar";
import { Plus, X, Pencil, Check, Users, ChevronDown } from "lucide-react";
import { addMember, updateMember, deleteMember } from "./actions";

type Member = { id: string; name: string; active: boolean; group_name?: string | null };

interface Props {
  tripId: string;
  initialMembers: Member[];
  billCounts: Record<string, number>;
}

const UNGROUPED = "__ungrouped__";
// list max-h-44 (176px) + margin and border
const MENU_HEIGHT = 190;

interface GroupInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "onSelect"> {
  open: boolean;
  options: string[];
  onChange: (value: string) => void;
  onToggle: () => void;
  onClose: () => void;
  onOptionSelect: (value: string) => void;
}

function GroupInput({
  className,
  open,
  options,
  onChange,
  onToggle,
  onClose,
  onOptionSelect,
  value,
  ...props
}: GroupInputProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dropUp, setDropUp] = useState(false);

  function handleToggle() {
    if (!open && wrapperRef.current) {
      // the fixed bottom tab bar covers the viewport's lower edge
      const floor = document.querySelector("nav")?.getBoundingClientRect().top ?? window.innerHeight;
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropUp(floor - rect.bottom < MENU_HEIGHT && rect.top > floor - rect.bottom);
    }
    onToggle();
  }

  // Taps outside close the menu too: Safari doesn't focus buttons on click, so blur alone misses them.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) onClose();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, onClose]);

  return (
    <div
      ref={wrapperRef}
      className="relative flex-1"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onClose();
      }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") onClose();
      }}
    >
      <Input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={["pr-10", className].filter(Boolean).join(" ")}
      />
      <button
        type="button"
        onClick={handleToggle}
        aria-label="เลือกกลุ่ม"
        aria-expanded={open}
        className="absolute inset-y-1 right-1 flex w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`absolute left-0 right-0 z-30 overflow-hidden ${dropUp ? "bottom-full mb-1.5" : "top-full mt-1.5"}  rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_-12px_rgb(15_23_42/0.3)]`}>
          {options.length > 0 ? (
            <ul className="max-h-44 overflow-y-auto py-1">
              {options.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => onOptionSelect(option)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-sm text-slate-400">ยังไม่มีกลุ่มให้เลือก</p>
          )}
        </div>
      )}
    </div>
  );
}

export function MembersClient({ tripId, initialMembers, billCounts }: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const closeAddGroup = useCallback(() => setIsAddGroupOpen(false), []);
  const closeEditGroup = useCallback(() => setIsEditGroupOpen(false), []);
  // optimistic temp id → insert that resolves to the real row id
  const pendingIds = useRef(new Map<string, Promise<string>>());
  const tempSeq = useRef(0);

  async function resolveId(id: string) {
    return (await pendingIds.current.get(id)) ?? id;
  }

  // collect existing group names for datalist suggestions
  const existingGroups = [...new Set(members.map((m) => m.group_name).filter(Boolean))] as string[];

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    if (members.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" มีแล้ว`);
      return;
    }
    const group = newGroup.trim() || null;
    const tempId = `temp-${++tempSeq.current}`;
    setMembers((prev) => [...prev, { id: tempId, name, active: true, group_name: group }]);
    setNewName("");
    setNewGroup("");
    setIsAddGroupOpen(false);
    setError(null);
    const insert = addMember(tripId, name, group ?? undefined);
    pendingIds.current.set(tempId, insert);
    startTransition(async () => {
      try {
        const realId = await insert;
        setMembers((prev) => prev.map((m) => (m.id === tempId ? { ...m, id: realId } : m)));
        setEditingId((prev) => (prev === tempId ? realId : prev));
      } catch {
        setMembers((prev) => prev.filter((m) => m.id !== tempId));
        setError(`เพิ่ม "${name}" ไม่สำเร็จ ลองใหม่อีกครั้ง`);
      } finally {
        pendingIds.current.delete(tempId);
      }
    });
  }

  function handleEdit(m: Member) {
    setEditingId(m.id);
    setEditName(m.name);
    setEditGroup(m.group_name ?? "");
    setIsEditGroupOpen(false);
  }

  function handleSaveEdit(id: string) {
    const name = editName.trim();
    if (!name) return;
    if (members.some((m) => m.id !== id && m.name.toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" มีแล้ว`);
      return;
    }
    const group = editGroup.trim() || null;
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, name, group_name: group } : m)));
    setEditingId(null);
    setIsEditGroupOpen(false);
    setError(null);
    startTransition(async () => {
      await updateMember(await resolveId(id), tripId, name, group ?? undefined);
    });
  }

  function handleDelete(id: string) {
    if (billCounts[id]) {
      setError("ไม่สามารถลบสมาชิกที่มีบิลได้");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    startTransition(async () => {
      await deleteMember(await resolveId(id), tripId);
    });
  }

  // group members for display
  const grouped = members.reduce((acc, m) => {
    const key = m.group_name || UNGROUPED;
    (acc[key] = acc[key] || []).push(m);
    return acc;
  }, {} as Record<string, Member[]>);

  // ungrouped first, then alphabetical group names
  const groupKeys = [
    ...(grouped[UNGROUPED] ? [UNGROUPED] : []),
    ...Object.keys(grouped).filter((k) => k !== UNGROUPED).sort(),
  ];

  const rowButton =
    "flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700";

  return (
    <div className="min-h-screen">
      <PageHeader title="สมาชิก" subtitle={members.length > 0 ? `${members.length} คน` : undefined} />

      <div className="mx-auto max-w-sm space-y-5 px-4 pb-32 pt-5">
        {/* Grouped member list */}
        {groupKeys.map((groupKey) => (
          <section key={groupKey} className="space-y-2">
            {groupKey !== UNGROUPED && (
              <h2 className="flex items-center gap-1.5 px-1 text-sm font-semibold text-slate-700">
                <Users className="h-4 w-4 text-slate-400" />
                {groupKey}
                <span className="font-normal text-slate-400">· {grouped[groupKey].length} คน</span>
              </h2>
            )}
            <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
              {grouped[groupKey].map((m) => (
                <li key={m.id} className="px-4 py-2.5">
                  {editingId === m.id ? (
                    <div className="space-y-2 py-1">
                      <Input
                        autoFocus
                        placeholder="ชื่อ"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="h-10 rounded-lg bg-white"
                      />
                      <div className="flex items-center gap-1">
                        <GroupInput
                          placeholder="กลุ่ม เช่น ครอบครัวก (ไม่บังคับ)"
                          value={editGroup}
                          onChange={setEditGroup}
                          open={isEditGroupOpen}
                          options={existingGroups.filter((group) => group !== editGroup)}
                          onToggle={() => setIsEditGroupOpen((prev) => !prev)}
                          onClose={closeEditGroup}
                          onOptionSelect={(group) => {
                            setEditGroup(group);
                            setIsEditGroupOpen(false);
                          }}
                          className="h-10 rounded-lg bg-white text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(m.id)}
                          aria-label="บันทึก"
                          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-slate-800"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          aria-label="ยกเลิก"
                          className="flex size-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MemberAvatar name={m.name} />
                      <div className="ml-1 min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-900">{m.name}</p>
                      </div>
                      {(billCounts[m.id] ?? 0) > 0 && (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          {billCounts[m.id]} บิล
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEdit(m)}
                        aria-label={`แก้ไข ${m.name}`}
                        className={rowButton}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        disabled={!!(billCounts[m.id])}
                        aria-label={`ลบ ${m.name}`}
                        title={billCounts[m.id] ? "ไม่สามารถลบสมาชิกที่มีบิลได้" : undefined}
                        className={`${rowButton} hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}

        {error && <p className="px-1 text-xs text-destructive">{error}</p>}

        {/* Add member */}
        <section className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-slate-700">เพิ่มสมาชิก</h2>
          <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
            <div className="flex gap-2">
              <Input
                placeholder="ชื่อสมาชิกใหม่ *"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
                className="h-11 flex-1 rounded-xl bg-white px-3.5"
              />
              <Button
                type="button"
                onClick={handleAdd}
                aria-label="เพิ่มสมาชิก"
                className="h-11 w-11 shrink-0 rounded-xl p-0"
                disabled={isPending}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <GroupInput
              placeholder="กลุ่ม เช่น ครอบครัวก (ไม่บังคับ)"
              value={newGroup}
              onChange={setNewGroup}
              open={isAddGroupOpen}
              options={existingGroups.filter((group) => group !== newGroup)}
              onToggle={() => setIsAddGroupOpen((prev) => !prev)}
              onClose={closeAddGroup}
              onOptionSelect={(group) => {
                setNewGroup(group);
                setIsAddGroupOpen(false);
              }}
              className="h-10 rounded-xl bg-slate-50 px-3.5 text-sm text-slate-700"
            />
          </div>
        </section>
      </div>
      <TripTabBar tripId={tripId} />
    </div>
  );
}
