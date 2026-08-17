export interface BillInput {
  title: string;
  amount: number;
  currency: string;
  payerId: string;
  participants: string[];
  date: string;
  note: string;
}
