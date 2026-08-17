"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, X, Pencil, Check, Users, ChevronDown } from "lucide-react";
import { addMember, updateMember, deleteMember } from "./actions";

type Member = { id: string; name: string; active: boolean; group_name?: string | null };

interface Props {
  tripId: string;
  initialMembers: Member[];
  billCounts: Record<string, number>;
}

const UNGROUPED = "__ungrouped__";

interface GroupInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange"> {
  open: boolean;
  options: string[];
  onChange: (value: string) => void;
  onToggle: () => void;
  onSelect: (value: string) => void;
}

function GroupInput({
  className,
  open,
  options,
  onChange,
  onToggle,
  onSelect,
  value,
  ...props
}: GroupInputProps) {
  return (
    <div className="relative flex-1">
      <Input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={["pr-10", className].filter(Boolean).join(" ")}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label="เลือกกลุ่ม"
        aria-expanded={open}
        className="absolute inset-y-1 right-1 flex w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border bg-white shadow-lg">
          {options.length > 0 ? (
            <ul className="max-h-44 overflow-y-auto py-1">
              {options.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => onSelect(option)}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
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
    const tempId = "temp-" + Date.now();
    setMembers((prev) => [...prev, { id: tempId, name, active: true, group_name: group }]);
    setNewName("");
    setNewGroup("");
    setIsAddGroupOpen(false);
    setError(null);
    startTransition(async () => {
      await addMember(tripId, name, group ?? undefined);
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
      await updateMember(id, tripId, name, group ?? undefined);
    });
  }

  function handleDelete(id: string) {
    if (billCounts[id]) {
      setError("ไม่สามารถลบสมาชิกที่มีบิลได้");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    startTransition(async () => {
      await deleteMember(id, tripId);
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href={`/trips/${tripId}`} className="p-1 rounded-lg text-slate-500 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold text-slate-900">
          สมาชิก
          {members.length > 0 && (
            <span className="ml-2 text-sm text-slate-400 font-normal">{members.length} คน</span>
          )}
        </h1>
      </header>

      <div className="max-w-sm mx-auto px-4 py-6 space-y-4">
        {/* Grouped member list */}
        {groupKeys.map((groupKey) => (
          <div key={groupKey}>
            {groupKey !== UNGROUPED && (
              <div className="flex items-center gap-2 px-1 mb-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {groupKey}
                </span>
                <span className="text-xs text-slate-400">· {grouped[groupKey].length} คน</span>
              </div>
            )}
            <ul className="bg-white rounded-xl border divide-y">
              {grouped[groupKey].map((m) => (
                <li key={m.id} className="px-3 py-3">
                  {editingId === m.id ? (
                    <div className="space-y-2">
                      <Input
                        autoFocus
                        placeholder="ชื่อ"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="h-8"
                      />
                      <div className="flex gap-2">
                        <GroupInput
                          placeholder="กลุ่ม เช่น ครอบครัวก (ไม่บังคับ)"
                          value={editGroup}
                          onChange={setEditGroup}
                          open={isEditGroupOpen}
                          options={existingGroups.filter((group) => group !== editGroup)}
                          onToggle={() => setIsEditGroupOpen((prev) => !prev)}
                          onSelect={(group) => {
                            setEditGroup(group);
                            setIsEditGroupOpen(false);
                          }}
                          className="h-8 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(m.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded shrink-0"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800">{m.name}</p>
                      </div>
                      {(billCounts[m.id] ?? 0) > 0 && (
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                          {billCounts[m.id]} บิล
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEdit(m)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded shrink-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        disabled={!!(billCounts[m.id])}
                        className="p-1 text-slate-400 hover:text-red-500 rounded disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {error && <p className="text-xs text-red-500 px-1">{error}</p>}

        {/* Add member */}
        <div className="bg-white rounded-xl border p-3 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="ชื่อสมาชิกใหม่ *"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
              className="h-10 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAdd}
              className="h-10 w-10 shrink-0 p-0"
              disabled={isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <GroupInput
            placeholder="กลุ่ม เช่น ครอบครัวก (ไม่บังคับ)"
            value={newGroup}
            onChange={setNewGroup}
            open={isAddGroupOpen}
            options={existingGroups.filter((group) => group !== newGroup)}
            onToggle={() => setIsAddGroupOpen((prev) => !prev)}
            onSelect={(group) => {
              setNewGroup(group);
              setIsAddGroupOpen(false);
            }}
            className="h-9 text-sm text-slate-600"
          />
        </div>
      </div>
    </div>
  );
}
