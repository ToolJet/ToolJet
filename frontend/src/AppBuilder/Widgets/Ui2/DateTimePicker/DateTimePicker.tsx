import React, { useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { CalendarIcon, Clock } from 'lucide-react';
import { CONTROL, controlAria, fieldIdOf, FormField } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import {
  runNow,
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
import { useFocusEvents, useOverrides, usePickerPopup } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { ICON, TRIGGER, parseTimeArg, withRule } from '@/AppBuilder/Widgets/Ui2/_inputs/inputParts';
import type { Dayjs } from 'dayjs';
import type { StyleWithVars, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { pad2, toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';

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
  const { setExposedVariables, fireEvent, componentType, styles } = props;
  // setMinDate, setMaxDate and setDisabledDates change those properties until they change themselves.
  const [properties, override] = useOverrides(props.properties);
  const dateFormat =
    typeof properties.dateFormat === 'string' && properties.dateFormat.trim() ? properties.dateFormat : 'DD MMM YYYY';
  const use24 = M.is24h(properties.timeFormat);
  // One format shows the value and reads text written in it (a default, setValue, minDate): dayjs tokens, with a
  // date-fns format ('dd MMM yyyy') read as dayjs's ('DD MMM YYYY') for both, as in the Date picker.
  const dayFormat = M.toDayjsFormat(dateFormat);
  const displayFormat = `${dayFormat} ${use24 ? 'HH:mm' : 'h:mm A'}`;
  const step = M.minuteStep(properties.minuteStep, 5);
  const minDate = useStable(properties.minDate);
  const maxDate = useStable(properties.maxDate);
  const disabledDates = useStable(properties.disabledDates);
  const rules = useMemo(
    () => M.dateRules({ minDate, maxDate, disabledDates, format: dayFormat }),
    [minDate, maxDate, disabledDates, dayFormat]
  );
  // A new default value resets the value; a new display format only changes how it is shown (the default is read
  // with the format in force when the default itself changes).
  const formatRef = useLatest(displayFormat);
  const rawDefault = useStable(properties.defaultValue);
  const readDefault = () => M.parseDateTime(rawDefault, displayFormat)?.valueOf() ?? null;
  const [ts, setTs] = useState(readDefault);
  const [defaultRead, setDefaultRead] = useState(rawDefault);
  if (defaultRead !== rawDefault) {
    setDefaultRead(rawDefault);
    setTs(readDefault());
  }
  // The popup is open only while the picker takes choices (usePickerPopup): disabling, loading or hiding it closes it.
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popup = usePickerPopup(properties, triggerRef);
  const { open } = popup;
  const focus = useFocusEvents(fireEvent, () => check.touch());
  const date = ts === null ? null : dayjs(ts);
  const exposed = M.dateTimeExposed(date, displayFormat);
  const tsRef = useLatest(ts);
  const setDate = (v: unknown, format: unknown) => {
    const explicit = !isBlank(format) && typeof format === 'string';
    const d = M.parseDateTime(v, explicit ? M.toDayjsFormat(format) : formatRef.current, explicit);
    if (d || isBlank(v)) setTs(d ? d.valueOf() : null);
  };
  const blankArg = (v: unknown) => v === undefined || v === null || v === '';
  useExposed(setExposedVariables, properties, {
    ...exposed,
    label: toText(properties.label),
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
    ...M.dateBoundActions(override),
    setFocus: async () => triggerRef.current?.focus(),
    setBlur: async () => triggerRef.current?.blur(),
  });
  const commit = (next: number | null) => {
    if (next === ts) return;
    // Published (isValid too) before onSelect fires, so its handlers read the pick, as the text inputs do.
    runNow(() => {
      setTs(next);
      setExposedVariables(M.dateTimeExposed(next === null ? null : dayjs(next), displayFormat));
      fireEvent('onSelect');
    });
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
  // From the popup's time controls: nothing once the picker is off (an open popup can outlive a setDisable).
  const setTime = (minutes: number) => !popup.blocked && commit(M.atTime(baseDay(), minutes).valueOf());
  const minutes = date ? timeOf(date) : null;
  const hour = minutes === null ? null : Math.floor(minutes / 60);
  const minute = minutes === null ? null : minutes % 60;
  const pm = hour !== null && hour >= 12;
  // Each hour offers the minutes on the step from midnight, as the Time picker does.
  const minuteChoices = M.minuteOptions(step, hour ?? Math.floor(nowMinutes / 60));
  if (minute !== null && !minuteChoices.includes(minute)) minuteChoices.push(minute);
  minuteChoices.sort((a, b) => a - b);
  const hourOptions = use24
    ? Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: pad2(h) }))
    : [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h12) => ({ value: String(h12 % 12), label: pad2(h12) }));
  const disabledMatchers = M.dayMatchers(rules);
  const shown = date ? M.safeFormat(date, displayFormat) : '';
  const vars = lookVars(componentType, styles);
  return (
    <FormField props={props} properties={properties} check={check} innerRef={fit}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next && popup.blocked) return;
          popup.setOpen(next);
          focus.opened(next);
          if (!next) check.touch();
        }}
      >
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
              !shown && 'tw-text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]'
            )}
          >
            <CalendarIcon className={ICON} />
            <span className="tw-truncate">{shown || toText(properties.placeholder)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Choose a date and time" className="tw-w-auto tw-p-0" align="start" style={vars}>
          <Calendar
            autoFocus
            mode="single"
            selected={date ? date.toDate() : undefined}
            defaultMonth={date ? date.toDate() : rules.min && now.isBefore(rules.min) ? rules.min.toDate() : undefined}
            startMonth={rules.min ? rules.min.toDate() : undefined}
            endMonth={rules.max ? rules.max.toDate() : undefined}
            disabled={disabledMatchers}
            onSelect={(day) => {
              if (!day || popup.blocked) return;
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
              onChange={(h) => {
                const next = (Number(h) % 24) + (!use24 && pm ? 12 : 0);
                setTime(next * 60 + M.minuteInHour(step, next, minute));
              }}
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
                        const next = h + (label === 'PM' ? 12 : 0);
                        setTime(next * 60 + M.minuteInHour(step, next, base % 60));
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
    </FormField>
  );
};

export default withControlState(ShadDateTimePicker);
