"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { TripTabBar } from "@/components/trip-tab-bar";
import { PageHeader } from "@/components/page-header";
import { AvatarColorProvider, GroupAvatar, MemberAvatar } from "@/components/member-avatar";
import { AVATAR_INSET, Disclosure, Section, pressableRow, row } from "@/components/ui/grouped";
import { avatarColorKey } from "@/lib/avatar";
import { Plus, Users, ChevronsUpDown, QrCode } from "lucide-react";
import { formatPromptPay, isValidPromptPay, normalizePromptPay } from "@/lib/promptpay";
import { addMember, updateMember, deleteMember } from "./actions";

type Member = { id: string; name: string; active: boolean; group_name?: string | null; promptpay?: string | null };

interface Props {
  tripId: string;
  initialMembers: Member[];
  billCounts: Record<string, number>;
  /** false until the members.promptpay column exists */
  promptPayEnabled: boolean;
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
        className={["pr-11", className].filter(Boolean).join(" ")}
      />
      <button
        type="button"
        onClick={handleToggle}
        aria-label="เลือกกลุ่ม"
        aria-expanded={open}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-tint active:opacity-60"
      >
        <ChevronsUpDown className="size-4" strokeWidth={2.5} />
      </button>
      {/* iOS pull-down menu */}
      {open && (
        <div className={`material absolute right-0 z-30 w-60 max-w-full overflow-hidden rounded-[0.875rem] shadow-[0_10px_40px_-8px_rgb(0_0_0/0.3)] ${dropUp ? "bottom-full mb-1.5" : "top-full mt-1.5"}`}>
          {options.length > 0 ? (
            <ul className="ios-list max-h-44 overflow-y-auto">
              {options.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => onOptionSelect(option)}
                    className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-body text-label transition-colors active:bg-fill-2"
                  >
                    {option}
                    <Users className="size-[18px] shrink-0 text-label" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-subhead text-label-2">ยังไม่มีกลุ่มให้เลือก</p>
          )}
        </div>
      )}
    </div>
  );
}

