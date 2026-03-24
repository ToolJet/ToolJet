import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Rocket/Button/Button"
import { Input } from "@/components/ui/Rocket/Input/Input"
import { Textarea } from "@/components/ui/Rocket/shadcn/textarea"

function InputGroup({
  className,
  ...props
}) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "tw-group/input-group tw-border-input dark:tw-bg-input/30 tw-shadow-xs tw-relative tw-flex tw-w-full tw-items-center tw-rounded-md tw-border tw-outline-none tw-transition-[color,box-shadow]",
        "tw-h-9 has-[>textarea]:tw-h-auto",
        // Variants based on alignment.
        "has-[>[data-align=inline-start]]:[&>input]:tw-pl-2",
        "has-[>[data-align=inline-end]]:[&>input]:tw-pr-2",
        "has-[>[data-align=block-start]]:tw-h-auto has-[>[data-align=block-start]]:tw-flex-col has-[>[data-align=block-start]]:[&>input]:tw-pb-3",
        "has-[>[data-align=block-end]]:tw-h-auto has-[>[data-align=block-end]]:tw-flex-col has-[>[data-align=block-end]]:[&>input]:tw-pt-3",
        // Focus state.
        "has-[[data-slot=input-group-control]:focus-visible]:tw-ring-ring has-[[data-slot=input-group-control]:focus-visible]:tw-ring-1",
        // Error state.
        "has-[[data-slot][aria-invalid=true]]:tw-ring-destructive/20 has-[[data-slot][aria-invalid=true]]:tw-border-destructive dark:has-[[data-slot][aria-invalid=true]]:tw-ring-destructive/40",
        className
      )}
      {...props} />
  );
}

const inputGroupAddonVariants = cva(
  "tw-text-muted-foreground tw-flex tw-h-auto tw-cursor-text tw-select-none tw-items-center tw-justify-center tw-gap-2 tw-py-1.5 tw-text-sm tw-font-medium group-data-[disabled=true]/input-group:tw-opacity-50 [&>kbd]:tw-rounded-[calc(var(--radius)-5px)] [&>svg:not([class*=size-])]:tw-size-4",
  {
    variants: {
      align: {
        "inline-start":
          "tw-order-first tw-pl-3 has-[>button]:tw-ml-[-0.45rem] has-[>kbd]:tw-ml-[-0.35rem]",
        "inline-end":
          "tw-order-last tw-pr-3 has-[>button]:tw-mr-[-0.4rem] has-[>kbd]:tw-mr-[-0.35rem]",
        "block-start":
          "[.border-b]:tw-pb-3 tw-order-first tw-w-full tw-justify-start tw-px-3 tw-pt-3 group-has-[>input]/input-group:tw-pt-2.5",
        "block-end":
          "[.border-t]:tw-pt-3 tw-order-last tw-w-full tw-justify-start tw-px-3 tw-pb-3 group-has-[>input]/input-group:tw-pb-2.5",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target).closest("button")) {
          return
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus()
      }}
      {...props} />
  );
}

const inputGroupButtonVariants = cva("tw-flex tw-items-center tw-gap-2 tw-text-sm tw-shadow-none", {
  variants: {
    size: {
      xs: "tw-h-6 tw-gap-1 tw-rounded-[calc(var(--radius)-5px)] tw-px-2 has-[>svg]:tw-px-2 [&>svg:not([class*=size-])]:tw-size-3.5",
      sm: "tw-h-8 tw-gap-1.5 tw-rounded-md tw-px-2.5 has-[>svg]:tw-px-2.5",
      "icon-xs":
        "tw-size-6 tw-rounded-[calc(var(--radius)-5px)] tw-p-0 has-[>svg]:tw-p-0",
      "icon-sm": "tw-size-8 tw-p-0 has-[>svg]:tw-p-0",
    },
  },
  defaultVariants: {
    size: "xs",
  },
})

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props} />
  );
}

function InputGroupText({
  className,
  ...props
}) {
  return (
    <span
      className={cn(
        "tw-text-muted-foreground tw-flex tw-items-center tw-gap-2 tw-text-sm [&_svg:not([class*=size-])]:tw-size-4 [&_svg]:tw-pointer-events-none",
        className
      )}
      {...props} />
  );
}

function InputGroupInput({
  className,
  ...props
}) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "tw-flex-1 tw-rounded-none tw-border-0 tw-bg-transparent tw-shadow-none focus-visible:tw-ring-0 dark:tw-bg-transparent",
        className
      )}
      {...props} />
  );
}

function InputGroupTextarea({
  className,
  ...props
}) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "tw-flex-1 tw-resize-none tw-rounded-none tw-border-0 tw-bg-transparent tw-py-3 tw-shadow-none focus-visible:tw-ring-0 dark:tw-bg-transparent",
        className
      )}
      {...props} />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}
