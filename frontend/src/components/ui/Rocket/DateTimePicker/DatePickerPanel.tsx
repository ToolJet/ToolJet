import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../Button/Button';
import { DatePickerCalendar } from './DatePickerCalendar';
import { DatePickerTimeList } from './DatePickerTimeList';
import { clampDate, setTimeParts, type DatePickerType, type WeekStart } from './dateUtils';

export interface DatePickerPanelProps {
  type?: DatePickerType;
  value: Date | null;
  /** `date` and `time`: on every pick. `date-time`: once, on Apply. */
  onChange: (date: Date) => void;
  /** `date-time` only: the Cancel button. */
  onCancel?: () => void;
  minDate?: Date | null;
  maxDate?: Date | null;
  weekStartsOn?: WeekStart;
  /** What counts as "today". Defaults to the current date. */
  today?: Date;
  className?: string;
}

// The panel surface from the design: layer-01 background, weak 1px border, large radius, elevation-400. It is
// self-contained, so DateTimePicker strips the Popover's own surface and lets this one show.
const DatePickerPanel = ({
  type = 'date',
  value,
  onChange,
  onCancel,
  minDate,
  maxDate,
  weekStartsOn,
  today,
  className,
}: DatePickerPanelProps) => {
  const hasDate = type !== 'time';
  const hasTime = type !== 'date';
  const needsApply = type === 'date-time';

  // date-time edits a draft until Apply; the other two types have nothing to confirm and edit `value` directly.
  const [draft, setDraft] = useState<Date | null>(value);
  const current = needsApply ? draft : value;

  const commit = (next: Date) => {
    // A day pick keeps the clock time of the current value, which can fall outside the bounds of the picked day.
    // Only the types that carry a time clamp to the exact instant; `date` bounds are day-level.
    const result = hasTime ? clampDate(next, minDate, maxDate) : next;
    if (needsApply) setDraft(result);
    else onChange(result);
  };

  const pickDay = (day: Date) =>
    commit(setTimeParts(day, { hour24: current?.getHours() ?? 0, minute: current?.getMinutes() ?? 0 }));

  return (
    <div
      data-slot="date-picker-panel"
      data-type={type}
      className={cn(
        'tw-flex tw-flex-col tw-overflow-hidden tw-bg-background-surface-layer-01 tw-shadow-elevation-400',
        'tw-rounded-lg tw-border tw-border-solid tw-border-border-weak',
        needsApply ? 'tw-w-[400px]' : 'tw-w-60',
        className
      )}
    >
      <div className="tw-flex tw-gap-2 tw-p-3">
        {hasDate && (
          <DatePickerCalendar
            value={current}
            onSelect={pickDay}
            minDate={minDate}
            maxDate={maxDate}
            weekStartsOn={weekStartsOn}
            today={today}
            className={hasTime ? 'tw-w-52 tw-shrink-0' : undefined}
          />
        )}
        {hasTime && <DatePickerTimeList value={current} onChange={commit} />}
      </div>
      {needsApply && (
        <div className="tw-flex tw-justify-end tw-gap-1.5 tw-border-0 tw-border-t tw-border-solid tw-border-border-weak tw-px-3 tw-py-2">
          <Button type="button" variant="outline" size="medium" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="medium"
            disabled={!draft}
            onClick={() => draft && onChange(draft)}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
};

export { DatePickerPanel };
