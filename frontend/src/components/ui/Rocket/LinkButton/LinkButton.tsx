import React, { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const linkButtonVariants = cva(
  [
    'tw-box-border tw-inline-flex tw-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-gap-1.5',
    'tw-rounded-default tw-border-0 tw-bg-transparent tw-px-1.5 tw-py-[3px] tw-outline-none',
    'tw-font-title-small tw-underline tw-whitespace-nowrap',
    'hover:tw-bg-interactive-hover active:tw-bg-interactive-selected',
    'focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline',
    'disabled:tw-cursor-not-allowed disabled:tw-text-text-disabled disabled:hover:tw-bg-transparent',
  ],
  {
    variants: {
      danger: { true: 'tw-text-text-danger', false: 'tw-text-text-accent' },
    },
    defaultVariants: { danger: false },
  }
);

export interface LinkButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, Omit<VariantProps<typeof linkButtonVariants>, 'danger'> {
  danger?: boolean;
}

// A ghost, underlined text action for inline use ("Clear all filters", "View details"). Small size only: the one
// instance in the Figma export is 11px; add sizes and icon slots when a second caller needs them.
const LinkButton = forwardRef<HTMLButtonElement, LinkButtonProps>(function LinkButton(
  { danger = false, className, type = 'button', ...props },
  ref
) {
  return <button ref={ref} type={type} className={cn(linkButtonVariants({ danger }), className)} {...props} />;
});

export { LinkButton, linkButtonVariants };
