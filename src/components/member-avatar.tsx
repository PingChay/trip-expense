const TINTS = [
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
  "bg-emerald-100 text-emerald-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
  "bg-teal-100 text-teal-800",
  "bg-orange-100 text-orange-800",
  "bg-indigo-100 text-indigo-800",
] as const;

// Thai leading vowels sit before the consonant they belong to, so keep both.
const LEADING_VOWELS = new Set(["เ", "แ", "โ", "ใ", "ไ"]);

function initial(name: string) {
  const chars = Array.from(name.trim());
  if (chars.length === 0) return "?";
  if (LEADING_VOWELS.has(chars[0]) && chars[1]) return chars[0] + chars[1];
  return chars[0].toUpperCase();
}

function tint(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.codePointAt(0)!) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
}

export function MemberAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden
      className={[
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold",
        size === "sm" ? "size-6 text-[11px]" : "size-8 text-[13px]",
        tint(name),
      ].join(" ")}
    >
      {initial(name)}
    </span>
  );
}
