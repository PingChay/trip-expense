// Trip dates are stored as plain YYYY-MM-DD; read them as UTC so no timezone shifts the day.
const toDate = (date: string) => new Date(`${date}T00:00:00Z`);

const part = (date: string, options: Intl.DateTimeFormatOptions) =>
  toDate(date).toLocaleDateString("th-TH", { timeZone: "UTC", ...options });

/** A trip's dates in Thai, e.g. "21–23 ส.ค. 2569", "30 ส.ค. – 2 ก.ย. 2569", or one day. */
export function formatTripDates(start: string | null, end: string | null) {
  if (!start) return null;
  if (!end || end === start) return part(start, { day: "numeric", month: "short", year: "numeric" });

  const [startYear, startMonth] = start.split("-");
  const [endYear, endMonth] = end.split("-");
  const endText = part(end, { day: "numeric", month: "short", year: "numeric" });
  if (startYear !== endYear) return `${part(start, { day: "numeric", month: "short", year: "numeric" })} – ${endText}`;
  if (startMonth !== endMonth) return `${part(start, { day: "numeric", month: "short" })} – ${endText}`;
  return `${part(start, { day: "numeric" })}–${endText}`;
}
