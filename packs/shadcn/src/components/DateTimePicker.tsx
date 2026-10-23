import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { CalendarDays, Clock } from 'lucide-react';
import { Field } from '../lib/Field';
import { usePortalContainer } from '../lib/usePortalContainer';
import { cn } from '../lib/cn';
import {
  atTime,
  dateProblem,
  dateRules,
  formatDate,
  formatTime,
  is24h,
  isOffDay,
  minuteInHour,
  minuteOptions,
  minuteStep,
  pad2,
  parseDateTime,
  parseTimeArg,
  safeFormat,
  startOfDay,
  toDayjsFormat,
  ymd,
} from '../lib/ui2/choice/dates';
import { lookVars, pickerVars, useFocusEvents, useResetOn, useStable } from '../lib/ui2/choice/looks';
import { useBusy, useFieldStyles, usePopoverStyles } from '../lib/ui2/choice/fieldStyles';
import { MonthGrid } from '../lib/ui2/choice/MonthGrid';
import { PickerTrigger } from '../lib/ui2/choice/PickerField';
import { TimeSelect } from '../lib/ui2/choice/TimeParts';
import { FieldLoading } from '../lib/ui2/loading/look';
import '../styles/ui2-choice.css';

// UI 2.0's Date and time picker (Ui2/DateTimePicker/DateTimePicker.tsx) on the pack's CSS: a calendar with a time row
// (hour, minute, AM/PM; a time every minuteStep minutes from midnight). value is 'YYYY-MM-DDTHH:mm' in local time,
// selectedDate 'YYYY-MM-DD', selectedTime 'HH:mm', unixTimestamp in ms and displayValue in dateFormat plus the time.
export const DateTimePicker = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: 'Date and time' });
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: 'Pick a date and time' });
  const [defaultValue] = ToolJet.useStateString({ name: 'defaultValue', label: 'Default value (YYYY-MM-DD HH:mm)', initialValue: '' });
  const [dateFormatProp] = ToolJet.useStateString({ name: 'dateFormat', label: 'Date display format', initialValue: 'DD MMM YYYY' });
  const [timeFormat] = ToolJet.useStateEnumeration({
    name: 'timeFormat',
    label: 'Time format',
    enumDefinition: ['12h', '24h'],
    enumLabels: { '12h': '12h', '24h': '24h' },
    initialValue: '12h',
    inspector: 'switch',
  });
  const [minuteStepProp] = ToolJet.useStateNumber({ name: 'minuteStep', label: 'Minute step', initialValue: 5 });
  const [minDate, setMinDate] = ToolJet.useStateString({ name: 'minDate', label: 'Earliest date (YYYY-MM-DD)', initialValue: '' });
  const [maxDate, setMaxDate] = ToolJet.useStateString({ name: 'maxDate', label: 'Latest date (YYYY-MM-DD)', initialValue: '' });
  const [disabledDates, setDisabledDates] = ToolJet.useStateArray({ name: 'disabledDates', label: 'Disabled dates', initialValue: [] });
  const [showClearBtn] = ToolJet.useStateBoolean({ name: 'showClearBtn', label: 'Show clear button', initialValue: false });
  // Exposed values. `value` was the pack's default value: an app that set it still starts on it.
  const [legacyValue, setValue] = ToolJet.useStateString({ name: 'value', initialValue: '', inspector: 'hidden' });
  const [, setSelectedDate] = ToolJet.useStateString({ name: 'selectedDate', initialValue: '', inspector: 'hidden' });
  const [, setSelectedTime] = ToolJet.useStateString({ name: 'selectedTime', initialValue: '', inspector: 'hidden' });
  const [, setUnixTimestamp] = ToolJet.useStateNumber({ name: 'unixTimestamp', initialValue: null as unknown as number, inspector: 'hidden' });
  const [, setDisplayValue] = ToolJet.useStateString({ name: 'displayValue', initialValue: '', inspector: 'hidden' });
  const [disabledProp] = ToolJet.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onSelect = ToolJet.useEventCallback({ name: 'onSelect' });
  const onFocus = ToolJet.useEventCallback({ name: 'onFocus' });
  const onBlur = ToolJet.useEventCallback({ name: 'onBlur' });
  const styles = useFieldStyles();
  const popoverStyles = usePopoverStyles('Calendar icon color');
  ToolJet.useComponentSettings({ defaultWidth: 12, defaultHeight: 7 });
  const { disabled, loading } = useBusy(disabledProp);
  const fieldId = ToolJet.useFieldId();

  const [anchorRef, container] = usePortalContainer();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const use24 = is24h(timeFormat);
  // One format shows the value and reads text written in it (a default, setValue, minDate).
  const dayFormat = toDayjsFormat(dateFormatProp) || 'DD MMM YYYY';
  const displayFormat = `${dayFormat} ${use24 ? 'HH:mm' : 'h:mm A'}`;
  const step = minuteStep(minuteStepProp, 5);
  const stableDisabled = useStable(disabledDates);
  const rules = useMemo(() => dateRules({ minDate, maxDate, disabledDates: stableDisabled, format: dayFormat }), [minDate, maxDate, stableDisabled, dayFormat]);
  const readDefault = () => parseDateTime(defaultValue === '' || defaultValue == null ? legacyValue : defaultValue, displayFormat)?.getTime() ?? null;
  const [ts, setTs] = useState<number | null>(readDefault);
  const tsRef = useRef(ts);
  tsRef.current = ts;
  // A pick of a time the clocks skip on its day: the value stays and the field says so until it changes.
  const [skipped, setSkipped] = useState<{ day: Date; text: string } | null>(null);
  useResetOn(defaultValue, () => {
    setSkipped(null);
    setTs(parseDateTime(defaultValue, displayFormat)?.getTime() ?? null);
  });
  const [open, setOpen] = useState(false);
  const date = ts === null ? null : new Date(ts);

  const expose = (d: Date | null) => {
    setValue(d ? formatDate(d, 'YYYY-MM-DD[T]HH:mm') : '');
    setSelectedDate(d ? ymd(d) : '');
    setSelectedTime(d ? formatDate(d, 'HH:mm') : '');
    setUnixTimestamp((d ? d.getTime() : null) as number);
    setDisplayValue(d ? safeFormat(d, displayFormat) : '');
  };
  useEffect(() => expose(date), [ts, displayFormat]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next: number | null) => {
    setSkipped(null);
    if (next === ts) return;
    setTs(next);
    expose(next === null ? null : new Date(next));
    onSelect();
  };
  const setDate = (v: unknown, format: unknown) => {
    const explicit = typeof format === 'string' && !!format.trim();
    const d = parseDateTime(v, explicit ? toDayjsFormat(format) : displayFormat, explicit);
    if (d || v === '' || v === null || v === undefined) {
      setSkipped(null);
      setTs(d ? d.getTime() : null);
    }
  };
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }, { handle: 'format', displayName: 'Format' }] }, setDate);
  ToolJet.useAction({ name: 'setValueInTimestamp', displayName: 'Set value in timestamp', params: [{ handle: 'value', displayName: 'Value' }] }, (v) => {
    const n = Number(v);
    if (v !== '' && v !== null && v !== undefined && Number.isFinite(n)) setTs(n);
  });
  // setTime keeps the day (today when none is picked) and sets the time of day.
  ToolJet.useAction({ name: 'setTime', displayName: 'Set time', params: [{ handle: 'value', displayName: 'Value' }, { handle: 'format', displayName: 'Format' }] }, (v, f) => {
    const m = parseTimeArg(v, f);
    if (m === null) return;
    const day = tsRef.current === null ? startOfDay(new Date()) : new Date(tsRef.current);
    const next = atTime(day, m);
    if (next) setTs(next.getTime());
  });
  ToolJet.useAction({ name: 'clearValue', displayName: 'Clear value' }, () => setTs(null));
  ToolJet.useAction({ name: 'setMinDate', displayName: 'Set min date', params: [{ handle: 'value', displayName: 'Value' }] }, (v) => setMinDate(v ? String(v) : ''));
  ToolJet.useAction({ name: 'setMaxDate', displayName: 'Set max date', params: [{ handle: 'value', displayName: 'Value' }] }, (v) => setMaxDate(v ? String(v) : ''));
  ToolJet.useAction({ name: 'setDisabledDates', displayName: 'Set disabled dates', params: [{ handle: 'value', displayName: 'Value' }] }, (v) =>
    setDisabledDates(Array.isArray(v) ? v : v === undefined || v === null || v === '' ? [] : [v])
  );
  ToolJet.useAction({ name: 'clearDisabledDates', displayName: 'Clear disabled dates' }, () => setDisabledDates([]));
  ToolJet.useAction({ name: 'setFocus', displayName: 'Set focus' }, () => triggerRef.current?.focus());
  ToolJet.useAction({ name: 'setBlur', displayName: 'Set blur' }, () => {
    setOpen(false);
    triggerRef.current?.blur();
  });

  const problem = skipped ? `The clocks skip ${skipped.text} in this time zone. Pick another time.` : dateProblem(date, rules);
  const check = ToolJet.useValidation({ section: 'date', value: date ? formatDate(date, 'YYYY-MM-DD[T]HH:mm') : '', present: !!date && !problem });
  const focus = useFocusEvents(onFocus, onBlur, check.touch);
  const now = new Date();
  const nowMinutes = Math.floor((now.getHours() * 60 + now.getMinutes()) / step) * step;
  const timeOf = (d: Date | null) => (d ? d.getHours() * 60 + d.getMinutes() : nowMinutes);
  // Changing the time before picking a day uses today (or the first allowed day).
  const baseDay = () => {
    if (skipped) return skipped.day;
    if (date) return startOfDay(date);
    const today = startOfDay(now);
    return !dateProblem(today, rules) ? today : rules.min ?? today;
  };
  const pickAt = (day: Date, m: number) => {
    const next = atTime(day, m);
    if (next) return commit(next.getTime());
    setSkipped({ day: startOfDay(day), text: `${formatDate(day, dayFormat)} ${formatTime(m, use24)}` });
    check.touch();
  };
  const setTime = (m: number) => pickAt(baseDay(), m);
  const minutes = date ? timeOf(date) : null;
  const hour = minutes === null ? null : Math.floor(minutes / 60);
  const minute = minutes === null ? null : minutes % 60;
  const pm = hour !== null && hour >= 12;
  // Each hour offers the minutes on the step from midnight, as the Time picker does.
  const minuteChoices = minuteOptions(step, hour ?? Math.floor(nowMinutes / 60));
  if (minute !== null && !minuteChoices.includes(minute)) minuteChoices.push(minute);
  minuteChoices.sort((a, b) => a - b);
  const hourOptions = use24
    ? Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: pad2(h) }))
    : [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h12) => ({ value: String(h12 % 12), label: pad2(h12) }));
  const [month, setMonth] = useState<Date>(() => date ?? new Date());
  const openChange = (next: boolean) => {
    if (next && disabled) return;
    if (next) setMonth(date ?? (rules.min && now < rules.min ? rules.min : now));
    setOpen(next);
    focus.opened(next);
    if (!next) check.touch();
  };
  const shown = date ? safeFormat(date, displayFormat) : '';
  const clearable = showClearBtn === true && !!shown && !disabled;
  const vars = lookVars(pickerVars({ ...styles, ...popoverStyles }));

  return (
    <div className="ui uc" ref={anchorRef} style={vars}>
      <Field label={label} description={description} htmlFor={fieldId} error={check.error || problem} required={check.required}>
        <FieldLoading loading={loading}>
          <Popover.Root open={open} onOpenChange={openChange}>
            <PickerTrigger
              ref={triggerRef}
              icon={<CalendarDays className="uc-picker-icon" />}
              text={shown}
              placeholder={placeholder}
              disabled={disabled}
              loading={loading}
              clearable={clearable}
              onClear={() => {
                commit(null);
                check.touch();
                triggerRef.current?.focus();
              }}
              fieldId={fieldId}
              error={check.error || problem}
              required={check.required}
              hasNote={!!description}
              label={label}
              focusHandlers={focus.handlers}
            />
            {container ? (
              <Popover.Portal container={container}>
                <Popover.Content aria-label="Choose a date and time" className="ui-popup uc-pop" align="start" sideOffset={4} style={vars}>
                  <MonthGrid
                    autoFocus
                    month={month}
                    onMonthChange={setMonth}
                    onPick={(day) => pickAt(day, timeOf(date))}
                    isSelected={(iso) => !!date && iso === ymd(date)}
                    isDisabled={(d) => isOffDay(d, rules)}
                    startMonth={rules.min}
                    endMonth={rules.max}
                  />
                  <div className="uc-time-row">
                    <Clock size={16} aria-hidden="true" />
                    <span className="uc-time-row-label">Time</span>
                    <TimeSelect
                      label="Hour"
                      container={container}
                      style={vars}
                      value={hour === null ? '' : String(use24 ? hour : hour % 12)}
                      options={hourOptions}
                      onChange={(h) => {
                        const next = (Number(h) % 24) + (!use24 && pm ? 12 : 0);
                        setTime(next * 60 + minuteInHour(step, next, minute));
                      }}
                    />
                    <span className="uc-time-row-label" style={{ marginRight: 0 }}>
                      :
                    </span>
                    <TimeSelect
                      label="Minute"
                      container={container}
                      style={vars}
                      value={minute === null ? '' : String(minute)}
                      options={minuteChoices.map((m) => ({ value: String(m), label: pad2(m) }))}
                      onChange={(m) => setTime((hour ?? Math.floor(nowMinutes / 60)) * 60 + Number(m))}
                    />
                    {!use24 ? (
                      <div className="uc-ampm" role="group" aria-label="AM or PM">
                        {['AM', 'PM'].map((half) => {
                          const on = hour !== null && pm === (half === 'PM');
                          return (
                            <button
                              key={half}
                              type="button"
                              aria-pressed={on}
                              className={cn(on && 'is-on')}
                              onClick={() => {
                                const base = minutes ?? nowMinutes;
                                const h = (Math.floor(base / 60) % 12) + (half === 'PM' ? 12 : 0);
                                setTime(h * 60 + minuteInHour(step, h, base % 60));
                              }}
                            >
                              {half}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </Popover.Content>
              </Popover.Portal>
            ) : null}
          </Popover.Root>
        </FieldLoading>
      </Field>
    </div>
  );
};
