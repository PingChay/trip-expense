import type { CSSProperties } from "react";
import { BedDouble, CarFront, Ellipsis, ShoppingBag, Ticket, Utensils, type LucideIcon } from "lucide-react";
import { CATEGORY_LABELS, type BillCategory } from "@/lib/categories";

const ICONS: Record<BillCategory, LucideIcon> = {
  food: Utensils,
  stay: BedDouble,
  transport: CarFront,
  activity: Ticket,
  shopping: ShoppingBag,
  other: Ellipsis,
};

/** Sets --cat so bg-cat / text-cat paint in this category's colour. */
export function categoryStyle(category: BillCategory): CSSProperties {
  return { "--cat": `var(--ios-cat-${category})` } as CSSProperties;
}

const sizes = {
  sm: { box: "size-5 rounded-[0.3125rem]", glyph: "size-3" },
  md: { box: "size-8 rounded-[0.5rem]", glyph: "size-[18px]" },
};

/** A Settings-style icon: white glyph on the category's colour. Pass `decorative` when its name is written beside it. */
export function CategoryIcon({
  category,
  size = "md",
  decorative = false,
}: {
  category: BillCategory;
  size?: keyof typeof sizes;
  decorative?: boolean;
}) {
  const Icon = ICONS[category];
  return (
    <span
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": CATEGORY_LABELS[category] })}
      style={categoryStyle(category)}
      className={`inline-flex shrink-0 items-center justify-center bg-cat text-white ${sizes[size].box}`}
    >
      <Icon className={sizes[size].glyph} strokeWidth={2.25} />
    </span>
  );
}
