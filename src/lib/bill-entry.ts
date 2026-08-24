export type BillEntryType = "expense" | "advance";

const ENTRY_TYPE_PREFIX = "__tripsplit_entry_type:";
const ENTRY_TYPE_PATTERN = /^__tripsplit_entry_type:(expense|advance)__(?:\n)?/;

export function parseBillNote(note: string | null | undefined): {
  entryType: BillEntryType;
  note: string;
} {
  const rawNote = (note ?? "").trim();
  const match = rawNote.match(ENTRY_TYPE_PATTERN);

  if (!match) {
    return { entryType: "expense", note: rawNote };
  }

  return {
    entryType: match[1] as BillEntryType,
    note: rawNote.replace(ENTRY_TYPE_PATTERN, "").trim(),
  };
}

export function serializeBillNote(note: string, entryType: BillEntryType): string {
  const cleanNote = parseBillNote(note).note;
  if (entryType === "expense") {
    return cleanNote;
  }

  return `${ENTRY_TYPE_PREFIX}${entryType}__${cleanNote ? `\n${cleanNote}` : ""}`;
}

export function isExpenseEntry(entryType: BillEntryType): boolean {
  return entryType === "expense";
}

export function getBillEntryLabel(entryType: BillEntryType): string {
  return entryType === "advance" ? "เงินสำรอง" : "ค่าใช้จ่าย";
}