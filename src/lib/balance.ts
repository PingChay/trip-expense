import type { PersonalAmounts } from "@/lib/bill-entry";

export type Member = { id: string; name: string };
export type Bill = {
  id: string;
  amount: number;
  payer_id: string;
  participants: string[];
  currency?: string;
  personalAmounts?: PersonalAmounts;
};

/**
 * What each participant owes for one bill. A participant with a personal amount
 * owes exactly that; everyone else splits what is left evenly.
 */
export function billShares(
  amount: number,
  participants: string[],
  personalAmounts: PersonalAmounts = {}
): Record<string, number> {
  const fixed = participants.filter((pid) => (personalAmounts[pid] ?? 0) > 0);
  const others = participants.filter((pid) => !fixed.includes(pid));
  const fixedTotal = fixed.reduce((sum, pid) => sum + personalAmounts[pid], 0);
  const evenShare = others.length > 0 ? (amount - fixedTotal) / others.length : 0;
  return Object.fromEntries(
    participants.map((pid) => [pid, fixed.includes(pid) ? personalAmounts[pid] : evenShare])
  );
}
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
    balance[bill.payer_id] = (balance[bill.payer_id] ?? 0) + amt;
    for (const [pid, share] of Object.entries(billShares(amt, bill.participants, bill.personalAmounts))) {
      balance[pid] = (balance[pid] ?? 0) - share;
    }
  }
  return balance;
}

export function computeSettlement(members: Member[], bills: Bill[], currency = ""): Settlement[] {
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
        currency,
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

export type GroupSettlement = Settlement & { fromIsGroup: boolean; toIsGroup: boolean };

/**
 * Settle between named groups when the trip has any (members without a group stand alone),
 * otherwise between members. Ids and names are the group or member label.
 */
export function computeGroupSettlements(
  members: Array<Member & { group_name?: string | null }>,
  bills: Array<Bill & { currency: string }>
): GroupSettlement[] {
  const hasNamedGroups = members.some((member) => Boolean(member.group_name?.trim()));
  const namedGroups = new Set(members.map((member) => member.group_name?.trim()).filter(Boolean) as string[]);
  const labelOf = (member: Member & { group_name?: string | null }) =>
    hasNamedGroups ? member.group_name?.trim() || member.name : member.name;
  const currencies = [...new Set(bills.map((bill) => bill.currency))];

  return currencies.flatMap((currency) => {
    const memberBalances = computeBalances(members, bills.filter((bill) => bill.currency === currency));
    const groupBals = new Map<string, number>();
    for (const member of members) {
      const label = labelOf(member);
      groupBals.set(label, (groupBals.get(label) ?? 0) + (memberBalances[member.id] ?? 0));
    }
    const creds = [...groupBals.entries()]
      .filter(([, b]) => b > 0.005)
      .map(([n, a]) => ({ id: n, amount: a }))
      .sort((a, b) => b.amount - a.amount);
    const debs = [...groupBals.entries()]
      .filter(([, b]) => b < -0.005)
      .map(([n, a]) => ({ id: n, amount: -a }))
      .sort((a, b) => b.amount - a.amount);

    const result: GroupSettlement[] = [];
    while (creds.length && debs.length) {
      const c = creds[0], d = debs[0];
      const amount = Math.min(c.amount, d.amount);
      if (amount > 0.005)
        result.push({
          fromId: d.id,
          fromName: d.id,
          fromIsGroup: namedGroups.has(d.id),
          toId: c.id,
          toName: c.id,
          toIsGroup: namedGroups.has(c.id),
          amount: Math.round(amount * 100) / 100,
          currency,
        });
      c.amount -= amount;
      d.amount -= amount;
      if (c.amount < 0.005) creds.shift();
      if (d.amount < 0.005) debs.shift();
    }
    return result;
  });
}
