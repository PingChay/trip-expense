"use client";

import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from "react";
import { Users } from "lucide-react";

/**
 * A family's colour is only its hue; globals.css turns it into an avatar fill and an ink
 * for light and dark appearance (bg-hue-avatar, text-hue-ink).
 */
type Tint = { hue: number; style: CSSProperties };

/**
 * The n-th colour of a trip. Hues step by the golden angle, so every new key lands
 * between existing hues and no two keys in a trip ever get the same colour.
 */
function tintAt(index: number): Tint {
  const hue = (225 + index * 137.508) % 360;
  return { hue, style: { "--hue": hue } as CSSProperties };
}

// Thai leading vowels sit before the consonant they belong to, so keep both.
const LEADING_VOWELS = new Set(["เ", "แ", "โ", "ใ", "ไ"]);

function initial(name: string) {
  const chars = Array.from(name.trim());
  if (chars.length === 0) return "?";
  if (LEADING_VOWELS.has(chars[0]) && chars[1]) return chars[0] + chars[1];
  return chars[0].toUpperCase();
}

function hashTint(key: string): Tint {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.codePointAt(0)!) | 0;
  return tintAt(Math.abs(hash) % 360);
}

/** Colour key → tint, assigned in trip order so groups and solo members don't collide. */
const AvatarColorContext = createContext<Map<string, Tint> | null>(null);

/**
 * Give every colour key (a group name, or the member's own name when they have no group)
 * its own colour, in the order given. Keys never share a colour.
 */
export function AvatarColorProvider({ keys, children }: { keys: string[]; children: ReactNode }) {
  const joined = keys.join("\u0000");
  const colors = useMemo(() => {
    const map = new Map<string, Tint>();
    for (const key of joined.split("\u0000")) {
      const k = key.trim();
      if (k && !map.has(k)) map.set(k, tintAt(map.size));
    }
    return map;
  }, [joined]);
  return <AvatarColorContext.Provider value={colors}>{children}</AvatarColorContext.Provider>;
}

export function useAvatarTint(key: string) {
  const colors = useContext(AvatarColorContext);
  return colors?.get(key.trim()) ?? hashTint(key.trim());
}

const sizes = {
  sm: "size-6 text-caption2",
  md: "size-8 text-footnote",
  lg: "size-10 text-subhead",
} as const;

/** Members of a group share their group's colour, so a family reads as one at a glance. */
export function MemberAvatar({
  name,
  group,
  size = "md",
}: {
  name: string;
  group?: string | null;
  size?: keyof typeof sizes;
}) {
  const tint = useAvatarTint(group?.trim() || name);
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full bg-hue-avatar font-semibold text-hue-ink ${sizes[size]}`}
      style={tint.style}
    >
      {initial(name)}
    </span>
  );
}

/** A whole group, in the same colour its members carry. */
export function GroupAvatar({ group, size = "sm" }: { group: string; size?: keyof typeof sizes }) {
  const tint = useAvatarTint(group);
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-hue-avatar text-hue-ink ${sizes[size]}`}
      style={tint.style}
    >
      <Users className={size === "sm" ? "size-3.5" : size === "md" ? "size-4" : "size-5"} strokeWidth={2.25} />
    </span>
  );
}
