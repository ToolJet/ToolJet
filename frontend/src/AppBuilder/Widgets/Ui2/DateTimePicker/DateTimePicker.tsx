import React, { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { CalendarIcon, Clock } from 'lucide-react';
import { CONTROL, Field } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import {
  useAutoHeight,
  useExposed,
  useLatest,
  useStable,
  withControlState,
} from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import * as M from '@/AppBuilder/Widgets/Ui2/_inputs/dateModel';
import { isBlank } from '@/AppBuilder/Widgets/Ui2/_inputs/inputsModel';
import { useFocusEvents, useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { ICON, TRIGGER, pad2, parseTimeArg, text, withRule } from '@/AppBuilder/Widgets/Ui2/_inputs/inputParts';
import type { Dayjs } from 'dayjs';
import type { StyleWithVars, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// ---- Date and time picker ------------------------------------------------------------------------------------------

const SMALL_SELECT =
  'tw-h-8 tw-w-[4.25rem] tw-gap-1 tw-px-2 tw-tabular-nums tw-text-[color:var(--sc-popover-foreground)] tw-border-[color:var(--sc-input)]';

export interface TimeSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string; disabled?: boolean }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  style?: StyleWithVars;
}

export const TimeSelect = ({ label, value, options, onChange, disabled, style }: TimeSelectProps) => (
  <Select value={value} onValueChange={onChange} disabled={disabled}>
    <SelectTrigger aria-label={label} className={SMALL_SELECT}>
      <SelectValue placeholder="--" />
    </SelectTrigger>
    <SelectContent className="tw-max-h-60" style={style}>
      {options.map((o) => (
        <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export const ShadDateTimePicker = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { setExposedVariables, fireEvent, id, componentType, styles } = props;
  // setMinDate, setMaxDate and setDisabledDates change those properties until they change themselves.
  const [properties, override] = useOverrides(props.properties);
  const dateFormat =
    typeof properties.dateFormat === 'string' && properties.dateFormat.trim() ? properties.dateFormat : 'DD MMM YYYY';
  const use24 = M.is24h(properties.timeFormat);
  const displayFormat = `${dateFormat} ${use24 ? 'HH:mm' : 'h:mm A'}`;
  const step = M.minuteStep(properties.minuteStep, 5);
  const minDate = useStable(properties.minDate);
  const maxDate = useStable(properties.maxDate);
  const disabledDates = useStable(properties.disabledDates);
  const rules = useMemo(
    () => M.dateRules({ minDate, maxDate, disabledDates, format: dateFormat }),
    [minDate, maxDate, disabledDates, dateFormat]
  );
  const initial = M.parseDateTime(properties.defaultValue, displayFormat)?.valueOf() ?? null;
  const [ts, setTs] = useState(initial);
  useEffect(() => setTs(initial), [initial]);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focus = useFocusEvents(fireEvent);
  const date = ts === null ? null : dayjs(ts);
  const exposed = M.dateTimeExposed(date, displayFormat);
  const tsRef = useLatest(ts);
  const formatRef = useLatest(displayFormat);
  const setDate = (v: unknown, format: unknown) => {
    const d = M.parseDateTime(
      v,
      isBlank(format) || typeof format !== 'string' ? formatRef.current : M.toDayjsFormat(format)
    );
    if (d || isBlank(v)) setTs(d ? d.valueOf() : null);
  };
  const blankArg = (v: unknown) => v === undefined || v === null || v === '';
  useExposed(setExposedVariables, properties, {
    ...exposed,
    label: text(properties.label),
    dateFormat,
    timeFormat: use24 ? '24h' : '12h',
    minDate: rules.min ? rules.min.format('YYYY-MM-DD') : '',
    maxDate: rules.max ? rules.max.format('YYYY-MM-DD') : '',
    setValue: async (v: unknown, format: unknown) => setDate(v, format),
    setValueInTimestamp: async (v: unknown) => {
      const n = Number(v);
      if (!blankArg(v) && typeof v !== 'boolean' && Number.isFinite(n) && dayjs(n).isValid()) setTs(n);
    },
    // setTime keeps the day (today when none is picked) and sets the time of day.
    setTime: async (v: unknown, format: unknown) => {
      const m = parseTimeArg(v, format);
      if (m === null) return;
      const day = tsRef.current === null ? dayjs().startOf('day') : dayjs(tsRef.current);
      setTs(M.atTime(day, m).valueOf());
    },
    clearValue: async () => setTs(null),
    setMinDate: async (v: unknown) => override('minDate', text(v)),
    setMaxDate: async (v: unknown) => override('maxDate', text(v)),
    setDisabledDates: async (v: unknown) => override('disabledDates', Array.isArray(v) ? v : blankArg(v) ? [] : [v]),
    clearDisabledDates: async () => override('disabledDates', []),
    setFocus: async () => triggerRef.current?.focus(),
    setBlur: async () => triggerRef.current?.blur(),
  });
  const commit = (next: number | null) => {
    if (next === ts) return;
    setTs(next);
    setExposedVariables(M.dateTimeExposed(next === null ? null : dayjs(next), displayFormat));
    fireEvent('onSelect');
  };
  const check = useValidation(
    withRule(props, () => M.dateProblem(date, rules)),
    exposed.value,
    () => commit(null)
  );
  const disabled = busy(properties);
  const now = dayjs();
  const nowMinutes = Math.floor((now.hour() * 60 + now.minute()) / step) * step;
  const timeOf = (d: Dayjs | null) => (d ? d.hour() * 60 + d.minute() : nowMinutes);
  // Changing the time before picking a day uses today (or the first allowed day).
  const baseDay = () => {
    if (date) return date;
    const today = now.startOf('day');
    if (!M.dateProblem(today, rules)) return today;
    return rules.min ?? today;
  };
  const setTime = (minutes: number) => commit(M.atTime(baseDay(), minutes).valueOf());
  const minutes = date ? timeOf(date) : null;
  const hour = minutes === null ? null : Math.floor(minutes / 60);
  const minute = minutes === null ? null : minutes % 60;
  const pm = hour !== null && hour >= 12;
  const minuteChoices = M.minuteOptions(step);
  if (minute !== null && !minuteChoices.includes(minute)) minuteChoices.push(minute);
  minuteChoices.sort((a, b) => a - b);
  const hourOptions = use24
    ? Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: pad2(h) }))
    : [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h12) => ({ value: String(h12 % 12), label: pad2(h12) }));
  const disabledMatchers = [
    ...(rules.min ? [{ before: rules.min.toDate() }] : []),
    ...(rules.max ? [{ after: rules.max.toDate() }] : []),
    ...rules.disabled.map((d) => dayjs(d).toDate()),
  ];
  const shown = date ? M.safeFormat(date, displayFormat) : '';
  const vars = lookVars(componentType, styles);
  return (
    <Shell {...props} innerRef={fit}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            focus.opened(next);
            if (!next) check.touch();
          }}
        >
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
                !shown && 'tw-text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]'
              )}
            >
              <CalendarIcon className={ICON} />
              <span className="tw-truncate">{shown || text(properties.placeholder)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="tw-w-auto tw-p-0" align="start" style={vars}>
            <Calendar
              mode="single"
              selected={date ? date.toDate() : undefined}
              defaultMonth={
                date ? date.toDate() : rules.min && now.isBefore(rules.min) ? rules.min.toDate() : undefined
              }
              startMonth={rules.min ? rules.min.toDate() : undefined}
              endMonth={rules.max ? rules.max.toDate() : undefined}
              disabled={disabledMatchers}
              onSelect={(day) => {
                if (!day) return;
                commit(M.atTime(dayjs(day), timeOf(date)).valueOf());
              }}
            />
            <div className="tw-flex tw-items-center tw-gap-2 tw-border-t tw-px-3 tw-py-2.5">
              <Clock className="tw-h-4 tw-w-4 tw-shrink-0 tw-text-ui2-muted-foreground" />
              <span className="tw-mr-auto tw-text-ui2-sm tw-text-ui2-muted-foreground">Time</span>
              <TimeSelect
                label="Hour"
                style={vars}
                value={hour === null ? '' : String(use24 ? hour : hour % 12)}
                options={hourOptions}
                onChange={(h) => setTime(((Number(h) % 24) + (!use24 && pm ? 12 : 0)) * 60 + (minute ?? 0))}
              />
              <span className="tw-text-ui2-sm tw-text-ui2-muted-foreground">:</span>
              <TimeSelect
                label="Minute"
                style={vars}
                value={minute === null ? '' : String(minute)}
                options={minuteChoices.map((m) => ({ value: String(m), label: pad2(m) }))}
                onChange={(m) => setTime((hour ?? Math.floor(nowMinutes / 60)) * 60 + Number(m))}
              />
              {!use24 ? (
                <div
                  className="tw-ml-1 tw-flex tw-rounded-ui2-md tw-border tw-border-[color:var(--sc-input)] tw-p-0.5"
                  role="group"
                  aria-label="AM or PM"
                >
                  {['AM', 'PM'].map((label) => {
                    const on = hour !== null && pm === (label === 'PM');
                    return (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={on}
                        className={cn(
                          'tw-h-6 tw-rounded-ui2-sm tw-border-0 tw-px-1.5 tw-text-xs tw-font-medium tw-transition-colors',
                          on
                            ? 'tw-bg-ui2-primary tw-text-ui2-primary-foreground'
                            : 'tw-text-ui2-muted-foreground hover:tw-bg-ui2-accent'
                        )}
                        onClick={() => {
                          const base = minutes ?? nowMinutes;
                          const h = Math.floor(base / 60) % 12;
                          setTime((h + (label === 'PM' ? 12 : 0)) * 60 + (base % 60));
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
      </Field>
    </Shell>
  );
};

export default withControlState(ShadDateTimePicker);
