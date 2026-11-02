import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// The iOS text styles in globals.css are font sizes; without this, text-body would
// be read as a colour and knock out text-white.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "large-title",
        "title1",
        "title2",
        "title3",
        "body",
        "callout",
        "subhead",
        "footnote",
        "caption",
        "caption2",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
