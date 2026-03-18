import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-md tw-text-sm tw-font-medium tw-transition-colors hover:tw-bg-muted hover:tw-text-muted-foreground focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-ring disabled:tw-pointer-events-none disabled:tw-opacity-50 data-[state=on]:tw-bg-accent data-[state=on]:tw-text-accent-foreground [&_svg]:tw-pointer-events-none [&_svg]:tw-size-4 [&_svg]:tw-shrink-0",
  {
    variants: {
      variant: {
        default: "tw-bg-transparent",
        outline:
          "tw-border tw-border-input tw-bg-transparent tw-shadow-sm hover:tw-bg-accent hover:tw-text-accent-foreground",
      },
      size: {
        default: "tw-h-9 tw-px-2 tw-min-w-9",
        sm: "tw-h-8 tw-px-1.5 tw-min-w-8",
        lg: "tw-h-10 tw-px-2.5 tw-min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props} />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
