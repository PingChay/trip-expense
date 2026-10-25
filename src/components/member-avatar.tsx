"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Users } from "lucide-react";

type Tint = { backgroundColor: string; color: string };

/**
 * The n-th colour of a trip. Hues step by the golden angle, so every new key lands
 * between existing hues and no two keys in a trip ever get the same colour.
 */
function tintAt(index: number): Tint {
  const hue = (225 + index * 137.508) % 360;
  return { backgroundColor: `oklch(0.93 0.055 ${hue})`, color: `oklch(0.42 0.11 ${hue})` };
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


function useTint(key: string) {
  const colors = useContext(AvatarColorContext);
  return colors?.get(key.trim()) ?? hashTint(key.trim());
}

/** Members of a group share their group's colour, so a family reads as one at a glance. */
export function MemberAvatar({
  name,
  group,
  size = "md",
}: {
  name: string;
  group?: string | null;
  size?: "sm" | "md";
}) {
  const tint = useTint(group?.trim() || name);
  return (
    <span
      aria-hidden
      className={[
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold",
        size === "sm" ? "size-6 text-[11px]" : "size-8 text-[13px]",
      ].join(" ")}
      style={tint}
    >
      {initial(name)}
    </span>
  );
}

/** A whole group, in the same colour its members carry. */
export function GroupAvatar({ group, size = "sm" }: { group: string; size?: "sm" | "md" }) {
  const tint = useTint(group);
  return (
    <span
      aria-hidden
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-full",
        size === "sm" ? "size-6" : "size-8",
      ].join(" ")}
      style={tint}
    >
      <Users className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </span>
  );
}
