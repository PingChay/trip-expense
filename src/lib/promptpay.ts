// PromptPay QR payload (Thai QR / EMVCo merchant-presented format).
// Accepts a mobile number (10 digits, starts with 0), national/tax ID (13) or e-wallet ID (15).

const PROMPTPAY_AID = "A000000677010111";

export type PromptPayKind = "phone" | "nationalId" | "eWallet";

export function normalizePromptPay(input: string): string {
  return input.replace(/[^0-9]/g, "");
}

export function promptPayKind(id: string): PromptPayKind | null {
  if (/^0\d{9}$/.test(id)) return "phone";
  if (/^\d{13}$/.test(id)) return "nationalId";
  if (/^\d{15}$/.test(id)) return "eWallet";
  return null;
}

export function isValidPromptPay(input: string): boolean {
  return promptPayKind(normalizePromptPay(input)) !== null;
}

/** 081-234-5678 style for phones, last 4 visible for IDs. */
export function formatPromptPay(id: string): string {
  const kind = promptPayKind(id);
  if (kind === "phone") return `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}`;
  if (kind) return `•••• ${id.slice(-4)}`;
  return id;
}

function field(tag: string, value: string) {
  return tag + value.length.toString().padStart(2, "0") + value;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function promptPayPayload(id: string, amount?: number): string {
  const kind = promptPayKind(id);
  if (!kind) throw new Error("Invalid PromptPay ID");

  const target =
    kind === "phone"
      ? field("01", ("0066" + id.slice(1)).padStart(13, "0"))
      : field(kind === "nationalId" ? "02" : "03", id);
  const hasAmount = amount !== undefined && amount > 0;

  const body = [
    field("00", "01"),
    field("01", hasAmount ? "12" : "11"),
    field("29", field("00", PROMPTPAY_AID) + target),
    field("58", "TH"),
    field("53", "764"),
    ...(hasAmount ? [field("54", amount.toFixed(2))] : []),
  ].join("");

  return body + "6304" + crc16(body + "6304");
}
