import React, { useRef, useState } from 'react';
import { Calendar as CalendarIcon, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../Button/Button';
import { inputVariants } from '../Input/Input';
import { Popover, PopoverContent, PopoverTrigger } from '../Popover/Popover';
import { DatePickerPanel } from './DatePickerPanel';
import { defaultFormatDisplay, type DatePickerType, type WeekStart } from './dateUtils';

export interface DateTimePickerProps {
  /** A plain wall-clock Date, read with local getters. Time zones are the caller's business. */
  value: Date | null;
  onChange: (date: Date | null) => void;
  type?: DatePickerType;
  minDate?: Date | null;
  maxDate?: Date | null;
  placeholder?: string;
  disabled?: boolean;
  isClearable?: boolean;
  invalid?: boolean;
  size?: 'large' | 'default' | 'small';
  /** Text shown in the field. Default: dd/MM/yyyy, hh:mm a, or both. */
  formatDisplay?: (date: Date) => string;
  autoFocus?: boolean;
  weekStartsOn?: WeekStart;
  /** Extra classes for the popover content, e.g. `tw-z-[1100]` to open above a drawer. */
  popoverClassName?: string;
  className?: string;
  id?: string;
  'aria-label'?: string;
  'data-cy'?: string;
}

const DEFAULT_PLACEHOLDER: Record<DatePickerType, string> = {
  date: 'Select date',
  time: 'Select time',
  'date-time': 'Select date and time',
};

// The Rocket Input look on a button (the value is chosen, not typed), opening DatePickerPanel in a Popover.
const DateTimePicker = ({
  value,
  onChange,
  type = 'date',
  minDate,
  maxDate,
  placeholder,
  disabled = false,
  isClearable = false,
  invalid = false,
  size = 'default',
  formatDisplay,
  autoFocus,
  weekStartsOn,
  popoverClassName,
  className,
  id,
  'aria-label': ariaLabel,
  'data-cy': dataCy,
}: DateTimePickerProps) => {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const showClear = isClearable && !!value && !disabled;
  const Icon = type === 'time' ? Clock : CalendarIcon;

  const handleChange = (next: Date) => {
    onChange(next);
    // `time` is three picks (hour, minute, period), so it stays open; the other types are done after one.
    if (type !== 'time') setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn('tw-relative tw-flex tw-w-full', className)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            autoFocus={autoFocus}
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            data-cy={dataCy}
            className={cn(
              inputVariants({ size }),
              'tw-m-0 tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-2 tw-text-left',
              'disabled:tw-cursor-not-allowed',
              showClear && 'tw-pr-9'
            )}
          >
            <span className={cn('tw-min-w-0 tw-flex-1 tw-truncate', !value && 'tw-text-text-placeholder')}>
              {value
                ? (formatDisplay ?? ((d: Date) => defaultFormatDisplay(d, type)))(value)
                : (placeholder ?? DEFAULT_PLACEHOLDER[type])}
            </span>
            <Icon aria-hidden className="tw-size-4 tw-shrink-0 tw-text-icon-default" />
          </button>
        </PopoverTrigger>
        {showClear && (
          <Button
            type="button"
            variant="ghost"
            size="small"
            iconOnly
            aria-label="Clear"
            className="tw-absolute tw-inset-y-0 tw-right-8 tw-my-auto"
            onClick={() => onChange(null)}
          >
            <X aria-hidden />
          </Button>
        )}
      </div>
      <PopoverContent
        ref={contentRef}
        align="start"
        // The panel brings its own surface, so the Popover's is stripped.
        className={cn('tw-w-auto tw-gap-0 tw-border-0 tw-bg-transparent tw-p-0 tw-shadow-none', popoverClassName)}
        onOpenAutoFocus={(event) => {
          // Land on the tab stop of the panel (the selected day, or the selected hour) rather than the first button.
          event.preventDefault();
          const stop = contentRef.current?.querySelector<HTMLElement>('[tabindex="0"]');
          (stop ?? contentRef.current)?.focus();
        }}
        // A focus trap around the caller (a drawer) can move focus while the popup is open. Pointer presses outside
        // and Escape still close it. ponytail: Tab past the last control no longer closes it.
        onFocusOutside={(event) => event.preventDefault()}
      >
        <DatePickerPanel
          type={type}
          value={value}
          onChange={handleChange}
          onCancel={() => setOpen(false)}
          minDate={minDate}
          maxDate={maxDate}
          weekStartsOn={weekStartsOn}
        />
      </PopoverContent>
    </Popover>
  );
};

export { DateTimePicker };
