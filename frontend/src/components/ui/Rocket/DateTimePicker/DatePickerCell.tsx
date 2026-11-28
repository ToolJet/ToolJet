import React, { forwardRef, type ButtonHTMLAttributes, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';

export type DatePickerCellVariant = 'default' | 'today' | 'outside';

export interface DatePickerCellProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?: DatePickerCellVariant;
  selected?: boolean;
  /** Not selectable (outside min/max). Marked with aria-disabled instead of `disabled` so arrow keys can still land on it. */
  disabled?: boolean;
}

// 28x28 day or time option. hover/pressed/focus come from CSS state classes; selected and disabled from props.
// `tw-font-title-default` (not `tw-font-medium`) because the font-* typography utilities are plugin utilities that
// would otherwise win over the core weight class.
const DatePickerCell = forwardRef<HTMLButtonElement, DatePickerCellProps>(function DatePickerCell(
  { variant = 'default', selected = false, disabled = false, className, onClick, type = 'button', ...props },
  ref
) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!disabled) onClick?.(event);
  };

  return (
    <button
      ref={ref}
      type={type}
      data-slot="date-picker-cell"
      data-variant={variant}
      data-selected={selected ? 'true' : undefined}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
      className={cn(
        'tw-m-0 tw-box-border tw-inline-flex tw-size-7 tw-shrink-0 tw-items-center tw-justify-center tw-p-0',
        'tw-appearance-none tw-rounded-default tw-border tw-border-solid tw-border-transparent tw-bg-transparent',
        'tw-font-body-default tw-text-text-default tw-outline-none tw-transition-colors',
        'focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline',
        variant === 'today' && 'tw-font-title-default tw-text-text-accent',
        variant === 'outside' && 'tw-text-text-placeholder',
        disabled
          ? 'tw-cursor-not-allowed tw-text-text-disabled'
          : 'tw-cursor-pointer hover:tw-bg-interactive-hover active:tw-bg-interactive-selected',
        selected &&
          'tw-font-title-default tw-border-border-accent-strong tw-bg-background-accent-weak tw-text-text-accent hover:tw-bg-background-accent-weak',
        className
      )}
      {...props}
    />
  );
});

export { DatePickerCell };
