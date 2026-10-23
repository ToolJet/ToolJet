import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { CalendarDays } from 'lucide-react';
import { Field } from '../lib/Field';
import { usePortalContainer } from '../lib/usePortalContainer';
import { dateProblem, dateRules, formatDate, isOffDay, parseDateTime, startOfDay, toDay, toDayjsFormat, ymd } from '../lib/ui2/choice/dates';
import { fieldVars, lookVars, useFocusEvents, useResetOn, useStable } from '../lib/ui2/choice/looks';
import { useBusy, useFieldStyles } from '../lib/ui2/choice/fieldStyles';
import { MonthGrid } from '../lib/ui2/choice/MonthGrid';
import { PickerTrigger } from '../lib/ui2/choice/PickerField';
import { FieldLoading } from '../lib/ui2/loading/look';
import '../styles/ui2-choice.css';

// UI 2.0's Date picker (Ui2/DatePicker/DatePicker.tsx) on the pack's CSS: a popover calendar for one date or a range,
// a display format, min and max dates, disabled dates, a clear button, and the native date pickers' exposed values
// and actions.

type Range = { from?: Date; to?: Date };
type Selection = Date | Range | undefined;

const endOf = (sel: Selection, end: 'from' | 'to'): Date | undefined => (sel instanceof Date ? undefined : sel?.[end]);
const dayOf = (sel: Selection): Date | undefined => (sel instanceof Date ? sel : undefined);
const blank = (v: unknown) => v === undefined || v === null || v === '';
const unix = (d: Date | undefined) => (d ? d.getTime() : null);

