export type Member = { id: string; name: string };
export type Bill = { id: string; amount: number; payer_id: string; participants: string[]; currency?: string };
export type Settlement = {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
  currency: string;
};

export function computeBalances(members: Member[], bills: Bill[]): Record<string, number> {
  const balance: Record<string, number> = {};
  for (const m of members) balance[m.id] = 0;
  for (const bill of bills) {
    const amt = Number(bill.amount);
    const share = amt / bill.participants.length;
    balance[bill.payer_id] = (balance[bill.payer_id] ?? 0) + amt;
    for (const pid of bill.participants) {
      balance[pid] = (balance[pid] ?? 0) - share;
    }
  }
  return balance;
}

export function computeSettlement(members: Member[], bills: Bill[]): Settlement[] {
  const balances = computeBalances(members, bills);
  const nameOf = Object.fromEntries(members.map((m) => [m.id, m.name]));

  const creditors = Object.entries(balances)
    .filter(([, b]) => b > 0.005)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = Object.entries(balances)
    .filter(([, b]) => b < -0.005)
    .map(([id, amount]) => ({ id, amount: -amount }))
    .sort((a, b) => b.amount - a.amount);

  const result: Settlement[] = [];
  while (creditors.length > 0 && debtors.length > 0) {
    const c = creditors[0];
    const d = debtors[0];
    const amount = Math.min(c.amount, d.amount);
    if (amount > 0.005) {
      result.push({
        fromId: d.id,
        fromName: nameOf[d.id] ?? d.id,
        toId: c.id,
        toName: nameOf[c.id] ?? c.id,
        amount: Math.round(amount * 100) / 100,
      });
    }
    c.amount -= amount;
    d.amount -= amount;
    if (c.amount < 0.005) creditors.shift();
    if (d.amount < 0.005) debtors.shift();
  }
  return result;
}

/** Run settlement independently per currency and tag each transaction with its currency. */
export function computeSettlementMultiCurrency(
  members: Member[],
  bills: Array<Bill & { currency: string }>
): Settlement[] {
  const currencies = [...new Set(bills.map((b) => b.currency))];
  return currencies.flatMap((currency) => {
    const currBills = bills.filter((b) => b.currency === currency);
    const balances = computeBalances(members, currBills);
    const nameOf = Object.fromEntries(members.map((m) => [m.id, m.name]));

    const creditors = Object.entries(balances)
      .filter(([, b]) => b > 0.005)
      .map(([id, amount]) => ({ id, amount }))
      .sort((a, b) => b.amount - a.amount);
    const debtors = Object.entries(balances)
      .filter(([, b]) => b < -0.005)
      .map(([id, amount]) => ({ id, amount: -amount }))
      .sort((a, b) => b.amount - a.amount);

    const transactions: Settlement[] = [];
    while (creditors.length > 0 && debtors.length > 0) {
      const c = creditors[0];
      const d = debtors[0];
      const amount = Math.min(c.amount, d.amount);
      if (amount > 0.005) {
        transactions.push({
          fromId: d.id,
          fromName: nameOf[d.id] ?? d.id,
          toId: c.id,
          toName: nameOf[c.id] ?? c.id,
          amount: Math.round(amount * 100) / 100,
          currency,
        });
      }
      c.amount -= amount;
      d.amount -= amount;
      if (c.amount < 0.005) creditors.shift();
      if (d.amount < 0.005) debtors.shift();
    }
    return transactions;
  });
}
