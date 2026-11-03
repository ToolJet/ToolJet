import React, { useEffect, useRef } from 'react';
import { cn } from './cn';
import { parseTime, toTime } from './calendar';

// Hour / minute (/ AM-PM) columns, like shadcn's time picker. Value is 24h 'HH:mm'.
export const TimeColumns = ({
  value,
  format,
  minuteStep,
  onChange,
  isDisabled,
}: {
  value: string;
  format: string;
  minuteStep: number;
  onChange: (next: string) => void;
  isDisabled?: (time: string) => boolean;
}) => {
  const t = parseTime(value) ?? { h: -1, m: -1 };
  const twelve = format !== '24h';
  const step = Math.max(1, Math.min(30, Math.round(minuteStep) || 5));
  const hours = twelve ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step);
  const pm = t.h >= 12;
  const shownHour = twelve ? (t.h % 12 === 0 ? 12 : t.h % 12) : t.h;
  const to24 = (h: number, isPm: boolean) => (twelve ? (h % 12) + (isPm ? 12 : 0) : h);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelectorAll('.is-selected').forEach((el) => el.scrollIntoView({ block: 'center' }));
  }, []);

  const cell = (label: string, selected: boolean, next: string, key: string | number) => (
    <button
      key={key}
      type="button"
      className={cn('ui-time-cell', selected && 'is-selected')}
      disabled={isDisabled?.(next)}
      onClick={() => onChange(next)}
    >
      {label}
    </button>
  );

  return (
    <div className="ui-time-columns" ref={ref}>
      <div className="ui-time-col">
        {hours.map((h) => cell(String(h).padStart(2, '0'), h === shownHour, toTime(to24(h, pm), Math.max(0, t.m)), h))}
      </div>
      <div className="ui-time-col">
        {minutes.map((m) => cell(String(m).padStart(2, '0'), m === t.m, toTime(Math.max(0, t.h), m), m))}
      </div>
      {twelve ? (
        <div className="ui-time-col">
          {cell('AM', t.h >= 0 && !pm, toTime(to24(Math.max(1, shownHour), false), Math.max(0, t.m)), 'am')}
          {cell('PM', pm, toTime(to24(Math.max(1, shownHour), true), Math.max(0, t.m)), 'pm')}
        </div>
      ) : null}
    </div>
  );
};
