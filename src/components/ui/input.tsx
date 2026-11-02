import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/** A standalone iOS text field (filled, no border). Inside a grouped row, pass `bg-transparent px-0`. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-xl bg-fill-3 px-3.5 text-body text-label outline-none transition-shadow placeholder:text-label-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tint/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-red/50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
