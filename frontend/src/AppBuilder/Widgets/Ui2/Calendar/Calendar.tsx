import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  useAutoHeight,
  useExposed,
  useLatest,
  useStable,
  withControlState,
} from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Calendar, buttonVariants, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import {
  calendarExposed,
  calendarSelection,
  disabledMatchers,
  markersByDay,
  shownMonth,
  shownMonthCount,
  toDate,
  visiblePeriod,
  ymd,
} from '@/AppBuilder/Widgets/Ui2/_actions/calendarModel';
import type { DateRange, DayButtonProps, DayPickerProps } from 'react-day-picker';
import type { CalendarSelection, Marker } from '@/AppBuilder/Widgets/Ui2/_actions/calendarModel';
import type { StyleWithVars, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { clampUnwrapped } from '@/AppBuilder/Widgets/Ui2/_actions/actionsModel';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/values';

// ---- Calendar ----------------------------------------------------------------------------------------------------

const MarkerContext = createContext(new Map<string, Marker[]>());

export const DAY_SELECTED =
  'tw-bg-ui2-primary tw-text-ui2-primary-foreground tw-opacity-100 hover:tw-bg-ui2-primary hover:tw-text-ui2-primary-foreground focus:tw-bg-ui2-primary focus:tw-text-ui2-primary-foreground';

export const DAY_RANGE_MIDDLE =
  'tw-rounded-none tw-bg-transparent tw-text-[color:var(--lk-fg,var(--sc-accent-foreground))] hover:tw-bg-transparent';

export const DAY_TODAY = 'tw-bg-[color:var(--lk-today,var(--sc-accent))] tw-text-[color:var(--sc-accent-foreground)]';

/** A day: shadcn's ghost button in the state's colours, with dots for the day's markers (labels on hover). */
export const MarkedDayButton = ({ day, modifiers, className, children, ...rest }: DayButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  const markers = useContext(MarkerContext).get(ymd(day.date)) || [];
  const title = markers
    .map((m) => m.label)
    .filter(Boolean)
    .join(' · ');
  const selected = modifiers.selected && !modifiers.range_middle;
  return (
    <button
      ref={ref}
      {...rest}
      title={title || undefined}
      aria-label={title ? `${rest['aria-label'] ?? ''}, ${title}` : rest['aria-label']}
      className={cn(
        className,
        // Selectable, so no extra fade (see the shared Calendar primitive).
        modifiers.outside && 'tw-text-[color:var(--lk-muted,var(--sc-muted-foreground))]',
        modifiers.disabled && 'tw-text-[color:var(--lk-muted,var(--sc-muted-foreground))] tw-opacity-50',
        !selected && !modifiers.range_middle && modifiers.today && DAY_TODAY,
        modifiers.range_middle && DAY_RANGE_MIDDLE,
        selected && DAY_SELECTED
      )}
    >
      {children}
      {markers.length ? (
        <span
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-bottom-[3px] tw-left-1/2 tw-flex -tw-translate-x-1/2 tw-gap-0.5"
        >
          {markers.slice(0, 3).map((m, i) => (
            <span
              key={i}
              className={cn(
                'tw-h-1 tw-w-1 tw-rounded-full',
                selected && !m.color
                  ? 'tw-bg-[color:var(--sc-primary-foreground)]'
                  : 'tw-bg-[color:var(--lk-dot,var(--lk-marker,var(--sc-primary)))]'
              )}
              style={isSet(m.color) ? ({ '--lk-dot': m.color } as StyleWithVars) : undefined}
            />
          ))}
        </span>
      ) : null}
    </button>
  );
};

export const CALENDAR_MODES = ['single', 'multiple', 'range'];

export const NAV_BUTTON = cn(
  buttonVariants({ variant: 'outline' }),
  'tw-z-10 tw-h-7 tw-w-7 tw-bg-transparent tw-p-0 tw-opacity-60 hover:tw-opacity-100 tw-text-[color:var(--lk-title,var(--sc-foreground))] tw-border-[color:var(--lk-border,var(--sc-input))]'
);

export const ShadCalendar = (props: WidgetProps) => {
  const { properties, setExposedVariables, fireEvent } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const mode = CALENDAR_MODES.includes(properties.mode) ? properties.mode : 'single';
  const months = clampUnwrapped(properties.numberOfMonths, 1, 3, 1);
  // A new default value or mode resets the selection.
  const defaultValue = useStable(properties.defaultValue);
  const initial = useMemo(() => calendarSelection(defaultValue, mode), [defaultValue, mode]);
  // Reset during render, not in an effect: an effect left the old selection (a Date, or { from, to }) drawn for one
  // render in the new mode, and DayPicker's multiple mode threw on it ('selected?.some is not a function').
  const [selected, setSelected] = useState(initial);
  const [selectionFrom, setSelectionFrom] = useState(initial);
  if (selectionFrom !== initial) {
    setSelectionFrom(initial);
    setSelected(initial);
  }
  // The selection's shape follows the mode.
  const firstSelected =
    mode === 'multiple'
      ? (initial as Date[] | undefined)?.[0]
      : mode === 'range'
      ? (initial as DateRange | undefined)?.from
      : (initial as Date | undefined);
  const initialMonth = toDate(properties.defaultMonth) || firstSelected || new Date();
  const monthKey = ymd(initialMonth).slice(0, 7);
  const [month, setMonth] = useState(initialMonth);
  // The month shown resets only when the opening month changes (initialMonth can be a new Date each render).
  const latestInitialMonth = useLatest(initialMonth);
  useEffect(() => setMonth(latestInitialMonth.current), [monthKey, latestInitialMonth]);
  // The months shown, inside minDate and maxDate: drawn, exposed and published as one.
  const { minDate, maxDate } = properties;
  const shown = shownMonth(month, months, minDate, maxDate);
  const drawn = shownMonthCount(shown, months, maxDate);
  const live = useLatest({ mode, selected, months, minDate, maxDate });

  const publish = (next: CalendarSelection) => {
    setSelected(next);
    setExposedVariables(calendarExposed(next, live.current.mode));
  };
  const showMonth = (date: Date | undefined, fire: boolean) => {
    if (!date) return;
    const { months: n, minDate: min, maxDate: max } = live.current;
    const next = shownMonth(date, n, min, max);
    setMonth(next);
    setExposedVariables(visiblePeriod(next, shownMonthCount(next, n, max)));
    if (fire) fireEvent('onMonthChanged');
  };
  useExposed(setExposedVariables, properties, {
    ...calendarExposed(selected, mode),
    ...visiblePeriod(shown, drawn),
    selectDate: async (date: unknown, endDate?: unknown) => {
      const { mode: m, selected: current } = live.current;
      let next: CalendarSelection;
      if (m === 'multiple') {
        const add = calendarSelection(date, 'multiple') as Date[];
        next = calendarSelection([...((current as Date[] | undefined) || []), ...add], 'multiple');
      } else if (m === 'range') {
        next = calendarSelection([date, endDate], 'range');
      } else {
        next = calendarSelection(date, 'single');
      }
      publish(next);
      showMonth(toDate(Array.isArray(date) ? date[0] : date), false);
    },
    clear: async () => publish(live.current.mode === 'multiple' ? [] : undefined),
    setMonth: async (date: unknown) => showMonth(toDate(date), false),
  });

  const markers = markersByDay(properties.markers);
  const fullWidth = properties.fullWidth === true;
  const disabled = busy(properties);
  const disabledDates = useStable(properties.disabledDates);
  const disabledDays = useStable(properties.disabledDays);
  const matchers = useMemo(
    () => disabledMatchers({ minDate, maxDate, disabledDates, disabledDays }),
    [minDate, maxDate, disabledDates, disabledDays]
  );
  const cell = 'tw-h-[var(--lk-cell,2rem)] tw-w-[var(--lk-cell,2rem)]';
  // react-day-picker types its selection props per mode; this widget's selection follows its mode.
  const selection = {
    mode,
    selected,
    onSelect: (next: CalendarSelection) => {
      publish(next);
      fireEvent('onSelect');
    },
    required: mode === 'single',
  } as DayPickerProps;
  return (
    <Shell {...props} innerRef={ref}>
      <MarkerContext.Provider value={markers}>
        <Calendar
          {...selection}
          month={shown}
          onMonthChange={(next) => showMonth(next, true)}
          numberOfMonths={drawn}
          weekStartsOn={properties.weekStartsOn === 'monday' ? 1 : 0}
          showOutsideDays={properties.showOutsideDays !== false}
          fixedWeeks={properties.fixedWeeks === true}
          disabled={disabled ? true : matchers}
          startMonth={toDate(properties.minDate)}
          endMonth={toDate(properties.maxDate)}
          components={{ DayButton: MarkedDayButton }}
          className={cn(
            'tw-p-3 tw-bg-[color:var(--lk-bg,transparent)] tw-text-[color:var(--lk-fg,var(--sc-foreground))]',
            fullWidth ? 'tw-w-full' : 'tw-w-fit',
            properties.showBorder !== false &&
              'tw-rounded-[var(--lk-radius,var(--sc-radius))] tw-border tw-border-solid tw-border-[color:var(--lk-border,var(--sc-border))]',
            disabled && 'tw-opacity-60'
          )}
          classNames={{
            months: cn('tw-relative tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row', fullWidth && 'tw-w-full'),
            month: 'tw-flex tw-w-full tw-flex-col tw-gap-4',
            caption_label: 'tw-text-ui2-sm tw-font-medium tw-text-[color:var(--lk-title,var(--sc-foreground))]',
            button_previous: NAV_BUTTON,
            button_next: NAV_BUTTON,
            weekday: cn(
              'tw-rounded-ui2-md tw-text-[0.8rem] tw-font-normal tw-text-[color:var(--lk-muted,var(--sc-muted-foreground))]',
              fullWidth ? 'tw-flex-1' : 'tw-w-[var(--lk-cell,2rem)]'
            ),
            day: cn(
              'tw-relative tw-p-0 tw-text-center tw-text-ui2-sm',
              fullWidth ? 'tw-h-[var(--lk-cell,2.25rem)] tw-flex-1' : cell
            ),
            day_button: cn(
              buttonVariants({ variant: 'ghost' }),
              'tw-relative tw-h-full tw-w-full tw-rounded-ui2-md tw-p-0 tw-font-normal tw-text-[color:var(--lk-fg,var(--sc-foreground))] hover:tw-bg-[color:var(--lk-hover,var(--sc-accent))] hover:tw-text-[color:var(--lk-fg,var(--sc-accent-foreground))]'
            ),
            range_start: 'tw-rounded-l-ui2-md tw-bg-[color:var(--lk-range,var(--sc-accent))]',
            range_middle: 'tw-bg-[color:var(--lk-range,var(--sc-accent))]',
            range_end: 'tw-rounded-r-ui2-md tw-bg-[color:var(--lk-range,var(--sc-accent))]',
            selected: '',
            today: '',
            outside: '',
            disabled: '',
          }}
        />
      </MarkerContext.Provider>
    </Shell>
  );
};

export default withControlState(ShadCalendar);
