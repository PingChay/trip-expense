"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, X, Pencil, Check } from "lucide-react";
import { addMember, updateMember, deleteMember } from "./actions";

type Member = { id: string; name: string; active: boolean };

interface Props {
  tripId: string;
  initialMembers: Member[];
  billCounts: Record<string, number>;
}

export function MembersClient({ tripId, initialMembers, billCounts }: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    if (members.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" มีแล้ว`);
      return;
    }
    const tempId = "temp-" + Date.now();
    setMembers((prev) => [...prev, { id: tempId, name, active: true }]);
    setNewName("");
    setError(null);
    startTransition(async () => {
      await addMember(tripId, name);
    });
  }

  function handleEdit(id: string) {
    setEditingId(id);
    setEditValue(members.find((m) => m.id === id)?.name ?? "");
  }

  function handleSaveEdit(id: string) {
    const name = editValue.trim();
    if (!name) return;
    if (
      members.some((m) => m.id !== id && m.name.toLowerCase() === name.toLowerCase())
    ) {
      setError(`"${name}" มีแล้ว`);
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, name } : m)));
    setEditingId(null);
    setError(null);
    startTransition(async () => {
      await updateMember(id, tripId, name);
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link
          href={`/trips/${tripId}`}
          className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold text-slate-900">
          สมาชิก
          {members.length > 0 && (
            <span className="ml-2 text-sm text-slate-400 font-normal">
              {members.length} คน
            </span>
          )}
        </h1>
      </header>

      <div className="max-w-sm mx-auto px-4 py-6 space-y-4">
        {members.length > 0 && (
          <ul className="bg-white rounded-xl border divide-y">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-2 px-3 py-3">
                {editingId === m.id ? (
                  <>
                    <Input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveEdit(m.id);
                        }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-8 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(m.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-slate-800">{m.name}</span>
                    {(billCounts[m.id] ?? 0) > 0 && (
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {billCounts[m.id]} บิล
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(m.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      disabled={!!(billCounts[m.id])}
                      className="p-1 text-slate-400 hover:text-red-500 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title={billCounts[m.id] ? "ไม่สามารถลบสมาชิกที่มีบิลได้" : "ลบ"}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p className="text-xs text-red-500 px-1">{error}</p>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="ชื่อสมาชิกใหม่"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            className="h-12 flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            className="h-12 w-12 shrink-0 p-0"
            disabled={isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
