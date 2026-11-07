import type { BillEntryType, PersonalAmounts } from "@/lib/bill-entry";
import type { BillCategory } from "@/lib/categories";

export interface BillInput {
  title: string;
  amount: number;
  currency: string;
  payerId: string;
  participants: string[];
  date: string;
  note: string;
  entryType: BillEntryType;
  personalAmounts: PersonalAmounts;
  category: BillCategory | null;
}
