import {
  addMonths,
  clampDate,
  defaultFormatDisplay,
  getMonthGrid,
  isDayDisabled,
  setTimeParts,
  to12h,
  to24h,
} from '../dateUtils';

describe('getMonthGrid', () => {
  it('always returns six weeks of seven days', () => {
    // February 2026 fits in exactly four Sunday-first weeks; the grid still has six.
    const grid = getMonthGrid(new Date(2026, 1, 14), 0);
    expect(grid).toHaveLength(6);
    grid.forEach((week) => expect(week).toHaveLength(7));
  });

  it('starts on the week-start day on or before the 1st', () => {
    // 1 Nov 2026 is a Sunday.
    expect(getMonthGrid(new Date(2026, 10, 18), 0)[0][0]).toEqual(new Date(2026, 10, 1));
    expect(getMonthGrid(new Date(2026, 10, 18), 1)[0][0]).toEqual(new Date(2026, 9, 26));
  });

  it('runs on consecutive days across the month boundary', () => {
    const days = getMonthGrid(new Date(2026, 10, 18), 0).flat();
    expect(days[29]).toEqual(new Date(2026, 10, 30));
    expect(days[30]).toEqual(new Date(2026, 11, 1));
    expect(days[41]).toEqual(new Date(2026, 11, 12));
  });
});

describe('12h <-> 24h', () => {
  it.each([
    [0, 12, 'AM'],
    [1, 1, 'AM'],
    [11, 11, 'AM'],
    [12, 12, 'PM'],
    [13, 1, 'PM'],
    [23, 11, 'PM'],
  ])('24h %i is %i %s', (h24, hour, period) => {
    expect(to12h(h24)).toEqual({ hour, period });
    expect(to24h(hour, period as 'AM' | 'PM')).toBe(h24);
  });
});

describe('setTimeParts', () => {
  it('replaces the time and zeroes seconds, keeping the date', () => {
    const next = setTimeParts(new Date(2026, 10, 18, 9, 5, 42, 7), { hour24: 17, minute: 45 });
    expect(next).toEqual(new Date(2026, 10, 18, 17, 45, 0, 0));
  });

  it('starts from 12:00 AM today when there is no value', () => {
    const next = setTimeParts(null, { hour24: 7 });
    const now = new Date();
    expect(next).toEqual(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0));
  });
});

describe('addMonths', () => {
  it('clamps the day to the target month length', () => {
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
    expect(addMonths(new Date(2026, 0, 15), -1)).toEqual(new Date(2025, 11, 15));
  });
});

describe('isDayDisabled / clampDate', () => {
  const min = new Date(2026, 10, 5, 10, 0);
  const max = new Date(2026, 10, 25, 10, 0);

  it('compares whole days, ignoring the time of the bounds', () => {
    expect(isDayDisabled(new Date(2026, 10, 4), min, max)).toBe(true);
    expect(isDayDisabled(new Date(2026, 10, 5), min, max)).toBe(false);
    expect(isDayDisabled(new Date(2026, 10, 25), min, max)).toBe(false);
    expect(isDayDisabled(new Date(2026, 10, 26), min, max)).toBe(true);
    expect(isDayDisabled(new Date(2026, 10, 26), null, null)).toBe(false);
  });

  it('clamps an exact instant into the bounds', () => {
    expect(clampDate(new Date(2026, 10, 5, 0, 0), min, max)).toEqual(min);
    expect(clampDate(new Date(2026, 10, 25, 23, 0), min, max)).toEqual(max);
    expect(clampDate(new Date(2026, 10, 10, 8, 0), min, max)).toEqual(new Date(2026, 10, 10, 8, 0));
  });
});

describe('defaultFormatDisplay', () => {
  const date = new Date(2026, 10, 8, 15, 5);
  it('formats each type', () => {
    expect(defaultFormatDisplay(date, 'date')).toBe('08/11/2026');
    expect(defaultFormatDisplay(date, 'time')).toBe('03:05 PM');
    expect(defaultFormatDisplay(date, 'date-time')).toBe('08/11/2026 03:05 PM');
    expect(defaultFormatDisplay(new Date(2026, 10, 8, 0, 0), 'time')).toBe('12:00 AM');
  });
});
