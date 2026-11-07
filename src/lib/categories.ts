/** Kept in this order everywhere (picker, bar, list): the colour tokens are checked as neighbours in it. */
export const BILL_CATEGORIES = ["food", "stay", "transport", "activity", "shopping", "other"] as const;
export type BillCategory = (typeof BILL_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<BillCategory, string> = {
  food: "อาหาร",
  stay: "ที่พัก",
  transport: "เดินทาง",
  activity: "เที่ยว",
  shopping: "ช้อปปิ้ง",
  other: "อื่นๆ",
};

export function isBillCategory(value: string): value is BillCategory {
  return (BILL_CATEGORIES as readonly string[]).includes(value);
}

// Thai and English words people actually type as bill titles; first match wins
const KEYWORDS: [BillCategory, RegExp][] = [
  ["stay", /ที่พัก|โรงแรม|รีสอร์ท|รีสอร์ต|โฮสเทล|บ้านพัก|ห้องพัก|เต็นท์|ลานกาง|airbnb|agoda|hotel|resort|hostel|booking/i],
  ["transport", /รถ|แท็กซี่|แท็กซี|taxi|grab|bolt|น้ำมัน|เติมแก๊ส|ทางด่วน|ค่าทาง|ที่จอด|จอดรถ|parking|ตั๋วเครื่องบิน|เครื่องบิน|เรือ|bts|mrt|รถไฟ|train|flight|bus|ferry|เช่ารถ|ค่าเดินทาง/i],
  // groceries for cooking at the stay count as food: makro, Lotus, ice, sauce
  ["food", /อาหาร|ข้าว|กิน|มื้อ|ร้าน|หมู(?!่)|ไก่|กุ้ง|ผัก|สลัด|ซอส|น้ำจิ้ม|น้ำแข็ง|ผลไม้|ชาบู|ปิ้งย่าง|บาบีคิว|บาร์บีคิว|บุฟเฟ่ต์|ก๋วยเตี๋ยว|ส้มตำ|ซีฟู้ด|แพนเค้ก|กาแฟ|คาเฟ่|ขนม|เครื่องดื่ม|น้ำดื่ม|เบียร์|เหล้า|ไวน์|ของว่าง|วัตถุดิบ|แม็คโคร|แมคโคร|โลตัส|บิ๊กซี|ซุปเปอร์|food|lunch|dinner|breakfast|brunch|bbq|cafe|coffee|drink|beer|bar|snack|makro|lotus|big ?c|tops|supermarket|7-?eleven|เซเว่น/i],
  ["activity", /ตั๋ว|ทัวร์|ค่าเข้า|เข้าชม|อุทยาน|สวนสนุก|ดำน้ำ|สปา|นวด|กิจกรรม|ไกด์|ticket|tour|entrance|park|museum|spa|massage|diving|activity/i],
  ["shopping", /ซื้อ|ช้อป|ของฝาก|ของที่ระลึก|ตลาด|ห้าง|shop|souvenir|market|mall/i],
];

/** A best guess from the title, for bills saved before categories existed and as the form's default. */
export function guessCategory(title: string): BillCategory | null {
  return KEYWORDS.find(([, pattern]) => pattern.test(title))?.[0] ?? null;
}

export type CategorySpending = {
  currency: string;
  total: number;
  /** only categories with bills, in their fixed order */
  categories: { category: BillCategory; amount: number; count: number }[];
};

/** Spending per category, one entry per currency since amounts in different currencies never add up. */
export function spendingByCategory(
  expenseBills: { amount: number; currency: string; category: BillCategory }[]
): CategorySpending[] {
  return [...new Set(expenseBills.map((bill) => bill.currency))].map((currency) => {
    const currBills = expenseBills.filter((bill) => bill.currency === currency);
    return {
      currency,
      total: currBills.reduce((sum, bill) => sum + bill.amount, 0),
      categories: BILL_CATEGORIES.map((category) => {
        const inCategory = currBills.filter((bill) => bill.category === category);
        return { category, amount: inCategory.reduce((sum, bill) => sum + bill.amount, 0), count: inCategory.length };
      }).filter((entry) => entry.count > 0),
    };
  });
}
