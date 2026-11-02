import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/** iOS capsule buttons: filled (prominent), tinted, gray, plain, destructive. */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap transition-[background-color,opacity,transform] duration-150 outline-none select-none active:not-aria-[haspopup]:scale-[0.97] active:opacity-80 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.125rem]",
  {
    variants: {
      variant: {
        default: "bg-tint text-white",
        secondary: "bg-tint/15 text-tint",
        outline: "bg-fill-3 text-label",
        ghost: "text-tint hover:bg-fill-3",
        destructive: "bg-red/15 text-negative",
        link: "text-tint underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-1.5 px-5 text-body",
        xs: "h-7 gap-1 px-2.5 text-footnote",
        sm: "h-8 gap-1 px-3.5 text-subhead",
        lg: "h-[3.25rem] gap-2 px-6 text-body",
        icon: "size-11",
        "icon-xs": "size-7",
        "icon-sm": "size-8",
        "icon-lg": "size-[3.25rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
