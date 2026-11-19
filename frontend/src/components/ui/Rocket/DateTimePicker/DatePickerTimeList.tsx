import React, { useEffect, useRef, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { DatePickerCell } from './DatePickerCell';
import { setTimeParts, to12h, to24h, type Period } from './dateUtils';

export interface DatePickerTimeListProps {
  value: Date | null;
  /** Called with the date of `value` (today when empty) and the new time, as a 24h Date. */
  onChange: (next: Date) => void;
  className?: string;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

interface ColumnOption {
  label: string;
  selected: boolean;
  onPick: () => void;
}

const COLUMN_KEYS: Record<string, 'prev' | 'next' | 'first' | 'last'> = {
  ArrowUp: 'prev',
  ArrowDown: 'next',
  Home: 'first',
  End: 'last',
};

// One 48x224 scrolling listbox. The selected option (or the first, when none is) is the column's tab stop; arrow keys
// move focus inside the column and Enter/Space pick, so a keyboard user does not change the value just by passing over.
function Column({ label, options }: { label: string; options: ColumnOption[] }) {
  const ref = useRef<HTMLDivElement>(null);

  // Centre the selected option on mount. Computed from offsetTop instead of scrollIntoView, which can also scroll
  // the page or the popover when the column is partly off screen.
  useEffect(() => {
    const column = ref.current;
    const selected = column?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (column && selected) column.scrollTop = selected.offsetTop - (column.clientHeight - selected.offsetHeight) / 2;
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const move = COLUMN_KEYS[event.key];
    if (!move) return;
    const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    const index = items.indexOf(event.target as HTMLElement);
    if (index === -1) return;
    event.preventDefault();
    const target = { prev: index - 1, next: index + 1, first: 0, last: items.length - 1 }[move];
    items[Math.min(Math.max(target, 0), items.length - 1)]?.focus();
  };

  const tabStop = Math.max(
    options.findIndex((option) => option.selected),
    0
  );

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      aria-orientation="vertical"
      onKeyDown={handleKeyDown}
      className={cn(
        'tw-relative tw-flex tw-h-56 tw-w-12 tw-shrink-0 tw-flex-col tw-gap-0.5 tw-overflow-y-auto tw-overflow-x-hidden',
        // The design shows no scrollbar: the column still scrolls, and keeps its full 48px width.
        '[scrollbar-width:none] [&::-webkit-scrollbar]:tw-hidden'
      )}
    >
      {options.map((option, index) => (
        <DatePickerCell
          key={option.label}
          role="option"
          aria-selected={option.selected}
          tabIndex={index === tabStop ? 0 : -1}
          selected={option.selected}
          className="tw-w-full"
          onClick={option.onPick}
        >
          {option.label}
        </DatePickerCell>
      ))}
    </div>
  );
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const BASE_MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

const DatePickerTimeList = ({ value, onChange, className }: DatePickerTimeListProps) => {
  const current = value ? to12h(value.getHours()) : null;
  const minute = value ? value.getMinutes() : null;

  // Steps of five, plus whatever off-grid minute the value already has so it can still show as selected.
  const minutes =
    minute !== null && !BASE_MINUTES.includes(minute) ? [...BASE_MINUTES, minute].sort((a, b) => a - b) : BASE_MINUTES;

  const pickTime = (parts: { hour12?: number; period?: Period; minute?: number }) => {
    const hour12 = parts.hour12 ?? current?.hour ?? 12;
    const period = parts.period ?? current?.period ?? 'AM';
    onChange(setTimeParts(value, { hour24: to24h(hour12, period), minute: parts.minute ?? minute ?? 0 }));
  };

  return (
    <div data-slot="date-picker-time-list" className={cn('tw-flex tw-gap-1', className)}>
      <Column
        label="Hour"
        options={HOURS.map((hour) => ({
          label: pad2(hour),
          selected: current?.hour === hour,
          onPick: () => pickTime({ hour12: hour }),
        }))}
      />
      <Column
        label="Minute"
        options={minutes.map((m) => ({
          label: pad2(m),
          selected: minute === m,
          onPick: () => pickTime({ minute: m }),
        }))}
      />
      <Column
        label="Period"
        options={(['AM', 'PM'] as const).map((period) => ({
          label: period,
          selected: current?.period === period,
          onPick: () => pickTime({ period }),
        }))}
      />
    </div>
  );
};

export { DatePickerTimeList };
