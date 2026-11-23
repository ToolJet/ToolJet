import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/Rocket/ToggleGroup/ToggleGroup';
import { DatePickerCalendar } from '@/components/ui/Rocket/DateTimePicker';
import { setTimeParts, to12h, to24h, type Period } from '@/components/ui/Rocket/DateTimePicker/dateUtils';

const MIN_DATE = new Date(1800, 0, 1);
const MAX_DATE = new Date(2200, 11, 31);

const pad2 = (value: number) => String(value).padStart(2, '0');

type StepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  'data-cy': string;
};

// A two-digit number field with up/down steppers (design: numberInput). Typing is free until the field is left or Enter
// is pressed; the arrows and the stepper buttons wrap around (59 -> 0, 12 -> 1) without carrying into the next field.
function TimeStepper({ label, value, min, max, onChange, 'data-cy': dataCy }: StepperProps) {
  const [typed, setTyped] = useState<string | null>(null);

  const commit = (next: number) => onChange(Math.min(Math.max(next, min), max));
  const step = (offset: number) => {
    const span = max - min + 1;
    onChange(((value - min + offset + span) % span) + min);
    setTyped(null);
  };
  const settleTyped = () => {
    if (typed !== null && typed !== '' && !Number.isNaN(Number(typed))) commit(Number(typed));
    setTyped(null);
  };

  return (
    <div className="tw-flex tw-h-7 tw-min-w-0 tw-flex-1 tw-items-center tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-border-default tw-bg-background-surface-layer-01 focus-within:tw-border-border-accent-strong">
      <input
        aria-label={label}
        inputMode="numeric"
        value={typed ?? pad2(value)}
        data-cy={dataCy}
        onChange={(event) => setTyped(event.target.value.replace(/\D/g, '').slice(0, 2))}
        onBlur={settleTyped}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            step(event.key === 'ArrowUp' ? 1 : -1);
          } else if (event.key === 'Enter') {
            // Settle the typed value; the popover's Save is a button, so Enter here must not submit.
            event.preventDefault();
            event.stopPropagation();
            settleTyped();
          }
        }}
        className="tw-h-full tw-min-w-0 tw-flex-1 tw-border-0 tw-bg-transparent tw-px-2.5 tw-font-body-default tw-text-text-default tw-outline-none"
      />
      <div className="tw-flex tw-h-full tw-w-4 tw-shrink-0 tw-flex-col tw-border-0 tw-border-l tw-border-solid tw-border-border-weak">
        {[
          { name: 'Increase', offset: 1, rotate: true },
          { name: 'Decrease', offset: -1, rotate: false },
        ].map(({ name, offset, rotate }) => (
          <button
            key={name}
            type="button"
            tabIndex={-1}
            aria-label={`${name} ${label.toLowerCase()}`}
            onClick={() => step(offset)}
            className="tw-flex tw-flex-1 tw-cursor-pointer tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 hover:tw-bg-interactive-hover"
          >
            <svg
              width="8"
              height="5"
              viewBox="0 0 8 5"
              aria-hidden
              className={cn('tw-fill-icon-default', rotate && 'tw-rotate-180')}
            >
              <path d="M0 0.5h8L4 4.5z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

type TimestampPickerProps = {
  /** The draft as a plain wall-clock date in the column's time zone, or null while nothing is chosen. */
  value: Date | null;
  onChange: (date: Date) => void;
  /** "UTC +5:30": shown beside the Time label. */
  utcOffset: string;
};

// The date-time body of the cell editor (design: Cell edit popover / Date-time): the month, a divider, then the time as
// two steppers and an AM/PM toggle. Every change commits to the draft at once; the popover's footer saves.
export function TimestampPicker({ value, onChange, utcOffset }: TimestampPickerProps) {
  // With nothing chosen the time shows the current one, and the first pick of a day or a time makes it a value.
  const [now] = useState(() => new Date());
  const shown = value ?? now;
  const { hour, period } = to12h(shown.getHours());

  const pickDay = (day: Date) =>
    onChange(new Date(day.getFullYear(), day.getMonth(), day.getDate(), shown.getHours(), shown.getMinutes()));
  const setHour = (next: number) => onChange(setTimeParts(shown, { hour24: to24h(next, period) }));
  const setMinute = (next: number) => onChange(setTimeParts(shown, { minute: next }));
  const setPeriod = (next: Period) => onChange(setTimeParts(shown, { hour24: to24h(hour, next) }));

  return (
    <div data-cy="cell-editor-timestamp" data-testid="cell-editor-timestamp">
      <div className="tw-flex tw-justify-center tw-px-3 tw-pb-2 tw-pt-3">
        <DatePickerCalendar
          value={value}
          onSelect={pickDay}
          minDate={MIN_DATE}
          maxDate={MAX_DATE}
          className="tw-w-[240px]"
        />
      </div>
      <Separator />
      <div className="tw-flex tw-flex-col tw-gap-2 tw-p-3">
        <div className="tw-flex tw-items-center">
          <span className="tw-font-body-default tw-font-medium tw-text-text-default">Time</span>
          <span className="tw-flex-1" />
          <span className="tw-font-body-small tw-text-text-placeholder">{utcOffset}</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <TimeStepper label="Hour" value={hour} min={1} max={12} onChange={setHour} data-cy="cell-editor-hour" />
          <span className="tw-font-body-default tw-font-medium tw-text-text-placeholder">:</span>
          <TimeStepper
            label="Minute"
            value={shown.getMinutes()}
            min={0}
            max={59}
            onChange={setMinute}
            data-cy="cell-editor-minute"
          />
          <ToggleGroup
            type="single"
            value={period}
            onValueChange={(next: string) => next && setPeriod(next as Period)}
            aria-label="AM or PM"
            className="tw-shrink-0"
          >
            {(['AM', 'PM'] as const).map((item) => (
              <ToggleGroupItem
                key={item}
                value={item}
                className="tw-text-text-disabled data-[state=on]:tw-text-text-default"
                data-cy={`cell-editor-${item.toLowerCase()}`}
              >
                {item}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
}
