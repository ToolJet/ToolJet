import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { CONTROL, controlAria, fieldIdOf, FormField } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { useExposed, useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button, Popover, PopoverContent, PopoverTrigger, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import * as M from '@/AppBuilder/Widgets/Ui2/_inputs/dateModel';
import { isBlank } from '@/AppBuilder/Widgets/Ui2/_inputs/inputsModel';
import { useFocusEvents, useOverrides, usePickerPopup } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { ICON, TRIGGER, parseTimeArg, withRule } from '@/AppBuilder/Widgets/Ui2/_inputs/inputParts';
import type { TimeBounds } from '@/AppBuilder/Widgets/Ui2/_inputs/dateModel';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { pad2, toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';

// ---- Time picker ---------------------------------------------------------------------------------------------------

const OPTION =
  'tw-flex tw-h-8 tw-w-full tw-shrink-0 tw-items-center tw-justify-center tw-rounded-ui2-md tw-border-0 tw-p-0 tw-text-ui2-sm tw-tabular-nums tw-transition-colors disabled:tw-pointer-events-none disabled:tw-opacity-40';

export const OPTION_IDLE = 'hover:tw-bg-ui2-accent hover:tw-text-ui2-accent-foreground';

export const OPTION_ON = 'tw-bg-ui2-primary tw-text-ui2-primary-foreground hover:tw-bg-ui2-primary';

/** One option of an OptionColumn. */
export interface ColumnOption {
  key: string | number;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export interface OptionColumnProps {
  label: string;
  options: ColumnOption[];
  className?: string;
}

const COLUMN_KEYS: Record<string, (i: number, n: number) => number> = {
  ArrowDown: (i, n) => Math.min(i + 1, n - 1),
  ArrowUp: (i) => Math.max(i - 1, 0),
  Home: () => 0,
  End: (_i, n) => n - 1,
};

/** Arrow keys, Home and End move focus between a column's enabled options. */
const onColumnKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
  const move = COLUMN_KEYS[e.key];
  if (!move) return;
  const enabled = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)'));
  if (!enabled.length) return;
  e.preventDefault();
  enabled[move(enabled.indexOf(e.target as HTMLButtonElement), enabled.length)].focus();
};

/**
 * A scrolling column of options (hours, minutes, AM/PM) that opens scrolled to its selected option. One option per
 * column is in the tab order (the selected one, else the first enabled), so Tab moves between columns.
 */
export const OptionColumn = ({ label, options, className }: OptionColumnProps) => {
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
      onKeyDown={onColumnKey}
      className={cn('tw-relative tw-flex tw-h-56 tw-w-16 tw-flex-col tw-gap-1 tw-overflow-y-auto tw-p-1', className)}
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
          className={cn(OPTION, o.selected ? OPTION_ON : OPTION_IDLE)}
          onClick={o.onClick}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};

/** The hour, minute and AM/PM columns for a time (minutes since midnight, or null), within bounds. */
export interface TimeColumnsInput {
  minutes: number | null;
  use24: boolean;
  step: unknown;
  bounds: TimeBounds;
  onPick: (minutes: number) => void;
}

export const timeColumns = ({
  minutes,
  use24,
  step,
  bounds,
  onPick,
}: TimeColumnsInput): { label: string; options: ColumnOption[] }[] => {
  const hour = minutes === null ? null : Math.floor(minutes / 60);
  const minute = minutes === null ? null : minutes % 60;
  const pm = hour !== null ? hour >= 12 : bounds.lo >= 720;
  // Each hour offers the minutes on the step from midnight (M.minuteOptions), as the list of times does.
  const inRange = (h: number) => M.minuteOptions(step, h).filter((m) => M.inTimeRange(h * 60 + m, bounds));
  const fits = (h: number) => inRange(h).length > 0;
  const pickAt = (h: number, m: number) => onPick(M.clampTime(h * 60 + m, bounds));
  const hours = use24
    ? Array.from({ length: 24 }, (_, h) => ({ h, label: pad2(h) }))
    : [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h12) => ({ h: (h12 % 12) + (pm ? 12 : 0), label: pad2(h12) }));
  const baseHour = hour ?? Math.floor(bounds.lo / 60);
  const columns: { label: string; options: ColumnOption[] }[] = [
    {
      label: 'Hours',
      options: hours.map(({ h, label }) => ({
        key: `h${h}`,
        label,
        selected: h === hour,
        disabled: !fits(h),
        onClick: () => pickAt(h, minute !== null && inRange(h).includes(minute) ? minute : inRange(h)[0] ?? 0),
      })),
    },
    {
      label: 'Minutes',
      options: M.minuteOptions(step, baseHour).map((m) => ({
        key: `m${m}`,
        label: pad2(m),
        selected: m === minute,
        disabled: !M.inTimeRange(baseHour * 60 + m, bounds),
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
            pickAt(h, M.minuteInHour(step, h, minute));
          },
        };
      }),
    });
  }
  return columns;
};

