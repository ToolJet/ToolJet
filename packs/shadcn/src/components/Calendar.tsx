import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../lib/cn';
import { formatDate, isValidDate, toDay, ymd } from '../lib/ui2/choice/dates';
import { lookVars, useResetOn, useStable } from '../lib/ui2/choice/looks';
import { useBusy, useColorStyle } from '../lib/ui2/choice/fieldStyles';
import { TOKEN, useBlankNumber, useThemeRadius } from '../lib/styleDefaults';
import { MonthGrid, type DayMarker } from '../lib/ui2/choice/MonthGrid';
import { LoadingFrame, blockLook, useLoadingLook } from '../lib/ui2/loading/look';
import '../styles/ui2-choice.css';

// UI 2.0's Calendar (Ui2/Calendar/Calendar.tsx, _actions/calendarModel.ts) on the pack's CSS: an inline month calendar
// in single, multiple or range mode, with markers (dots, labels on hover), min and max dates, disabled dates and
// weekdays, and the visible period exposed.

type Range = { from?: Date; to?: Date };
type Selection = Date | Date[] | Range | undefined;

const MODES = ['single', 'multiple', 'range'];
const WEEK_START: Record<string, number> = { sunday: 0, monday: 1, saturday: 6 };
const WEEKDAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const firstOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const monthDiff = (a: Date, b: Date) => (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());

/** The selection from a default value: a day (single), a list of days (multiple) or { from, to } (range). */
const selectionOf = (raw: unknown, mode: string): Selection => {
  if (mode === 'multiple') {
    const days = (Array.isArray(raw) ? raw : [raw]).slice(0, 1000).map((v) => toDay(v)).filter((d): d is Date => !!d);
    const seen = new Set<string>();
    return days.filter((d) => !seen.has(ymd(d)) && !!seen.add(ymd(d)));
  }
  if (mode === 'range') {
    const pair = Array.isArray(raw) ? raw : isRecord(raw) ? [raw.from ?? raw.start ?? raw.startDate, raw.to ?? raw.end ?? raw.endDate] : [raw];
    const from = toDay(pair[0]);
    const to = toDay(pair[1]);
    if (!from) return undefined;
    return to && to < from ? { from: to, to: from } : { from, to };
  }
  return toDay(Array.isArray(raw) ? raw[0] : raw);
};

/** What the calendar exposes: value ('YYYY-MM-DD', a list, or [start, end]), selectedDate(s), startDate, endDate. */
const exposedOf = (sel: Selection, mode: string) => {
  if (mode === 'multiple') {
    const dates = (Array.isArray(sel) ? sel : []).map(ymd).filter(Boolean).sort();
    return { value: dates, selectedDate: dates[0] ?? '', selectedDates: dates, startDate: '', endDate: '' };
  }
  if (mode === 'range') {
    const r = (sel as Range) || {};
    const start = ymd(r.from);
    const end = ymd(r.to);
    return { value: [start, end], selectedDate: start, selectedDates: [start, end].filter(Boolean), startDate: start, endDate: end };
  }
  const date = ymd(sel as Date);
  return { value: date, selectedDate: date, selectedDates: date ? [date] : [], startDate: '', endDate: '' };
};

/** The first month shown: `month`, moved inside the months minDate and maxDate allow. */
const shownMonth = (month: Date, count: number, min?: Date, max?: Date): Date => {
  let start = firstOfMonth(month);
  if (max) {
    const latest = addMonths(firstOfMonth(max), -(Math.max(1, count) - 1));
    if (start > latest) start = latest;
  }
  if (min && start < firstOfMonth(min)) start = firstOfMonth(min);
  return start;
};

const shownCount = (start: Date, count: number, max?: Date) => (max ? Math.max(1, Math.min(count, monthDiff(start, max) + 1)) : count);

const visiblePeriod = (start: Date, count: number) => ({
  visibleMonth: formatDate(start, 'YYYY-MM'),
  visibleStart: ymd(start),
  visibleEnd: ymd(new Date(start.getFullYear(), start.getMonth() + Math.max(1, count), 0)),
});

const markersByDay = (raw: unknown): Map<string, DayMarker[]> => {
  const map = new Map<string, DayMarker[]>();
  for (const m of (Array.isArray(raw) ? raw : []).slice(0, 2000)) {
    const day = toDay(isRecord(m) ? m.date ?? m.day ?? m.start : m);
    if (!day) continue;
    const key = ymd(day);
    const label = isRecord(m) && (m.label ?? m.title) != null ? String(m.label ?? m.title) : '';
    const color = isRecord(m) && m.color != null ? String(m.color) : '';
    map.set(key, [...(map.get(key) || []), { label, color }]);
  }
  return map;
};

