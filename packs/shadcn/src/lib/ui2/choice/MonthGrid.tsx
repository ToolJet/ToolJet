import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../cn';
import { formatDate, startOfDay, ymd } from './dates';
import '../../../styles/ui2-choice.css';

// shadcn's Calendar (react-day-picker in UI 2.0) on the pack's CSS: one or more months side by side, the arrows at the
// ends of the caption row, today and the selection in the theme's colours, range ends rounded and the middle filled,
// marker dots under a day (labels in its tooltip), and arrow-key moves between days.

export interface DayMarker {
  label: string;
  color: string;
}

export interface MonthGridProps {
  /** The first month shown (any day in it). */
  month: Date;
  numberOfMonths?: number;
  onMonthChange: (next: Date) => void;
  onPick: (day: Date) => void;
  isSelected: (iso: string) => boolean;
  /** A range's ends, for the filled band between them. */
  rangeStart?: string;
  rangeEnd?: string;
  isDisabled?: (day: Date) => boolean;
  markers?: Map<string, DayMarker[]>;
  weekStartsOn?: number;
  showOutsideDays?: boolean;
  fixedWeeks?: boolean;
  fullWidth?: boolean;
  /** The first and last months the arrows reach. */
  startMonth?: Date | null;
  endMonth?: Date | null;
  disableNavigation?: boolean;
  /** Focus the selected (or today's) day on mount, so arrow keys move between days (a popup's calendar). */
  autoFocus?: boolean;
}

const WEEKDAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const firstOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();
/** `n` months on, on the same day where that month has it, else its last day (Jan 31 + 1 is Feb 28), as
 *  react-day-picker's addMonths does: new Date(y, m + 1, 31) rolled over into March and skipped February. */
const shiftMonths = (d: Date, n: number) => {
  const first = addMonths(d, n);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), last));
};
// How far a key looks for a day it can land on, past disabled ones: a year of days, so a long blackout is crossed and
// a calendar with nothing enabled stops.
const MAX_STEPS = 366;

/** The weeks drawn for a month: from the week-start on or before the 1st, through the week of its last day (six weeks
 *  with fixedWeeks). */
