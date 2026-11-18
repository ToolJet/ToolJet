import React, { useLayoutEffect, useRef } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../cn';
import { clampTime, inTimeRange, minuteInHour, minuteOptions, pad2, type TimeBounds } from './dates';

// UI 2.0's time pieces (Ui2/TimePicker/TimePicker.tsx, Ui2/DateTimePicker/DateTimePicker.tsx): scrolling hour, minute
// and AM/PM columns, a single list of times, and the small selects of the date and time picker's time row.

export interface ColumnOption {
  key: string | number;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const COLUMN_KEYS: Record<string, (i: number, n: number) => number> = {
  ArrowDown: (i, n) => Math.min(i + 1, n - 1),
  ArrowUp: (i) => Math.max(i - 1, 0),
  Home: () => 0,
  End: (_i, n) => n - 1,
};

/** A scrolling column of options that opens scrolled to its selected one; one option per column is in the tab order,
 *  so Tab moves between columns and arrow keys within one. */
export const OptionColumn = ({ label, options, list }: { label: string; options: ColumnOption[]; list?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const tabbable = options.find((o) => o.selected && !o.disabled) ?? options.find((o) => !o.disabled);
  useLayoutEffect(() => {
    const col = ref.current;
    const selected = col?.querySelector<HTMLElement>('[data-selected="true"]');
    if (col && selected) col.scrollTop = selected.offsetTop - col.clientHeight / 2 + selected.clientHeight / 2;
  }, []);
  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      className={cn('uc-col', list && 'is-list')}
      onKeyDown={(e) => {
        const move = COLUMN_KEYS[e.key];
        if (!move) return;
        const enabled = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)'));
        if (!enabled.length) return;
        e.preventDefault();
        enabled[move(enabled.indexOf(e.target as HTMLButtonElement), enabled.length)].focus();
      }}
    >
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="option"
          aria-selected={o.selected}
          data-selected={o.selected || undefined}
          disabled={o.disabled}
          tabIndex={o === tabbable ? 0 : -1}
          className={cn('uc-col-opt', o.selected && 'is-on')}
          onClick={o.onClick}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};

/** The hour, minute and AM/PM columns for a time (minutes since midnight, or null), within bounds. */
export const timeColumns = ({
  minutes,
  use24,
  step,
  bounds,
  onPick,
}: {
  minutes: number | null;
  use24: boolean;
  step: unknown;
  bounds: TimeBounds;
  onPick: (minutes: number) => void;
}): { label: string; options: ColumnOption[] }[] => {
  const hour = minutes === null ? null : Math.floor(minutes / 60);
  const minute = minutes === null ? null : minutes % 60;
  const pm = hour !== null ? hour >= 12 : bounds.lo >= 720;
  const inRange = (h: number) => minuteOptions(step, h).filter((m) => inTimeRange(h * 60 + m, bounds));
  const pickAt = (h: number, m: number) => onPick(clampTime(h * 60 + m, bounds));
  const hours = use24
    ? Array.from({ length: 24 }, (_, h) => ({ h, label: pad2(h) }))
    : [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h12) => ({ h: (h12 % 12) + (pm ? 12 : 0), label: pad2(h12) }));
  const baseHour = hour ?? Math.floor(bounds.lo / 60);
  const columns = [
    {
      label: 'Hours',
      options: hours.map(({ h, label }) => ({
        key: `h${h}`,
        label,
        selected: h === hour,
        disabled: inRange(h).length === 0,
        onClick: () => pickAt(h, minute !== null && inRange(h).includes(minute) ? minute : inRange(h)[0] ?? 0),
      })),
    },
    {
      label: 'Minutes',
      options: minuteOptions(step, baseHour).map((m) => ({
        key: `m${m}`,
        label: pad2(m),
        selected: m === minute,
        disabled: !inTimeRange(baseHour * 60 + m, bounds),
        onClick: () => pickAt(baseHour, m),
      })),
    },
  ];
  if (!use24) {
    const half = (isPm: boolean) => {
      const from = isPm ? 720 : 0;
      return bounds.hi >= from && bounds.lo <= from + 719;
    };
    columns.push({
      label: 'AM or PM',
      options: ['AM', 'PM'].map((label) => {
        const isPm = label === 'PM';
        return {
          key: label,
          label,
          selected: hour !== null && pm === isPm,
          disabled: !half(isPm),
          onClick: () => {
            const h = hour === null ? (isPm ? 12 : 0) : (hour % 12) + (isPm ? 12 : 0);
            pickAt(h, minuteInHour(step, h, minute));
          },
        };
      }),
    });
  }
  return columns;
};

/** A small select of the date and time picker's time row (hour or minute). */
export const TimeSelect = ({
  label,
  value,
  options,
  onChange,
  container,
  style,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  container: HTMLElement | null;
  style?: React.CSSProperties;
}) => (
  <SelectPrimitive.Root value={value} onValueChange={onChange}>
    <SelectPrimitive.Trigger aria-label={label} className="ui-select-trigger uc-small-select">
      <SelectPrimitive.Value placeholder="--" />
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="ui-icon-muted" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    {container ? (
      <SelectPrimitive.Portal container={container}>
        <SelectPrimitive.Content className="ui-popup ui-menu uc-select-menu uc-small-menu" position="popper" sideOffset={4} style={style}>
          <SelectPrimitive.Viewport>
            {options.map((o) => (
              <SelectPrimitive.Item key={o.value} value={o.value} className="ui-menu-item ui-menu-item--plain">
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    ) : null}
  </SelectPrimitive.Root>
);
