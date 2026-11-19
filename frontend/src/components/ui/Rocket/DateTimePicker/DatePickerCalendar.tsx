import React, { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../Button/Button';
import { DatePickerCell } from './DatePickerCell';
import {
  addDays,
  addMonths,
  formatDayLabel,
  formatMonthTitle,
  getMonthGrid,
  isDayDisabled,
  isSameDay,
  startOfDay,
  type WeekStart,
} from './dateUtils';

export interface DatePickerCalendarProps {
  value: Date | null;
  /** Called with the picked day at local midnight. */
  onSelect: (day: Date) => void;
  minDate?: Date | null;
  maxDate?: Date | null;
  /** 0 = Sunday (default) … 6 = Saturday. */
  weekStartsOn?: WeekStart;
  /** What counts as "today". Defaults to the current date. */
  today?: Date;
  className?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Moves the focused day for a key; undefined for keys that do not navigate.
const stepFor = (key: string, from: Date, weekStartsOn: WeekStart): Date | undefined => {
  const weekStart = (from.getDay() - weekStartsOn + 7) % 7;
  switch (key) {
    case 'ArrowLeft':
      return addDays(from, -1);
    case 'ArrowRight':
      return addDays(from, 1);
    case 'ArrowUp':
      return addDays(from, -7);
    case 'ArrowDown':
      return addDays(from, 7);
    case 'Home':
      return addDays(from, -weekStart);
    case 'End':
      return addDays(from, 6 - weekStart);
    case 'PageUp':
      return addMonths(from, -1);
    case 'PageDown':
      return addMonths(from, 1);
    default:
      return undefined;
  }
};

// One piece of state, `focusDate`, drives both the visible month and the roving tab stop: the month shown is always
// the month of the focused day, so keyboard moves across a month edge and the header buttons share one path.
const DatePickerCalendar = ({
  value,
  onSelect,
  minDate,
  maxDate,
  weekStartsOn = 0,
  today,
  className,
}: DatePickerCalendarProps) => {
  const todayDate = today ?? new Date();
  const [focusDate, setFocusDate] = useState(() => startOfDay(value ?? todayDate));
  const gridRef = useRef<HTMLDivElement>(null);
  const moveDomFocus = useRef(false);

  const year = focusDate.getFullYear();
  const month = focusDate.getMonth();
  const weeks = useMemo(() => getMonthGrid(new Date(year, month, 1), weekStartsOn), [year, month, weekStartsOn]);
  const title = formatMonthTitle(focusDate);
  const headers = [...WEEKDAYS.slice(weekStartsOn), ...WEEKDAYS.slice(0, weekStartsOn)];

  // After a key press re-renders the grid, move real focus onto the new tab stop (arrow keys only; clicking the
  // header buttons must keep focus on the button).
  useEffect(() => {
    if (!moveDomFocus.current) return;
    moveDomFocus.current = false;
    gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  }, [focusDate]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = stepFor(event.key, focusDate, weekStartsOn);
    if (!next) return;
    event.preventDefault();
    moveDomFocus.current = true;
    setFocusDate(next);
  };

  const pick = (day: Date) => {
    setFocusDate(day);
    onSelect(day);
  };

  return (
    <div data-slot="date-picker-calendar" className={cn('tw-flex tw-w-full tw-flex-col tw-gap-2', className)}>
      <div className="tw-flex tw-items-center tw-justify-between">
        <Button
          type="button"
          variant="ghost"
          size="medium"
          iconOnly
          aria-label="Previous month"
          onClick={() => setFocusDate(addMonths(focusDate, -1))}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <div aria-live="polite" className="tw-font-title-default tw-text-center tw-text-text-default">
          {title}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="medium"
          iconOnly
          aria-label="Next month"
          onClick={() => setFocusDate(addMonths(focusDate, 1))}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-label={title}
        onKeyDown={handleKeyDown}
        className="tw-flex tw-flex-col tw-gap-0.5"
      >
        <div role="row" className="tw-flex tw-justify-between">
          {headers.map((label) => (
            <div
              key={label}
              role="columnheader"
              className="tw-font-body-small tw-flex tw-size-7 tw-items-center tw-justify-center tw-text-text-placeholder"
            >
              {label}
            </div>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0].getTime()} role="row" className="tw-flex tw-justify-between">
            {week.map((day) => {
              const selected = !!value && isSameDay(day, value);
              const isToday = isSameDay(day, todayDate);
              const outside = day.getMonth() !== month;
              return (
                <div key={day.getTime()} role="gridcell" aria-selected={selected}>
                  <DatePickerCell
                    variant={isToday ? 'today' : outside ? 'outside' : 'default'}
                    selected={selected}
                    disabled={isDayDisabled(day, minDate, maxDate)}
                    tabIndex={isSameDay(day, focusDate) ? 0 : -1}
                    aria-label={formatDayLabel(day)}
                    aria-current={isToday ? 'date' : undefined}
                    onClick={() => pick(day)}
                  >
                    {day.getDate()}
                  </DatePickerCell>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export { DatePickerCalendar };