export const Calendar = () => {
  const [mode] = ToolJet.useStateEnumeration({
    name: 'mode',
    label: 'Selection mode',
    enumDefinition: ['single', 'multiple', 'range'],
    enumLabels: { single: 'Single', multiple: 'Multiple', range: 'Range' },
    initialValue: 'single',
    inspector: 'switch',
  });
  const [defaultValue] = ToolJet.useStateString({ name: 'defaultValue', label: 'Default value (YYYY-MM-DD, a list, or [start, end])', initialValue: '' });
  const [defaultMonth] = ToolJet.useStateString({ name: 'defaultMonth', label: 'Month to show (date; default: the selection or today)', initialValue: '' });
  const [markers] = ToolJet.useStateArray({
    name: 'markers',
    label: 'Markers',
    description: "[{ date: 'YYYY-MM-DD', label?, color? }] or plain dates: dots under the days, labels on hover.",
    initialValue: [],
  });
  const [minDate] = ToolJet.useStateString({ name: 'minDate', label: 'Min date', initialValue: '' });
  const [maxDate] = ToolJet.useStateString({ name: 'maxDate', label: 'Max date', initialValue: '' });
  const [disabledDates] = ToolJet.useStateArray({ name: 'disabledDates', label: 'Disabled dates', initialValue: [] });
  const [disabledDays] = ToolJet.useStateArray({ name: 'disabledDays', label: 'Disabled weekdays (0 = Sunday)', initialValue: [] });
  const [weekStartsOn] = ToolJet.useStateEnumeration({
    name: 'weekStartsOn',
    label: 'Week starts on',
    enumDefinition: ['sunday', 'monday', 'saturday'],
    enumLabels: { sunday: 'Sunday', monday: 'Monday', saturday: 'Saturday' },
    initialValue: 'sunday',
    inspector: 'switch',
  });
  const [numberOfMonths] = ToolJet.useStateNumber({ name: 'numberOfMonths', label: 'Number of months', initialValue: 1, min: 1, max: 3 });
  const [showOutsideDays] = ToolJet.useStateBoolean({ name: 'showOutsideDays', label: 'Show outside days', initialValue: true });
  const [fixedWeeks] = ToolJet.useStateBoolean({ name: 'fixedWeeks', label: 'Always six weeks', initialValue: false });
  const [fullWidth] = ToolJet.useStateBoolean({ name: 'fullWidth', label: 'Full width', initialValue: false });
  const [showBorder] = ToolJet.useStateBoolean({ name: 'showBorder', label: 'Show border', initialValue: true });
  // Exposed values; selectedDate(s), startDate and endDate were also the pack's defaults.
  const [, setValue] = ToolJet.useStateString({ name: 'value', initialValue: '', inspector: 'hidden' });
  const [legacyDate, setSelectedDate] = ToolJet.useStateString({ name: 'selectedDate', initialValue: '', inspector: 'hidden' });
  const [legacyDates, setSelectedDates] = ToolJet.useStateArray({ name: 'selectedDates', initialValue: [], inspector: 'hidden' });
  const [legacyStart, setStartDate] = ToolJet.useStateString({ name: 'startDate', initialValue: '', inspector: 'hidden' });
  const [legacyEnd, setEndDate] = ToolJet.useStateString({ name: 'endDate', initialValue: '', inspector: 'hidden' });
  const [, setVisibleMonth] = ToolJet.useStateString({ name: 'visibleMonth', initialValue: '', inspector: 'hidden' });
  const [, setVisibleStart] = ToolJet.useStateString({ name: 'visibleStart', initialValue: '', inspector: 'hidden' });
  const [, setVisibleEnd] = ToolJet.useStateString({ name: 'visibleEnd', initialValue: '', inspector: 'hidden' });
  const onSelect = ToolJet.useEventCallback({ name: 'onSelect' });
  const onMonthChanged = ToolJet.useEventCallback({ name: 'onMonthChanged' });
  const backgroundColor = useColorStyle('backgroundColor', 'Background', 'transparent');
  const borderColor = useColorStyle('borderColor', 'Border color', TOKEN.border);
  const textColor = useColorStyle('textColor', 'Day text color', TOKEN.text);
  const headerTextColor = useColorStyle('headerTextColor', 'Month title color', TOKEN.text);
  const mutedTextColor = useColorStyle('mutedTextColor', 'Weekday and outside day color', TOKEN.mutedText);
  const accentColor = useColorStyle('accentColor', 'Selected day background', TOKEN.brand);
  const selectedTextColor = useColorStyle('selectedTextColor', 'Selected day text color', TOKEN.surface);
  const rangeBackgroundColor = useColorStyle('rangeBackgroundColor', 'Range background', TOKEN.muted);
  const todayBackgroundColor = useColorStyle('todayBackgroundColor', 'Today background', TOKEN.muted);
  const hoverBackgroundColor = useColorStyle('hoverBackgroundColor', 'Day hover background', TOKEN.muted);
  const markerColor = useColorStyle('markerColor', 'Marker dot color', TOKEN.brand);
  const borderRadius = useThemeRadius('borderRadius', 'Calendar radius');
  const cellSize = useBlankNumber('cellSize', 'Day size (px)', '32 (36 at full width)');
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 32 });
  const { disabled } = useBusy(false);

  const m = MODES.includes(mode) ? mode : 'single';
  const months = Math.max(1, Math.min(3, Math.round(Number(numberOfMonths)) || 1));
  // An app saved before defaultValue existed starts on the pack's own defaults. Those keys are also what the calendar
  // exposes, so they stand in only while the app has never set defaultValue: an emptied default clears the selection
  // instead of reading the last pick back as the default (SP-27).
  const hasDefault = defaultValue !== '' && defaultValue != null;
  const hadDefault = useRef(false);
  if (hasDefault) hadDefault.current = true;
  const rawDefault = useStable(
    hasDefault
      ? defaultValue
      : hadDefault.current
        ? ''
        : m === 'multiple'
          ? legacyDates
          : m === 'range'
            ? [legacyStart, legacyEnd]
            : legacyDate
  );
  const initial = useMemo(() => selectionOf(rawDefault, m), [rawDefault, m]);
  const [selected, setSelected] = useState<Selection>(initial);
  // Reset during render, not in an effect: the old selection must not be drawn for one render in the new mode.
  const [selectionFrom, setSelectionFrom] = useState(initial);
  if (selectionFrom !== initial) {
    setSelectionFrom(initial);
    setSelected(initial);
  }
  const first = m === 'multiple' ? (initial as Date[] | undefined)?.[0] : m === 'range' ? (initial as Range | undefined)?.from : (initial as Date | undefined);
  const initialMonth = toDay(defaultMonth) || first || new Date();
  const [month, setMonth] = useState(initialMonth);
  useResetOn(ymd(initialMonth).slice(0, 7), () => setMonth(initialMonth));
  const min = toDay(minDate);
  const max = toDay(maxDate);
  const start = shownMonth(month, months, min, max);
  const drawn = shownCount(start, months, max);
  const live = useRef({ m, selected, months, min, max });
  live.current = { m, selected, months, min, max };

  const expose = (sel: Selection, mode2 = m) => {
    const e = exposedOf(sel, mode2);
    setValue(e.value as unknown as string);
    setSelectedDate(e.selectedDate);
    setSelectedDates(e.selectedDates);
    setStartDate(e.startDate);
    setEndDate(e.endDate);
  };
  const exposePeriod = (s: Date, n: number) => {
    const p = visiblePeriod(s, n);
    setVisibleMonth(p.visibleMonth);
    setVisibleStart(p.visibleStart);
    setVisibleEnd(p.visibleEnd);
  };
  useEffect(() => expose(selected), [selected, m]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => exposePeriod(start, drawn), [ymd(start), drawn]); // eslint-disable-line react-hooks/exhaustive-deps

  const publish = (next: Selection) => {
    setSelected(next);
    expose(next, live.current.m);
  };
  const showMonth = (date: Date | undefined, fire: boolean) => {
    if (!date) return;
    const { months: n, min: lo, max: hi } = live.current;
    const next = shownMonth(date, n, lo, hi);
    setMonth(next);
    exposePeriod(next, shownCount(next, n, hi));
    if (fire) onMonthChanged();
  };
  ToolJet.useAction(
    { name: 'selectDate', displayName: 'Select date', params: [{ handle: 'date', displayName: 'Date' }, { handle: 'endDate', displayName: 'End date' }] },
    (date, endDate) => {
      const { m: mode2, selected: current } = live.current;
      let next: Selection;
      if (mode2 === 'multiple') next = selectionOf([...((current as Date[] | undefined) || []), ...((selectionOf(date, 'multiple') as Date[]) || [])], 'multiple');
      else if (mode2 === 'range') next = selectionOf([date, endDate], 'range');
      else next = selectionOf(date, 'single');
      publish(next);
      showMonth(toDay(Array.isArray(date) ? date[0] : date), false);
    }
  );
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => publish(live.current.m === 'multiple' ? [] : undefined));
  ToolJet.useAction({ name: 'setMonth', displayName: 'Set month', params: [{ handle: 'date', displayName: 'Date' }] }, (d) =>
    showMonth(toDay(/^\d{4}-\d{2}$/.test(String(d ?? '')) ? `${d}-01` : d), false)
  );

  const pick = (day: Date) => {
    if (disabled) return;
    const iso = ymd(day);
    let next: Selection;
    if (m === 'multiple') {
      const days = (selected as Date[] | undefined) || [];
      next = days.some((d) => ymd(d) === iso) ? days.filter((d) => ymd(d) !== iso) : [...days, day];
    } else if (m === 'range') {
      const r = (selected as Range) || {};
      // A complete range starts again; a start with no end takes the end (or a new start before it).
      if (!r.from || r.to) next = { from: day, to: undefined };
      else next = day < r.from ? { from: day, to: r.from } : { from: r.from, to: day };
    } else next = day; // single mode keeps a day: a click on it again does not clear it
    publish(next);
    onSelect();
  };

  const disabledSet = useMemo(() => new Set((Array.isArray(disabledDates) ? disabledDates : []).map((d) => ymd(toDay(d))).filter(Boolean)), [JSON.stringify(disabledDates)]); // eslint-disable-line react-hooks/exhaustive-deps
  const offDays = new Set(
    (Array.isArray(disabledDays) ? disabledDays : [])
      .map((d) => (typeof d === 'string' && WEEKDAY_NAMES.includes(d.toLowerCase()) ? WEEKDAY_NAMES.indexOf(d.toLowerCase()) : Number(d)))
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  );
  const isOff = (day: Date) => disabled || (!!min && day < min) || (!!max && day > max) || disabledSet.has(ymd(day)) || offDays.has(day.getDay());
  const dayMarkers = useMemo(() => markersByDay(markers), [JSON.stringify(markers)]); // eslint-disable-line react-hooks/exhaustive-deps
  const dates = m === 'multiple' ? new Set(((selected as Date[] | undefined) || []).map(ymd)) : null;
  const r = m === 'range' ? ((selected as Range) || {}) : null;
  const isSelected = (iso: string) => (dates ? dates.has(iso) : r ? iso === ymd(r.from) || iso === ymd(r.to) : isValidDate(selected) && iso === ymd(selected as Date));
  const vars = lookVars({
    '--lk-bg': backgroundColor,
    '--lk-border': borderColor,
    '--lk-fg': textColor,
    '--lk-title': headerTextColor,
    '--lk-muted': mutedTextColor,
    '--ui-primary': accentColor,
    '--ui-primary-fg': selectedTextColor,
    '--lk-range': rangeBackgroundColor,
    '--lk-today': todayBackgroundColor,
    '--lk-hover': hoverBackgroundColor,
    '--lk-marker': markerColor,
    '--ui-radius': borderRadius,
    '--lk-cell': cellSize,
  });

  return (
    <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
      <div className="ui uc" style={vars}>
        <div className={cn('uc-calendar-box', disabled && 'is-disabled')}>
          <div className={cn('uc-cal-frame', showBorder !== false && 'has-border', fullWidth === true && 'is-full')}>
            <MonthGrid
              month={start}
              numberOfMonths={drawn}
              onMonthChange={(next) => showMonth(next, true)}
              onPick={pick}
              isSelected={isSelected}
              rangeStart={r ? ymd(r.from) : undefined}
              rangeEnd={r ? ymd(r.to) : undefined}
              isDisabled={isOff}
              markers={dayMarkers}
              weekStartsOn={WEEK_START[weekStartsOn] ?? 0}
              showOutsideDays={showOutsideDays !== false}
              fixedWeeks={fixedWeeks === true}
              fullWidth={fullWidth === true}
              startMonth={min}
              endMonth={max}
              disableNavigation={disabled}
            />
          </div>
        </div>
      </div>
    </LoadingFrame>
  );
};

