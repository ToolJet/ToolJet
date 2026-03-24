import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "tw-flex tw-min-h-[60px] tw-w-full tw-rounded-md tw-border tw-border-input tw-bg-transparent tw-px-3 tw-py-2 tw-text-base tw-shadow-sm placeholder:tw-text-muted-foreground focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-ring disabled:tw-cursor-not-allowed disabled:tw-opacity-50 md:tw-text-sm",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