export function MembersClient({ tripId, initialMembers, billCounts, promptPayEnabled }: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [editPromptPay, setEditPromptPay] = useState("");
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
    setEditPromptPay(m.promptpay ?? "");
    setIsEditGroupOpen(false);
  }

  function handleSaveEdit(id: string) {
    const name = editName.trim();
    if (!name) return;
    if (members.some((m) => m.id !== id && m.name.toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" มีแล้ว`);
      return;
    }
    const promptpay = normalizePromptPay(editPromptPay) || null;
    if (promptPayEnabled && promptpay && !isValidPromptPay(promptpay)) {
      setError("พร้อมเพย์ต้องเป็นเบอร์มือถือ 10 หลัก หรือเลขบัตร 13 หลัก");
      return;
    }
    const group = editGroup.trim() || null;
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, name, group_name: group, ...(promptPayEnabled ? { promptpay } : {}) } : m
      )
    );
    setEditingId(null);
    setIsEditGroupOpen(false);
    setError(null);
    startTransition(async () => {
      await updateMember(
        await resolveId(id),
        tripId,
        name,
        group ?? undefined,
        promptPayEnabled ? promptpay : undefined
      );
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

  // a borderless field filling a grouped row
  const rowField = "h-11 rounded-none bg-transparent px-0 text-body focus-visible:ring-0";

  return (
    <AvatarColorProvider keys={members.map(avatarColorKey)}>
    <div className="min-h-screen">
      <PageHeader large title="สมาชิก" subtitle={members.length > 0 ? `${members.length} คน` : undefined} />

      <div className="mx-auto max-w-md space-y-7 px-4 pb-[calc(env(safe-area-inset-bottom)+7.5rem)] pt-3">
        {/* Grouped member list */}
        {groupKeys.map((groupKey) => (
          <Section
            key={groupKey}
            as="ul"
            inset={AVATAR_INSET}
            header={
              groupKey !== UNGROUPED && (
                <span className="flex items-center gap-2">
                  <GroupAvatar group={groupKey} />
                  <span className="font-semibold text-label">{groupKey}</span>
                  <span>· {grouped[groupKey].length} คน</span>
                </span>
              )
            }
          >
            {grouped[groupKey].map((m) =>
              editingId === m.id ? (
                <li key={m.id} className="ios-list bg-cell">
                  <div className={row}>
                    <MemberAvatar name={editName || m.name} group={editGroup || null} />
                    <Input
                      autoFocus
                      placeholder="ชื่อ"
                      aria-label="ชื่อ"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingId(null);
                        if (e.key === "Enter") handleSaveEdit(m.id);
                      }}
                      className={`${rowField} font-medium`}
                    />
                  </div>
                  {promptPayEnabled && (
                    <div className={`${row} py-0 pl-[3.75rem]`}>
                      <QrCode className="size-[18px] shrink-0 text-label-2" />
                      <Input
                        inputMode="numeric"
                        placeholder="เบอร์พร้อมเพย์ (ไม่บังคับ)"
                        aria-label="พร้อมเพย์"
                        value={editPromptPay}
                        onChange={(e) => {
                          setEditPromptPay(e.target.value);
                          setError(null);
                        }}
                        className={`${rowField} tabular-nums`}
                      />
                    </div>
                  )}
                  <div className={`${row} py-0 pl-[3.75rem]`}>
                    <Users className="size-[18px] shrink-0 text-label-2" />
                    <GroupInput
                      placeholder="กลุ่ม เช่น ครอบครัวก (ไม่บังคับ)"
                      aria-label="กลุ่ม"
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
                      className={rowField}
                    />
                  </div>
                  {error && (
                    <p role="alert" className="px-4 py-2 pl-[3.75rem] text-footnote text-negative">
                      {error}
                    </p>
                  )}
                  <div className={`${row} justify-between py-2`}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        handleDelete(m.id);
                      }}
                      disabled={!!billCounts[m.id]}
                      className="-ml-2 h-9 rounded-full px-2 text-body text-negative active:opacity-60 disabled:text-label-3"
                    >
                      {billCounts[m.id] ? "ลบไม่ได้ มีบิลอยู่" : "ลบสมาชิก"}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="h-9 rounded-full bg-fill-3 px-4 text-subhead font-semibold text-label active:opacity-70"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(m.id)}
                        className="h-9 rounded-full bg-tint px-4 text-subhead font-semibold text-white active:opacity-80"
                      >
                        บันทึก
                      </button>
                    </div>
                  </div>
                </li>
              ) : (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => handleEdit(m)}
                    aria-label={`แก้ไข ${m.name}`}
                    className={pressableRow}
                  >
                    <MemberAvatar name={m.name} group={m.group_name} />
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-label">{m.name}</span>
                      {m.promptpay && (
                        <span className="flex items-center gap-1 text-footnote tabular-nums text-label-2">
                          <QrCode className="size-3" />
                          {formatPromptPay(m.promptpay)}
                        </span>
                      )}
                    </span>
                    {(billCounts[m.id] ?? 0) > 0 && (
                      <span className="shrink-0 text-subhead tabular-nums text-label-2">{billCounts[m.id]} บิล</span>
                    )}
                    <Disclosure />
                  </button>
                </li>
              )
            )}
          </Section>
        ))}

        {/* Add member */}
        <Section
          header="เพิ่มสมาชิก"
          footer={error && !editingId ? <p role="alert" className="text-negative">{error}</p> : "ใส่กลุ่มเดียวกันให้คนในครอบครัว เพื่อหารและสรุปยอดเป็นครอบครัว"}
        >
          <div className={`${row} py-0 pr-2`}>
            <Input
              placeholder="ชื่อสมาชิกใหม่"
              aria-label="ชื่อสมาชิกใหม่"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
              className={rowField}
            />
            <button
              type="button"
              onClick={handleAdd}
              aria-label="เพิ่มสมาชิก"
              disabled={isPending || !newName.trim()}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tint text-white transition-[opacity,transform] active:scale-90 disabled:bg-fill disabled:text-label-3"
            >
              <Plus className="size-5" strokeWidth={2.75} />
            </button>
          </div>
          <div className={`${row} py-0`}>
            <GroupInput
              placeholder="กลุ่ม เช่น ครอบครัวก (ไม่บังคับ)"
              aria-label="กลุ่มของสมาชิกใหม่"
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
              className={rowField}
            />
          </div>
        </Section>
      </div>
      <TripTabBar tripId={tripId} />
    </div>
    </AvatarColorProvider>
  );
}
