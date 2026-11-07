import { CATEGORY_LABELS, type CategorySpending } from "@/lib/categories";
import { CategoryIcon, categoryStyle } from "@/components/category-icon";

const RADIUS = 44;
const THICKNESS = 24;
/** the 2px surface gap between slices, in pathLength units (100 = the whole ring) */
const GAP = 0.8;

const money = (value: number) => value.toLocaleString("th-TH", { maximumFractionDigits: 0 });
const centreMoney = (value: number) =>
  value.toLocaleString("th-TH", value >= 100_000 ? { notation: "compact", maximumFractionDigits: 1 } : { maximumFractionDigits: 0 });

/**
 * One currency's spending as a pie, slices in the categories' fixed order starting at 12 o'clock.
 * The legend beside it names every slice with its share and amount, so colour never carries it alone.
 */
export function CategoryPie({ spending }: { spending: CategorySpending }) {
  const ranked = [...spending.categories].sort((a, b) => b.amount - a.amount);
  const shareOf = (amount: number) => (spending.total > 0 ? (amount / spending.total) * 100 : 0);
  const gap = spending.categories.length > 1 ? GAP : 0;

  const shares = spending.categories.map((entry) => shareOf(entry.amount));
  const slices = spending.categories.map((entry, index) => ({
    ...entry,
    share: shares[index],
    // where this slice begins: the shares of every slice before it
    start: shares.slice(0, index).reduce((sum, share) => sum + share, 0),
    length: Math.max(shares[index] - gap, 0.4),
  }));

  return (
    <div className="flex items-center gap-5 px-4 py-4">
      <div className="relative size-34 shrink-0">
        <svg
          viewBox="0 0 120 120"
          role="img"
          aria-label={`ใช้จ่ายตามหมวด ${ranked.map((e) => `${CATEGORY_LABELS[e.category]} ${Math.round(shareOf(e.amount))}%`).join(", ")}`}
          className="size-full -rotate-90"
        >
          {slices.map((slice) => (
            <circle
              key={slice.category}
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              strokeWidth={THICKNESS}
              pathLength={100}
              strokeDasharray={`${slice.length} ${100 - slice.length}`}
              strokeDashoffset={-(slice.start + gap / 2)}
              style={categoryStyle(slice.category)}
              className="stroke-cat"
            >
              <title>{`${CATEGORY_LABELS[slice.category]} ${money(slice.amount)} ${spending.currency} (${Math.round(slice.share)}%)`}</title>
            </circle>
          ))}
        </svg>
        <p aria-hidden className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
          <span className="text-subhead font-bold tabular-nums">{centreMoney(spending.total)}</span>
          <span className="text-caption2 font-medium text-label-2">{spending.currency}</span>
        </p>
      </div>

      <ul className="min-w-0 flex-1 space-y-2.5">
        {ranked.map((entry) => (
          <li key={entry.category} className="flex items-start gap-2">
            <span className="mt-0.5">
              <CategoryIcon category={entry.category} size="sm" decorative />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-subhead">{CATEGORY_LABELS[entry.category]}</span>
              <span className="block text-footnote tabular-nums text-label-2">{money(entry.amount)}</span>
            </span>
            <span className="shrink-0 text-subhead font-semibold tabular-nums">
              {Math.round(shareOf(entry.amount))}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