export const ShadTimePicker = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { setExposedVariables, fireEvent, componentType, styles } = props;
  // setMinTime and setMaxTime change those properties until they change themselves.
  const [properties, override] = useOverrides(props.properties);
  const use24 = M.is24h(properties.timeFormat);
  const step = M.minuteStep(properties.minuteStep, 15);
  const bounds = M.timeBounds(properties.minTime, properties.maxTime);
  const initial = M.parseTime(properties.defaultValue);
  const [minutes, setMinutes] = useState(initial);
  useEffect(() => setMinutes(initial), [initial]);
  // The popup is open only while the picker takes choices (usePickerPopup): disabling, loading or hiding it closes it.
  const popup = usePickerPopup(properties);
  const { open } = popup;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focus = useFocusEvents(fireEvent);
  const exposed = (m: number | null) => ({ value: M.toHHmm(m), formattedValue: M.formatTime(m, use24) });
  const setTime = (t: unknown, format: unknown) => {
    const m = parseTimeArg(t, format);
    if (m !== null || isBlank(t)) setMinutes(m);
  };
  useExposed(setExposedVariables, properties, {
    ...exposed(minutes),
    label: toText(properties.label),
    timeFormat: use24 ? '24h' : '12h',
    minTime: M.toHHmm(bounds.lo),
    maxTime: M.toHHmm(bounds.hi),
    setValue: async (t: unknown, format: unknown) => setTime(t, format),
    clearValue: async () => setMinutes(null),
    setMinTime: async (t: unknown) => override('minTime', toText(t)),
    setMaxTime: async (t: unknown) => override('maxTime', toText(t)),
    setFocus: async () => triggerRef.current?.focus(),
    setBlur: async () => triggerRef.current?.blur(),
  });
  const pick = (m: number | null, close = false) => {
    if (close) openChange(false);
    if (m === minutes) return;
    setMinutes(m);
    setExposedVariables(exposed(m));
    fireEvent('onSelect');
  };
  const check = useValidation(
    withRule(props, (v) => {
      const m = M.parseTime(v);
      return m !== null && !M.inTimeRange(m, bounds)
        ? `Pick a time between ${M.formatTime(bounds.lo, use24)} and ${M.formatTime(bounds.hi, use24)}`
        : '';
    }),
    M.toHHmm(minutes),
    () => pick(null)
  );
  // Every close (Escape, a click outside, a pick from the list) goes through here, so a close after a pick also marks
  // the field touched and lets the focus tracking fire onBlur once focus leaves.
  const openChange = (next: boolean) => {
    if (next && popup.blocked) return;
    popup.setOpen(next);
    focus.opened(next);
    if (!next) check.touch();
  };
  const disabled = busy(properties);
  const shown = M.formatTime(minutes, use24);
  const listMode = properties.pickerStyle === 'list';
  return (
    <FormField props={props} properties={properties} check={check} innerRef={fit}>
      <Popover open={open} onOpenChange={openChange}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            id={fieldIdOf(props)}
            variant="outline"
            disabled={disabled}
            {...controlAria(props, check.error)}
            {...focus.handlers}
            className={cn(
              TRIGGER,
              CONTROL,
              'tw-tabular-nums',
              !shown && 'tw-text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]'
            )}
          >
            <Clock className={ICON} />
            {shown || toText(properties.placeholder)}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          aria-label="Choose a time"
          align="start"
          style={lookVars(componentType, styles)}
          className={listMode ? 'tw-w-[var(--radix-popover-trigger-width)] tw-min-w-[9rem] tw-p-0' : 'tw-w-auto tw-p-0'}
        >
          {listMode ? (
            <OptionColumn
              label="Times"
              className="tw-h-auto tw-max-h-64 tw-w-full"
              options={M.timeSlots(step, properties.minTime, properties.maxTime).map((t) => ({
                key: t,
                label: M.formatTime(t, use24),
                selected: t === minutes,
                onClick: () => !popup.blocked && pick(t, true),
              }))}
            />
          ) : (
            <div className="tw-flex tw-divide-x tw-divide-[color:var(--sc-border)]">
              {timeColumns({ minutes, use24, step, bounds, onPick: (m) => !popup.blocked && pick(m) }).map((col) => (
                <OptionColumn key={col.label} label={col.label} options={col.options} />
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </FormField>
  );
};

export default withControlState(ShadTimePicker);