const weeksOf = (month: Date, weekStartsOn: number, fixed: boolean): Date[][] => {
  const first = firstOf(month);
  const offset = (first.getDay() - weekStartsOn + 7) % 7;
  const start = addDays(first, -offset);
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const count = fixed ? 6 : Math.ceil((offset + daysIn) / 7);
  return Array.from({ length: count }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
};

export const MonthGrid = ({
  month,
  numberOfMonths = 1,
  onMonthChange,
  onPick,
  isSelected,
  rangeStart,
  rangeEnd,
  isDisabled,
  markers,
  weekStartsOn = 0,
  showOutsideDays = true,
  fixedWeeks = false,
  fullWidth = false,
  startMonth,
  endMonth,
  disableNavigation = false,
  autoFocus = false,
}: MonthGridProps) => {
  const shown = firstOf(month);
  const months = Array.from({ length: Math.max(1, numberOfMonths) }, (_, i) => addMonths(shown, i));
  const todayIso = ymd(new Date());
  const canPrev = !disableNavigation && (!startMonth || monthIndex(shown) > monthIndex(startMonth));
  const canNext = !disableNavigation && (!endMonth || monthIndex(months[months.length - 1]) < monthIndex(endMonth));
  const rootRef = useRef<HTMLDivElement>(null);
  // The day that takes Tab and arrow keys: the selected one shown, else today's, else the 1st, skipping disabled days
  // (a disabled button takes no focus, so a tab stop on one left the calendar with none).
  const visibleIso = (iso: string) => months.some((m) => iso.slice(0, 7) === ymd(m).slice(0, 7));
  const isOff = (d: Date) => !!isDisabled?.(startOfDay(d));
  const pickFocus = () => {
    const days = months.flatMap((m) => weeksOf(m, weekStartsOn, false).flat().filter((d) => d.getMonth() === m.getMonth()));
    const open = days.filter((d) => !isOff(d));
    const sel = open.find((d) => isSelected(ymd(d)));
    if (sel) return ymd(sel);
    if (visibleIso(todayIso) && open.some((d) => ymd(d) === todayIso)) return todayIso;
    return ymd(open[0] ?? shown);
  };
  const [focusIso, setFocusIso] = useState(pickFocus);
  const moved = useRef(false);
  useEffect(() => {
    if (!visibleIso(focusIso)) setFocusIso(pickFocus());
  }, [ymd(shown), numberOfMonths]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!autoFocus && !moved.current) return;
    rootRef.current?.querySelector<HTMLElement>(`[data-day="${focusIso}"]`)?.focus();
  }, [focusIso, autoFocus]);

  const moveFocus = (to: Date) => {
    moved.current = true;
    const iso = ymd(to);
    if (!visibleIso(iso)) {
      if (disableNavigation) return;
      const delta = monthIndex(to) - monthIndex(shown);
      onMonthChange(delta < 0 ? firstOf(to) : addMonths(firstOf(to), -(months.length - 1)));
    }
    setFocusIso(iso);
  };
  // The months the arrows can reach: those between startMonth and endMonth, or only the ones shown when navigation is
  // off.
  const navigable = (d: Date) =>
    disableNavigation
      ? visibleIso(ymd(d))
      : (!startMonth || monthIndex(d) >= monthIndex(startMonth)) &&
        (!endMonth || monthIndex(d) <= monthIndex(endMonth));
  // Each key's first target and the step past a disabled one, as react-day-picker moves: an arrow or Page key keeps
  // stepping the same way (Right over a blackout lands on the next open day), Home and End step back towards the day
  // they started from. Focus stays where it is when the steps leave the months it can reach first.
  const onKey = (e: React.KeyboardEvent, day: Date) => {
    const lead = (day.getDay() - weekStartsOn + 7) % 7;
    const by = (n: number) => (d: Date) => addDays(d, n);
    const byMonths = (n: number) => (d: Date) => shiftMonths(d, n);
    const keys: Record<string, [Date, (d: Date) => Date]> = {
      ArrowLeft: [addDays(day, -1), by(-1)],
      ArrowRight: [addDays(day, 1), by(1)],
      ArrowUp: [addDays(day, -7), by(-7)],
      ArrowDown: [addDays(day, 7), by(7)],
      Home: [addDays(day, -lead), by(1)],
      End: [addDays(day, 6 - lead), by(-1)],
      PageUp: [shiftMonths(day, -1), byMonths(-1)],
      PageDown: [shiftMonths(day, 1), byMonths(1)],
    };
    const move = keys[e.key];
    if (!move) return;
    e.preventDefault();
    const [target, step] = move;
    const homeOrEnd = e.key === 'Home' || e.key === 'End';
    let to = target;
    for (let i = 0; i < MAX_STEPS && navigable(to) && isOff(to); i += 1) {
      // Home and End look only within the week, up to the day they started from.
      if (homeOrEnd && ymd(to) === ymd(day)) return;
      to = step(to);
    }
    if (navigable(to) && !isOff(to)) moveFocus(to);
  };
  const weekdays = Array.from({ length: 7 }, (_, i) => WEEKDAY_SHORT[(i + weekStartsOn) % 7]);

  return (
    <div ref={rootRef} className={cn('uc-cal', fullWidth && 'is-full')}>
      <div className="uc-cal-nav">
        <button type="button" className="uc-cal-arrow" aria-label="Go to the previous month" disabled={!canPrev} onClick={() => onMonthChange(addMonths(shown, -1))}>
          <ChevronLeft size={16} />
        </button>
        <button type="button" className="uc-cal-arrow" aria-label="Go to the next month" disabled={!canNext} onClick={() => onMonthChange(addMonths(shown, 1))}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="uc-cal-months">
        {months.map((m) => (
          <div key={ymd(m)} className="uc-cal-month" role="grid" aria-label={formatDate(m, 'MMMM YYYY')}>
            <div className="uc-cal-caption" aria-live="polite">
              {formatDate(m, 'MMMM YYYY')}
            </div>
            <div className="uc-cal-row" role="row">
              {weekdays.map((w) => (
                <span key={w} className="uc-cal-weekday" role="columnheader">
                  {w}
                </span>
              ))}
            </div>
            {weeksOf(m, weekStartsOn, fixedWeeks).map((week, wi) => (
              <div key={wi} className="uc-cal-row" role="row">
                {week.map((day) => {
                  const iso = ymd(day);
                  const outside = day.getMonth() !== m.getMonth();
                  if (outside && !showOutsideDays) return <span key={iso} className="uc-cal-cell" role="gridcell" />;
                  const off = isOff(day);
                  const inRange = !!rangeStart && !!rangeEnd && iso > rangeStart && iso < rangeEnd;
                  const isStart = !!rangeStart && iso === rangeStart && !!rangeEnd && rangeEnd !== rangeStart;
                  const isEnd = !!rangeEnd && iso === rangeEnd && !!rangeStart && rangeEnd !== rangeStart;
                  const selected = isSelected(iso) && !inRange;
                  const dayMarkers = markers?.get(iso) ?? [];
                  const title = dayMarkers.map((x) => x.label).filter(Boolean).join(' · ');
                  return (
                    <span
                      key={iso}
                      role="gridcell"
                      className={cn('uc-cal-cell', inRange && 'is-range-middle', isStart && 'is-range-start', isEnd && 'is-range-end')}
                    >
                      <button
                        type="button"
                        data-day={iso}
                        tabIndex={iso === focusIso ? 0 : -1}
                        disabled={off}
                        title={title || undefined}
                        aria-label={`${formatDate(day, 'dddd, MMMM D, YYYY')}${title ? `, ${title}` : ''}`}
                        aria-pressed={selected || inRange}
                        className={cn(
                          'uc-cal-day',
                          outside && 'is-outside',
                          iso === todayIso && !selected && !inRange && 'is-today',
                          inRange && 'is-in-range',
                          selected && 'is-selected'
                        )}
                        onClick={() => {
                          setFocusIso(iso);
                          onPick(startOfDay(day));
                        }}
                        onKeyDown={(e) => onKey(e, day)}
                      >
                        {day.getDate()}
                        {dayMarkers.length ? (
                          <span className="uc-cal-dots" aria-hidden="true">
                            {dayMarkers.slice(0, 3).map((x, i) => (
                              <span key={i} className={cn('uc-cal-dot', !x.color && 'is-plain')} style={x.color ? ({ '--lk-dot': x.color } as React.CSSProperties) : undefined} />
                            ))}
                          </span>
                        ) : null}
                      </button>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
