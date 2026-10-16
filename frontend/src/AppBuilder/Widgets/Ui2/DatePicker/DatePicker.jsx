import React, { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { CalendarIcon } from 'lucide-react';
import { list, useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button, Calendar, Popover, PopoverContent, PopoverTrigger, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { toDate, ymd } from '@/AppBuilder/Widgets/Ui2/_actions/actionsModel';
import { dateProblem, dateRules, parseDateTime, toDayjsFormat } from '@/AppBuilder/Widgets/Ui2/_inputs/inputsModel';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { textArg, useFocusEvents, useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { CONTROL, Field } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';

export const ShadDatePicker = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const { setExposedVariables, fireEvent, id } = props;
  // setMinDate, setMaxDate and setDisabledDates change those properties until they change themselves.
  const [properties, override] = useOverrides(props.properties);
  const range = properties.mode === 'range';
  // Only text formats and valid dates: dayjs throws on a non-text format, and the calendar on an invalid date.
  const format =
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
  const [selected, setSelected] = useState(initial);
  useEffect(() => setSelected(initial), [stringify(raw ?? null), range]); // eslint-disable-line react-hooks/exhaustive-deps
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const focus = useFocusEvents(fireEvent);
  const shown = (d) => (d ? dayjs(d).format(format) : '');
  const unix = (d) => (d ? dayjs(d).valueOf() : null);
  // What the widget exposes for a selection: value, plus the native date pickers' unixTimestamp and displayValue, or a
  // range's startDate, endDate, startDateInUnix, endDateInUnix and selectedDateRange.
  const exposedOf = (sel) =>
    range
      ? {
          value: [ymd(sel?.from), ymd(sel?.to)],
          startDate: ymd(sel?.from),
          endDate: ymd(sel?.to),
          startDateInUnix: unix(sel?.from),
          endDateInUnix: unix(sel?.to),
          selectedDateRange: sel?.from ? `${shown(sel.from)}${sel.to ? ` – ${shown(sel.to)}` : ''}` : '',
        }
      : {
          value: ymd(sel),
          startDate: '',
          endDate: '',
          unixTimestamp: unix(sel),
          displayValue: shown(sel),
        };
  const commit = (next, fire = false) => {
    selectedRef.current = next;
    setSelected(next);
    setExposedVariables(exposedOf(next));
    if (fire) fireEvent('onSelect');
  };
  // A date from an action's argument, read with the format given (the native setters take one), else the display
  // format, else ISO; undefined when it is not a date.
  const latest = useRef(null);
  latest.current = { range, format };
  const parse = (v, fmt) => {
    const formats = typeof fmt === 'string' && fmt.trim() ? toDayjsFormat(fmt) : latest.current.format;
    const d = parseDateTime(v, formats);
    return d ? d.startOf('day').toDate() : undefined;
  };
  const blank = (v) => v === undefined || v === null || v === '';
  const setSingle = (v, fmt) => {
    if (latest.current.range) return;
    const d = parse(v, fmt);
    if (d || blank(v)) commit(d);
  };
  const setEnd = (end, v, fmt) => {
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
    setValue: async (v, fmt) => setSingle(v, fmt),
    setValueInTimestamp: async (ts) => {
      const n = Number(ts);
      if (!latest.current.range && ts !== '' && ts !== null && Number.isFinite(n)) commit(toDate(new Date(n)));
    },
    setStartDate: async (v, fmt) => setEnd('from', v, fmt),
    setEndDate: async (v, fmt) => setEnd('to', v, fmt),
    setDateRange: async (a, b, fmt) => {
      if (!latest.current.range) return;
      const from = parse(a, fmt);
      const to = parse(b, fmt);
      if ((from || blank(a)) && (to || blank(b)))
        commit(from && to && to < from ? { from: to, to: from } : { from, to });
    },
    clearStartDate: async () => latest.current.range && commit({ ...(selectedRef.current || {}), from: undefined }),
    clearEndDate: async () => latest.current.range && commit({ ...(selectedRef.current || {}), to: undefined }),
    clearDateRange: async () => latest.current.range && commit({}),
    setMinDate: async (v) => override('minDate', textArg(v)),
    setMaxDate: async (v) => override('maxDate', textArg(v)),
    setDisabledDates: async (v) => override('disabledDates', Array.isArray(v) ? v : blank(v) ? [] : [v]),
    clearDisabledDates: async () => override('disabledDates', []),
    setFocus: async () => triggerRef.current?.focus(),
    setBlur: async () => triggerRef.current?.blur(),
  });
  // A picked day outside minDate/maxDate or on a disabled date fails validation; a range counts as filled once both
  // ends are picked.
  const values = exposedOf(selected);
  const problem = range
    ? dateProblem(selected?.from ? dayjs(selected.from) : null, rules) ||
      dateProblem(selected?.to ? dayjs(selected.to) : null, rules)
    : dateProblem(selected ? dayjs(selected) : null, rules);
  const check = useValidation(
    {
      ...props,
      validate: (v) =>
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
  const text = range
    ? selected?.from
      ? `${shown(selected.from)}${selected.to ? ` – ${shown(selected.to)}` : ''}`
      : ''
    : shown(selected);
  // Every close (Escape, a click outside, a completed pick) goes through here, so a close after a pick also marks the
  // field touched for validation and lets the focus tracking fire onBlur once focus leaves.
  const rangeClicks = useRef(0);
  const openChange = (next) => {
    if (next) rangeClicks.current = 0;
    setOpen(next);
    focus.opened(next);
    if (!next) check.touch();
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
            <Calendar
              mode={range ? 'range' : 'single'}
              numberOfMonths={range ? 2 : 1}
              selected={selected}
              defaultMonth={(range ? selected?.from : selected) ?? (rules.min ? rules.min.toDate() : undefined)}
              startMonth={rules.min ? rules.min.toDate() : undefined}
              endMonth={rules.max ? rules.max.toDate() : undefined}
              disabled={disabledMatchers}
              onSelect={(next) => {
                commit(next, true);
                // A range's first click already sets both ends to that day: it closes on the second click.
                rangeClicks.current += 1;
                if (!range || rangeClicks.current >= 2) openChange(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>
    </Shell>
  );
};

export default withControlState(ShadDatePicker);