export const DatePicker = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: 'Date' });
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [mode] = ToolJet.useStateEnumeration({
    name: 'mode',
    label: 'Mode',
    enumDefinition: ['single', 'range'],
    enumLabels: { single: 'Single', range: 'Range' },
    initialValue: 'single',
    inspector: 'switch',
  });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: 'Pick a date' });
  const [defaultValue] = ToolJet.useStateString({ name: 'defaultValue', label: 'Default (YYYY-MM-DD, or [start, end] for a range)', initialValue: '' });
  const [formatProp] = ToolJet.useStateString({ name: 'format', label: 'Display format', initialValue: 'DD MMM YYYY' });
  const [minDate, setMinDate] = ToolJet.useStateString({ name: 'minDate', label: 'Earliest date (YYYY-MM-DD)', initialValue: '' });
  const [maxDate, setMaxDate] = ToolJet.useStateString({ name: 'maxDate', label: 'Latest date (YYYY-MM-DD)', initialValue: '' });
  const [disabledDates, setDisabledDates] = ToolJet.useStateArray({ name: 'disabledDates', label: 'Disabled dates', initialValue: [] });
  const [showClearBtn] = ToolJet.useStateBoolean({ name: 'showClearBtn', label: 'Show clear button', initialValue: false });
  // Exposed values. `value` was the pack's default date: an app that set it still starts on it.
  const [legacyValue, setValue] = ToolJet.useStateString({ name: 'value', initialValue: '', inspector: 'hidden' });
  const [, setStartDate] = ToolJet.useStateString({ name: 'startDate', initialValue: '', inspector: 'hidden' });
  const [, setEndDate] = ToolJet.useStateString({ name: 'endDate', initialValue: '', inspector: 'hidden' });
  const [, setUnixTimestamp] = ToolJet.useStateNumber({ name: 'unixTimestamp', initialValue: null as unknown as number, inspector: 'hidden' });
  const [, setDisplayValue] = ToolJet.useStateString({ name: 'displayValue', initialValue: '', inspector: 'hidden' });
  const [, setStartDateInUnix] = ToolJet.useStateNumber({ name: 'startDateInUnix', initialValue: null as unknown as number, inspector: 'hidden' });
  const [, setEndDateInUnix] = ToolJet.useStateNumber({ name: 'endDateInUnix', initialValue: null as unknown as number, inspector: 'hidden' });
  const [, setSelectedDateRange] = ToolJet.useStateString({ name: 'selectedDateRange', initialValue: '', inspector: 'hidden' });
  const [, setDateFormat] = ToolJet.useStateString({ name: 'dateFormat', initialValue: 'DD MMM YYYY', inspector: 'hidden' });
  const [disabledProp] = ToolJet.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onSelect = ToolJet.useEventCallback({ name: 'onSelect' });
  const onFocus = ToolJet.useEventCallback({ name: 'onFocus' });
  const onBlur = ToolJet.useEventCallback({ name: 'onBlur' });
  const styles = useFieldStyles();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 7 });
  const { disabled, loading } = useBusy(disabledProp);
  const fieldId = ToolJet.useFieldId();

  const [anchorRef, container] = usePortalContainer();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const range = mode === 'range';
  const format = toDayjsFormat(formatProp) || 'DD MMM YYYY';
  const stableDisabled = useStable(disabledDates);
  const rules = useMemo(() => dateRules({ minDate, maxDate, disabledDates: stableDisabled, format }), [minDate, maxDate, stableDisabled, format]);

  // A default value or mode resets the selection. Both ends given together are put in order.
  const readDefault = (): Selection => {
    const raw = blank(defaultValue) || (Array.isArray(defaultValue) && !defaultValue.length) ? legacyValue : defaultValue;
    if (!range) return toDay(raw, format);
    const pair = Array.isArray(raw) ? raw : [raw];
    const from = toDay(pair[0], format);
    const to = toDay(pair[1], format);
    return from && to && to < from ? { from: to, to: from } : { from, to };
  };
  const [selected, setSelected] = useState<Selection>(readDefault);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  useResetOn([defaultValue, mode], () => commit(readDefault()));
  const [open, setOpen] = useState(false);
  const shown = (d: Date | undefined) => (d ? formatDate(d, format) : '');

  // What the widget exposes: value, plus the native date pickers' unixTimestamp and displayValue, or a range's
  // startDate, endDate, startDateInUnix, endDateInUnix and selectedDateRange.
  const expose = (sel: Selection) => {
    const from = endOf(sel, 'from');
    const to = endOf(sel, 'to');
    if (range) {
      setValue([ymd(from), ymd(to)] as unknown as string);
      setStartDate(ymd(from));
      setEndDate(ymd(to));
      setStartDateInUnix(unix(from) as number);
      setEndDateInUnix(unix(to) as number);
      setSelectedDateRange(from ? `${shown(from)}${to ? ` – ${shown(to)}` : ''}` : '');
    } else {
      setValue(ymd(dayOf(sel)));
      setStartDate('');
      setEndDate('');
      setUnixTimestamp(unix(dayOf(sel)) as number);
      setDisplayValue(shown(dayOf(sel)));
    }
  };
  useEffect(() => {
    expose(selected);
    setDateFormat(format);
  }, [selected, format, range]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next: Selection, fire = false) => {
    selectedRef.current = next;
    setSelected(next);
    expose(next);
    if (fire) onSelect();
  };
  // A date from an action's argument: read with the format given, else the display format, else ISO.
  const parse = (v: unknown, fmt: unknown) => {
    const explicit = typeof fmt === 'string' && !!fmt.trim();
    const d = parseDateTime(v, explicit ? toDayjsFormat(fmt) : format, explicit);
    return d ? startOfDay(d) : undefined;
  };
  const setEnd = (end: 'from' | 'to', v: unknown, fmt: unknown) => {
    if (!range) return;
    const d = parse(v, fmt);
    if (d || blank(v)) commit({ ...((selectedRef.current as Range) || {}), [end]: d });
  };
  const singleSet = (v: unknown, fmt: unknown) => {
    if (range) return;
    const d = parse(v, fmt);
    if (d || blank(v)) commit(d);
  };
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }, { handle: 'format', displayName: 'Format' }] }, singleSet);
  ToolJet.useAction({ name: 'clearValue', displayName: 'Clear value' }, () => commit(range ? {} : undefined));
  ToolJet.useAction({ name: 'setValueInTimestamp', displayName: 'Set value in timestamp', params: [{ handle: 'value', displayName: 'Value' }] }, (ts) => {
    const n = Number(ts);
    if (!range && !blank(ts) && Number.isFinite(n)) commit(startOfDay(new Date(n)));
  });
  ToolJet.useAction({ name: 'setStartDate', displayName: 'Set start date', params: [{ handle: 'value', displayName: 'Value' }, { handle: 'format', displayName: 'Format' }] }, (v, f) => setEnd('from', v, f));
  ToolJet.useAction({ name: 'setEndDate', displayName: 'Set end date', params: [{ handle: 'value', displayName: 'Value' }, { handle: 'format', displayName: 'Format' }] }, (v, f) => setEnd('to', v, f));
  ToolJet.useAction(
    {
      name: 'setDateRange',
      displayName: 'Set date range',
      params: [{ handle: 'startDate', displayName: 'Start date' }, { handle: 'endDate', displayName: 'End date' }, { handle: 'format', displayName: 'Format' }],
    },
    (a, b, f) => {
      if (!range) return;
      const from = parse(a, f);
      const to = parse(b, f);
      if ((from || blank(a)) && (to || blank(b))) commit(from && to && to < from ? { from: to, to: from } : { from, to });
    }
  );
  ToolJet.useAction({ name: 'clearStartDate', displayName: 'Clear start date' }, () => {
    if (range) commit({ ...((selectedRef.current as Range) || {}), from: undefined });
  });
  ToolJet.useAction({ name: 'clearEndDate', displayName: 'Clear end date' }, () => {
    if (range) commit({ ...((selectedRef.current as Range) || {}), to: undefined });
  });
  ToolJet.useAction({ name: 'clearDateRange', displayName: 'Clear date range' }, () => {
    if (range) commit({});
  });
  ToolJet.useAction({ name: 'setMinDate', displayName: 'Set min date', params: [{ handle: 'value', displayName: 'Value' }] }, (v) => setMinDate(blank(v) ? '' : String(v)));
  ToolJet.useAction({ name: 'setMaxDate', displayName: 'Set max date', params: [{ handle: 'value', displayName: 'Value' }] }, (v) => setMaxDate(blank(v) ? '' : String(v)));
  ToolJet.useAction({ name: 'setDisabledDates', displayName: 'Set disabled dates', params: [{ handle: 'value', displayName: 'Value' }] }, (v) =>
    setDisabledDates(Array.isArray(v) ? v : blank(v) ? [] : [v])
  );
  ToolJet.useAction({ name: 'clearDisabledDates', displayName: 'Clear disabled dates' }, () => setDisabledDates([]));
  ToolJet.useAction({ name: 'setFocus', displayName: 'Set focus' }, () => triggerRef.current?.focus());
  ToolJet.useAction({ name: 'setBlur', displayName: 'Set blur' }, () => {
    setOpen(false);
    triggerRef.current?.blur();
  });
  // The pack's earlier names.
  ToolJet.useAction({ name: 'setDate', displayName: 'Set date', params: [{ handle: 'date', displayName: 'Date (YYYY-MM-DD)' }] }, (v) => singleSet(v, ''));
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => commit(range ? {} : undefined));

  const from = endOf(selected, 'from');
  const to = endOf(selected, 'to');
  const day = dayOf(selected);
  // A picked day outside minDate/maxDate or on a disabled date is invalid, and so is a range ending before it starts.
  const problem = range
    ? dateProblem(from, rules) || dateProblem(to, rules) || (from && to && to < from ? 'Pick an end date on or after the start date' : '')
    : dateProblem(day, rules);
  const filled = range ? !!from && !!to : !!day;
  const check = ToolJet.useValidation({ section: 'date', value: range ? (filled ? [ymd(from), ymd(to)] : '') : ymd(day), present: filled && !problem });
  const focus = useFocusEvents(onFocus, onBlur, check.touch);
  const text = range ? (from ? `${shown(from)}${to ? ` – ${shown(to)}` : ''}` : '') : shown(day);
  const rangeClicks = useRef(0);
  const [month, setMonth] = useState<Date>(() => (range ? from : day) ?? rules.min ?? new Date());
  const openChange = (next: boolean) => {
    if (next && disabled) return;
    if (next) {
      rangeClicks.current = 0;
      setMonth((range ? from : day) ?? (rules.min && rules.min > new Date() ? rules.min : new Date()));
    }
    setOpen(next);
    focus.opened(next);
    if (!next) check.touch();
  };
  const pick = (d: Date) => {
    if (range) {
      const current = (selectedRef.current as Range) || {};
      // The first click sets both ends to that day; the second sets the other end and closes.
      let next: Range;
      if (rangeClicks.current === 0 || !current.from) next = { from: d, to: d };
      else next = d < current.from ? { from: d, to: current.to ?? current.from } : { from: current.from, to: d };
      commit(next, true);
      rangeClicks.current += 1;
      if (rangeClicks.current >= 2) openChange(false);
    } else {
      commit(d, true);
      openChange(false);
    }
  };
  const clearable = showClearBtn === true && !!text && !disabled;
  const vars = lookVars(fieldVars(styles));

  return (
    <div className="ui uc" ref={anchorRef} style={vars}>
      <Field label={label} description={description} htmlFor={fieldId} error={check.error || problem} required={check.required}>
        <FieldLoading loading={loading}>
          <Popover.Root open={open} onOpenChange={openChange}>
            <PickerTrigger
              ref={triggerRef}
              icon={<CalendarDays className="uc-picker-icon" />}
              text={text}
              placeholder={placeholder}
              disabled={disabled}
              loading={loading}
              clearable={clearable}
              onClear={() => {
                commit(range ? {} : undefined, true);
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
                <Popover.Content aria-label={range ? 'Choose dates' : 'Choose a date'} className="ui-popup uc-pop" align="start" sideOffset={4} style={vars}>
                  <MonthGrid
                    autoFocus
                    month={month}
                    numberOfMonths={range ? 2 : 1}
                    onMonthChange={setMonth}
                    onPick={pick}
                    isSelected={(iso) => (range ? iso === ymd(from) || iso === ymd(to) : iso === ymd(day))}
                    rangeStart={range ? ymd(from) : undefined}
                    rangeEnd={range ? ymd(to) : undefined}
                    isDisabled={(d) => isOffDay(d, rules)}
                    startMonth={rules.min}
                    endMonth={rules.max}
                  />
                </Popover.Content>
              </Popover.Portal>
            ) : null}
          </Popover.Root>
        </FieldLoading>
      </Field>
    </div>
  );
};
