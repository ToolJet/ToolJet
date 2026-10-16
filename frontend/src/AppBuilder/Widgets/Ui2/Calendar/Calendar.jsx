import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Calendar, buttonVariants, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import {
  calendarExposed,
  calendarSelection,
  clampInt,
  disabledMatchers,
  markersByDay,
  toDate,
  unwrap,
  visiblePeriod,
  ymd,
} from '@/AppBuilder/Widgets/Ui2/_actions/actionsModel';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { useLive } from '@/AppBuilder/Widgets/Ui2/_actions/actionParts';

// ---- Calendar ----------------------------------------------------------------------------------------------------

const MarkerContext = createContext(new Map());

export const DAY_SELECTED =
  'bg-primary text-primary-foreground opacity-100 hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground';

export const DAY_RANGE_MIDDLE =
  'rounded-none bg-transparent text-[color:var(--lk-fg,var(--sc-accent-foreground))] hover:bg-transparent';

export const DAY_TODAY = 'bg-[color:var(--lk-today,var(--sc-accent))] text-[color:var(--sc-accent-foreground)]';

/** A day: shadcn's ghost button in the state's colours, with dots for the day's markers (labels on hover). */
export const MarkedDayButton = ({ day, modifiers, className, children, ...rest }) => {
  const ref = useRef(null);
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
        modifiers.outside && 'text-[color:var(--lk-muted,var(--sc-muted-foreground))] opacity-50',
        modifiers.disabled && 'text-[color:var(--lk-muted,var(--sc-muted-foreground))] opacity-50',
        !selected && !modifiers.range_middle && modifiers.today && DAY_TODAY,
        modifiers.range_middle && DAY_RANGE_MIDDLE,
        selected && DAY_SELECTED
      )}
    >
      {children}
      {markers.length ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[3px] left-1/2 flex -translate-x-1/2 gap-0.5"
        >
          {markers.slice(0, 3).map((m, i) => (
            <span
              key={i}
              className={cn(
                'h-1 w-1 rounded-full',
                selected && !m.color
                  ? 'bg-[color:var(--sc-primary-foreground)]'
                  : 'bg-[color:var(--lk-dot,var(--lk-marker,var(--sc-primary)))]'
              )}
              style={isSet(m.color) ? { '--lk-dot': m.color } : undefined}
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
  'z-10 h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 text-[color:var(--lk-title,var(--sc-foreground))] border-[color:var(--lk-border,var(--sc-input))]'
);

export const ShadCalendar = (props) => {
  const { properties, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const mode = CALENDAR_MODES.includes(properties.mode) ? properties.mode : 'single';
  const months = clampInt(properties.numberOfMonths, 1, 3, 1);
  const rawKey = stringify([unwrap(properties.defaultValue) ?? null, mode]);
  const initial = calendarSelection(properties.defaultValue, mode);
  const [selected, setSelected] = useState(initial);
  useEffect(() => setSelected(initial), [rawKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const firstSelected = mode === 'multiple' ? initial?.[0] : mode === 'range' ? initial?.from : initial;
  const initialMonth = toDate(properties.defaultMonth) || firstSelected || new Date();
  const monthKey = ymd(initialMonth).slice(0, 7);
  const [month, setMonth] = useState(initialMonth);
  useEffect(() => setMonth(initialMonth), [monthKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const live = useLive({ mode, selected, months });

  const publish = (next) => {
    setSelected(next);
    setExposedVariables(calendarExposed(next, live.current.mode));
  };
  const showMonth = (date, fire) => {
    if (!date) return;
    setMonth(date);
    setExposedVariables(visiblePeriod(date, live.current.months));
    if (fire) fireEvent('onMonthChanged');
  };
  useExposed(setExposedVariables, properties, {
    ...calendarExposed(selected, mode),
    ...visiblePeriod(month, months),
    selectDate: async (date, endDate) => {
      const { mode: m, selected: current } = live.current;
      let next;
      if (m === 'multiple') {
        const add = calendarSelection(date, 'multiple');
        next = calendarSelection([...(current || []), ...add], 'multiple');
      } else if (m === 'range') {
        next = calendarSelection([date, endDate], 'range');
      } else {
        next = calendarSelection(date, 'single');
      }
      publish(next);
      showMonth(toDate(Array.isArray(date) ? date[0] : date), false);
    },
    clear: async () => publish(live.current.mode === 'multiple' ? [] : undefined),
    setMonth: async (date) => showMonth(toDate(date), false),
  });

  const markers = markersByDay(properties.markers);
  const fullWidth = properties.fullWidth === true;
  const disabled = busy(properties);
  const matchers = disabledMatchers(properties);
  const cell = 'h-[var(--lk-cell,2rem)] w-[var(--lk-cell,2rem)]';
  return (
    <Shell {...props} innerRef={ref}>
      <MarkerContext.Provider value={markers}>
        <Calendar
          mode={mode}
          selected={selected}
          onSelect={(next) => {
            publish(next);
            fireEvent('onSelect');
          }}
          required={mode === 'single'}
          month={month}
          onMonthChange={(next) => showMonth(next, true)}
          numberOfMonths={months}
          weekStartsOn={properties.weekStartsOn === 'monday' ? 1 : 0}
          showOutsideDays={properties.showOutsideDays !== false}
          fixedWeeks={properties.fixedWeeks === true}
          disabled={disabled ? true : matchers}
          startMonth={toDate(properties.minDate)}
          endMonth={toDate(properties.maxDate)}
          components={{ DayButton: MarkedDayButton }}
          className={cn(
            'p-3 bg-[color:var(--lk-bg,transparent)] text-[color:var(--lk-fg,var(--sc-foreground))]',
            fullWidth ? 'w-full' : 'w-fit',
            properties.showBorder !== false &&
              'rounded-[var(--lk-radius,var(--sc-radius))] border border-solid border-[color:var(--lk-border,var(--sc-border))]',
            disabled && 'opacity-60'
          )}
          classNames={{
            months: cn('relative flex flex-col gap-4 sm:flex-row', fullWidth && 'w-full'),
            month: 'flex w-full flex-col gap-4',
            caption_label: 'text-sm font-medium text-[color:var(--lk-title,var(--sc-foreground))]',
            button_previous: NAV_BUTTON,
            button_next: NAV_BUTTON,
            weekday: cn(
              'rounded-md text-[0.8rem] font-normal text-[color:var(--lk-muted,var(--sc-muted-foreground))]',
              fullWidth ? 'flex-1' : 'w-[var(--lk-cell,2rem)]'
            ),
            day: cn('relative p-0 text-center text-sm', fullWidth ? 'h-[var(--lk-cell,2.25rem)] flex-1' : cell),
            day_button: cn(
              buttonVariants({ variant: 'ghost' }),
              'relative h-full w-full rounded-md p-0 font-normal text-[color:var(--lk-fg,var(--sc-foreground))] hover:bg-[color:var(--lk-hover,var(--sc-accent))] hover:text-[color:var(--lk-fg,var(--sc-accent-foreground))]'
            ),
            range_start: 'rounded-l-md bg-[color:var(--lk-range,var(--sc-accent))]',
            range_middle: 'bg-[color:var(--lk-range,var(--sc-accent))]',
            range_end: 'rounded-r-md bg-[color:var(--lk-range,var(--sc-accent))]',
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
