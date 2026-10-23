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
  // The day that takes Tab and arrow keys: the selected one shown, else today's, else the 1st.
  const visibleIso = (iso: string) => months.some((m) => iso.slice(0, 7) === ymd(m).slice(0, 7));
  const pickFocus = () => {
    const sel = months.flatMap((m) => weeksOf(m, weekStartsOn, false).flat().filter((d) => d.getMonth() === m.getMonth())).find((d) => isSelected(ymd(d)));
    if (sel) return ymd(sel);
    return visibleIso(todayIso) ? todayIso : ymd(shown);
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
  const onKey = (e: React.KeyboardEvent, day: Date) => {
    const keys: Record<string, () => Date> = {
      ArrowLeft: () => addDays(day, -1),
      ArrowRight: () => addDays(day, 1),
      ArrowUp: () => addDays(day, -7),
      ArrowDown: () => addDays(day, 7),
      Home: () => addDays(day, -((day.getDay() - weekStartsOn + 7) % 7)),
      End: () => addDays(day, 6 - ((day.getDay() - weekStartsOn + 7) % 7)),
      PageUp: () => new Date(day.getFullYear(), day.getMonth() - 1, day.getDate()),
      PageDown: () => new Date(day.getFullYear(), day.getMonth() + 1, day.getDate()),
    };
    const next = keys[e.key];
    if (!next) return;
    e.preventDefault();
    moveFocus(next());
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
                  const off = !!isDisabled?.(startOfDay(day));
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
