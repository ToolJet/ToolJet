import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './cn';
import { WEEKDAYS, addMonths, monthGrid, monthTitle, toIso } from './calendar';

export interface CalendarGridProps {
  view: { year: number; month: number };
  onViewChange: (view: { year: number; month: number }) => void;
  onPick: (iso: string) => void;
  isSelected: (iso: string) => boolean;
  isInRange?: (iso: string) => boolean;
  isDisabled?: (iso: string, day: Date) => boolean;
  markers?: Set<string>;
  weekStartsOn?: number;
  showOutsideDays?: boolean;
  showNav?: { prev: boolean; next: boolean };
}

// One month of days with prev/next navigation; shared by Calendar and the date pickers.
export const CalendarGrid = ({
  view,
  onViewChange,
  onPick,
  isSelected,
  isInRange,
  isDisabled,
  markers,
  weekStartsOn = 0,
  showOutsideDays = true,
  showNav = { prev: true, next: true },
}: CalendarGridProps) => {
  const todayIso = toIso(new Date());
  const weekdays = [...WEEKDAYS.slice(weekStartsOn), ...WEEKDAYS.slice(0, weekStartsOn)];
  return (
    <div className="ui-calendar-month">
      <div className="ui-calendar-head">
        {showNav.prev ? (
          <button type="button" className="ui-icon-btn" aria-label="Previous month" onClick={() => onViewChange(addMonths(view.year, view.month, -1))}>
            <ChevronLeft size={16} />
          </button>
        ) : (
          <span />
        )}
        <span className="ui-calendar-title">{monthTitle(view.year, view.month)}</span>
        {showNav.next ? (
          <button type="button" className="ui-icon-btn" aria-label="Next month" onClick={() => onViewChange(addMonths(view.year, view.month, 1))}>
            <ChevronRight size={16} />
          </button>
        ) : (
          <span />
        )}
      </div>
      <div className="ui-calendar-grid">
        {weekdays.map((d) => (
          <span key={d} className="ui-calendar-weekday">
            {d}
          </span>
        ))}
        {monthGrid(view.year, view.month, weekStartsOn).map((day) => {
          const iso = toIso(day);
          const outside = day.getMonth() !== view.month;
          if (outside && !showOutsideDays) return <span key={iso} />;
          return (
            <button
              key={iso}
              type="button"
              disabled={isDisabled?.(iso, day)}
              className={cn(
                'ui-calendar-day',
                outside && 'is-outside',
                iso === todayIso && 'is-today',
                isInRange?.(iso) && 'is-in-range',
                isSelected(iso) && 'is-selected'
              )}
              onClick={() => onPick(iso)}
            >
              {day.getDate()}
              {markers?.has(iso) ? <span className="ui-calendar-marker" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};
