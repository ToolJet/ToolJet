import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { CONTROL, Field } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { useExposed, useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button, Popover, PopoverContent, PopoverTrigger, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import * as M from '@/AppBuilder/Widgets/Ui2/_inputs/dateModel';
import { isBlank } from '@/AppBuilder/Widgets/Ui2/_inputs/inputsModel';
import { useFocusEvents, useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { ICON, TRIGGER, pad2, parseTimeArg, text, withRule } from '@/AppBuilder/Widgets/Ui2/_inputs/inputParts';
import type { TimeBounds } from '@/AppBuilder/Widgets/Ui2/_inputs/dateModel';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// ---- Time picker ---------------------------------------------------------------------------------------------------

const OPTION =
  'flex h-8 w-full shrink-0 items-center justify-center rounded-md border-0 p-0 text-sm tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-40';

export const OPTION_IDLE = 'hover:bg-accent hover:text-accent-foreground';

export const OPTION_ON = 'bg-primary text-primary-foreground hover:bg-primary';

/** A scrolling column of options (hours, minutes, AM/PM) that opens scrolled to its selected option. */
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

export const OptionColumn = ({ label, options, className }: OptionColumnProps) => {
  const ref = useRef<HTMLDivElement>(null);
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
      className={cn('relative flex h-56 w-16 flex-col gap-1 overflow-y-auto p-1', className)}
    >
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="option"
          aria-selected={o.selected}
          data-selected={o.selected || undefined}
          disabled={o.disabled}
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
  const mins = M.minuteOptions(step);
  const hour = minutes === null ? null : Math.floor(minutes / 60);
  const minute = minutes === null ? null : minutes % 60;
  const pm = hour !== null ? hour >= 12 : bounds.lo >= 720;
  const fits = (h: number) => mins.some((m) => M.inTimeRange(h * 60 + m, bounds));
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
        onClick: () => pickAt(h, minute ?? mins.find((m) => M.inTimeRange(h * 60 + m, bounds)) ?? 0),
      })),
    },
    {
      label: 'Minutes',
      options: mins.map((m) => ({
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
            pickAt(h, minute ?? 0);
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
  const { setExposedVariables, fireEvent, id, componentType, styles } = props;
  // setMinTime and setMaxTime change those properties until they change themselves.
  const [properties, override] = useOverrides(props.properties);
  const use24 = M.is24h(properties.timeFormat);
  const step = M.minuteStep(properties.minuteStep, 15);
  const bounds = M.timeBounds(properties.minTime, properties.maxTime);
  const initial = M.parseTime(properties.defaultValue);
  const [minutes, setMinutes] = useState(initial);
  useEffect(() => setMinutes(initial), [initial]);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focus = useFocusEvents(fireEvent);
  const exposed = (m: number | null) => ({ value: M.toHHmm(m), formattedValue: M.formatTime(m, use24) });
  const setTime = (t: unknown, format: unknown) => {
    const m = parseTimeArg(t, format);
    if (m !== null || isBlank(t)) setMinutes(m);
  };
  useExposed(setExposedVariables, properties, {
    ...exposed(minutes),
    label: text(properties.label),
    timeFormat: use24 ? '24h' : '12h',
    minTime: M.toHHmm(bounds.lo),
    maxTime: M.toHHmm(bounds.hi),
    setValue: async (t: unknown, format: unknown) => setTime(t, format),
    clearValue: async () => setMinutes(null),
    setMinTime: async (t: unknown) => override('minTime', text(t)),
    setMaxTime: async (t: unknown) => override('maxTime', text(t)),
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
    setOpen(next);
    focus.opened(next);
    if (!next) check.touch();
  };
  const disabled = busy(properties);
  const shown = M.formatTime(minutes, use24);
  const listMode = properties.pickerStyle === 'list';
  return (
    <Shell {...props} innerRef={fit}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <Popover open={open} onOpenChange={openChange}>
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              id={`shad-${id}`}
              variant="outline"
              disabled={disabled}
              aria-invalid={!!check.error || undefined}
              {...focus.handlers}
              className={cn(
                TRIGGER,
                CONTROL,
                'tabular-nums',
                !shown && 'text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]'
              )}
            >
              <Clock className={ICON} />
              {shown || text(properties.placeholder)}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            style={lookVars(componentType, styles)}
            className={listMode ? 'w-[var(--radix-popover-trigger-width)] min-w-[9rem] p-0' : 'w-auto p-0'}
          >
            {listMode ? (
              <OptionColumn
                label="Times"
                className="h-auto max-h-64 w-full"
                options={M.timeSlots(step, properties.minTime, properties.maxTime).map((t) => ({
                  key: t,
                  label: M.formatTime(t, use24),
                  selected: t === minutes,
                  onClick: () => pick(t, true),
                }))}
              />
            ) : (
              <div className="flex divide-x divide-[color:var(--sc-border)]">
                {timeColumns({ minutes, use24, step, bounds, onPick: (m) => pick(m) }).map((col) => (
                  <OptionColumn key={col.label} label={col.label} options={col.options} />
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </Field>
    </Shell>
  );
};

export default withControlState(ShadTimePicker);
