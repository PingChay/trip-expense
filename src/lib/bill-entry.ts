export type BillEntryType = "expense" | "advance";

/** Exact amount a member pays for a bill (the rest is split among the others), keyed by member id. */
export type PersonalAmounts = Record<string, number>;

// Bill metadata rides at the top of `note` as marker lines so no schema change is needed:
//   __tripsplit_entry_type:advance__
//   __tripsplit_personal:{"<memberId>":120}__
const ENTRY_TYPE_PREFIX = "__tripsplit_entry_type:";
const PERSONAL_PREFIX = "__tripsplit_personal:";
const META_LINE_PATTERN = /^__tripsplit_(entry_type|personal):(.*)__$/;

function parsePersonalAmounts(raw: string): PersonalAmounts {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, number] => typeof entry[1] === "number" && entry[1] > 0
      )
    );
  } catch {
    return {};
  }
}

export function parseBillNote(note: string | null | undefined): {
  entryType: BillEntryType;
  personalAmounts: PersonalAmounts;
  note: string;
} {
  const lines = (note ?? "").trim().split("\n");
  let entryType: BillEntryType = "expense";
  let personalAmounts: PersonalAmounts = {};

  while (lines.length > 0) {
    const match = lines[0].trim().match(META_LINE_PATTERN);
    if (!match) break;
    if (match[1] === "entry_type" && (match[2] === "expense" || match[2] === "advance")) {
      entryType = match[2];
    } else if (match[1] === "personal") {
      personalAmounts = parsePersonalAmounts(match[2]);
    }
    lines.shift();
  }

  return { entryType, personalAmounts, note: lines.join("\n").trim() };
}

export function serializeBillNote(
  note: string,
  entryType: BillEntryType,
  personalAmounts: PersonalAmounts = {}
): string {
  const cleanNote = parseBillNote(note).note;
  const personal = Object.fromEntries(Object.entries(personalAmounts).filter(([, amount]) => amount > 0));
  const meta = [
    ...(entryType === "expense" ? [] : [`${ENTRY_TYPE_PREFIX}${entryType}__`]),
    ...(Object.keys(personal).length > 0 ? [`${PERSONAL_PREFIX}${JSON.stringify(personal)}__`] : []),
  ];

  return [...meta, ...(cleanNote ? [cleanNote] : [])].join("\n");
}

export function isExpenseEntry(entryType: BillEntryType): boolean {
  return entryType === "expense";
}

export function getBillEntryLabel(entryType: BillEntryType): string {
  return entryType === "advance" ? "เงินสำรอง" : "ค่าใช้จ่าย";
}
