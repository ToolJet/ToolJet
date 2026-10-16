import React, { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { CalendarIcon } from 'lucide-react';
import { list, useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button, Calendar, Popover, PopoverContent, PopoverTrigger, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { toDate, ymd } from '@/AppBuilder/Widgets/Ui2/_actions/calendarModel';
import { dateProblem, dateRules, parseDateTime, toDayjsFormat } from '@/AppBuilder/Widgets/Ui2/_inputs/dateModel';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { textArg, useFocusEvents, useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { CONTROL, Field } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import type { DateRange } from 'react-day-picker';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

/** The picked day (single mode) or range (a cleared range is {}). */
type Selection = Date | Partial<DateRange> | undefined;

/** One end of a range selection; undefined for a single day (as reading `.from` off a Date gave). */
const endOf = (sel: Selection, end: 'from' | 'to'): Date | undefined => (sel instanceof Date ? undefined : sel?.[end]);

/** The day of a single-mode selection. */
const dayOf = (sel: Selection): Date | undefined => (sel instanceof Date ? sel : undefined);

export const ShadDatePicker = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { setExposedVariables, fireEvent, id } = props;
  // setMinDate, setMaxDate and setDisabledDates change those properties until they change themselves.
  const [properties, override] = useOverrides(props.properties);
  const range = properties.mode === 'range';
  // Only text formats and valid dates: dayjs throws on a non-text format, and the calendar on an invalid date.
  const format: string =
    typeof properties.format === 'string' && properties.format.trim()
      ? toDayjsFormat(properties.format)
      : 'DD MMM YYYY';
  const rulesKey = stringify([
    properties.minDate ?? null,
    properties.maxDate ?? null,
    properties.disabledDates ?? null,
  ]);
  const rules = useMemo(
    () =>
      dateRules({
        minDate: properties.minDate,
        maxDate: properties.maxDate,
        disabledDates: properties.disabledDates,
        format,
      }),
    [rulesKey, format] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const raw = properties.defaultValue;
  const initial = range ? { from: toDate(list(raw)[0]), to: toDate(list(raw)[1]) } : toDate(raw);
  const [selected, setSelected] = useState<Selection>(initial);
  useEffect(() => setSelected(initial), [stringify(raw ?? null), range]); // eslint-disable-line react-hooks/exhaustive-deps
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focus = useFocusEvents(fireEvent);
  const shown = (d: Date | undefined) => (d ? dayjs(d).format(format) : '');
  const unix = (d: Date | undefined) => (d ? dayjs(d).valueOf() : null);
  // What the widget exposes for a selection: value, plus the native date pickers' unixTimestamp and displayValue, or a
  // range's startDate, endDate, startDateInUnix, endDateInUnix and selectedDateRange.
  const exposedOf = (sel: Selection) => {
    const from = endOf(sel, 'from');
    const to = endOf(sel, 'to');
    return range
      ? {
          value: [ymd(from), ymd(to)],
          startDate: ymd(from),
          endDate: ymd(to),
          startDateInUnix: unix(from),
          endDateInUnix: unix(to),
          selectedDateRange: from ? `${shown(from)}${to ? ` – ${shown(to)}` : ''}` : '',
        }
      : {
          value: ymd(dayOf(sel)),
          startDate: '',
          endDate: '',
          unixTimestamp: unix(dayOf(sel)),
          displayValue: shown(dayOf(sel)),
        };
  };
  const commit = (next: Selection, fire = false) => {
    selectedRef.current = next;
    setSelected(next);
    setExposedVariables(exposedOf(next));
    if (fire) fireEvent('onSelect');
  };
  // A date from an action's argument, read with the format given (the native setters take one), else the display
  // format, else ISO; undefined when it is not a date.
  const latest = useRef({ range, format });
  latest.current = { range, format };
  const parse = (v: unknown, fmt: unknown) => {
    const formats = typeof fmt === 'string' && fmt.trim() ? toDayjsFormat(fmt) : latest.current.format;
    const d = parseDateTime(v, formats);
    return d ? d.startOf('day').toDate() : undefined;
  };
  const blank = (v: unknown) => v === undefined || v === null || v === '';
  const setSingle = (v: unknown, fmt: unknown) => {
    if (latest.current.range) return;
    const d = parse(v, fmt);
    if (d || blank(v)) commit(d);
  };
  const setEnd = (end: 'from' | 'to', v: unknown, fmt: unknown) => {
    if (!latest.current.range) return;
    const d = parse(v, fmt);
    if (d || blank(v)) commit({ ...(selectedRef.current || {}), [end]: d });
  };
  useExposed(setExposedVariables, properties, {
    ...exposedOf(selected),
    label: String(properties.label ?? ''),
    dateFormat: format,
    minDate: rules.min ? rules.min.format('YYYY-MM-DD') : '',
    maxDate: rules.max ? rules.max.format('YYYY-MM-DD') : '',
    clearValue: async () => commit(latest.current.range ? {} : undefined),
    setValue: async (v: unknown, fmt: unknown) => setSingle(v, fmt),
    setValueInTimestamp: async (ts: unknown) => {
      const n = Number(ts);
      if (!latest.current.range && ts !== '' && ts !== null && Number.isFinite(n)) commit(toDate(new Date(n)));
    },
    setStartDate: async (v: unknown, fmt: unknown) => setEnd('from', v, fmt),
    setEndDate: async (v: unknown, fmt: unknown) => setEnd('to', v, fmt),
    setDateRange: async (a: unknown, b: unknown, fmt: unknown) => {
      if (!latest.current.range) return;
      const from = parse(a, fmt);
      const to = parse(b, fmt);
      if ((from || blank(a)) && (to || blank(b)))
        commit(from && to && to < from ? { from: to, to: from } : { from, to });
    },
    clearStartDate: async () => latest.current.range && commit({ ...(selectedRef.current || {}), from: undefined }),
    clearEndDate: async () => latest.current.range && commit({ ...(selectedRef.current || {}), to: undefined }),
    clearDateRange: async () => latest.current.range && commit({}),
    setMinDate: async (v: unknown) => override('minDate', textArg(v)),
    setMaxDate: async (v: unknown) => override('maxDate', textArg(v)),
    setDisabledDates: async (v: unknown) => override('disabledDates', Array.isArray(v) ? v : blank(v) ? [] : [v]),
    clearDisabledDates: async () => override('disabledDates', []),
    setFocus: async () => triggerRef.current?.focus(),
    setBlur: async () => triggerRef.current?.blur(),
  });
  // A picked day outside minDate/maxDate or on a disabled date fails validation; a range counts as filled once both
  // ends are picked.
  const values = exposedOf(selected);
  const from = endOf(selected, 'from');
  const to = endOf(selected, 'to');
  const day = dayOf(selected);
  const problem = range
    ? dateProblem(from ? dayjs(from) : null, rules) || dateProblem(to ? dayjs(to) : null, rules)
    : dateProblem(day ? dayjs(day) : null, rules);
  const check = useValidation(
    {
      ...props,
      validate: (v: unknown) =>
        problem
          ? { isValid: false, validationError: problem }
          : typeof props.validate === 'function'
          ? props.validate(v)
          : { isValid: true },
    },
    range ? (values.startDate && values.endDate ? values.value : '') : values.value,
    () => commit(range ? {} : undefined)
  );
  const disabledMatchers = [
    ...(rules.min ? [{ before: rules.min.toDate() }] : []),
    ...(rules.max ? [{ after: rules.max.toDate() }] : []),
    ...rules.disabled.map((d) => dayjs(d).toDate()),
  ];
  const text = range ? (from ? `${shown(from)}${to ? ` – ${shown(to)}` : ''}` : '') : shown(day);
  // Every close (Escape, a click outside, a completed pick) goes through here, so a close after a pick also marks the
  // field touched for validation and lets the focus tracking fire onBlur once focus leaves.
  const rangeClicks = useRef(0);
  const openChange = (next: boolean) => {
    if (next) rangeClicks.current = 0;
    setOpen(next);
    focus.opened(next);
    if (!next) check.touch();
  };
  const pick = (next: Selection) => {
    commit(next, true);
    // A range's first click already sets both ends to that day: it closes on the second click.
    rangeClicks.current += 1;
    if (!range || rangeClicks.current >= 2) openChange(false);
  };
  // What both calendars (single and range) take.
  const calendar = {
    numberOfMonths: range ? 2 : 1,
    defaultMonth: (range ? from : day) ?? (rules.min ? rules.min.toDate() : undefined),
    startMonth: rules.min ? rules.min.toDate() : undefined,
    endMonth: rules.max ? rules.max.toDate() : undefined,
    disabled: disabledMatchers,
  };
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
              disabled={busy(properties)}
              {...focus.handlers}
              className={cn(
                'w-full justify-start text-left font-normal',
                CONTROL,
                !text && 'text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]'
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {text || String(properties.placeholder ?? '')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" style={lookVars(props.componentType, props.styles)}>
            {range ? (
              <Calendar {...calendar} mode="range" selected={{ from, to }} onSelect={pick} />
            ) : (
              <Calendar {...calendar} mode="single" selected={day} onSelect={pick} />
            )}
          </PopoverContent>
        </Popover>
      </Field>
    </Shell>
  );
};

export default withControlState(ShadDatePicker);
