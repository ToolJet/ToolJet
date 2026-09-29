/** @jest-environment node */

import { toLocalDayBoundary } from '../dateRange';

describe('toLocalDayBoundary', () => {
  it.each([
    ['start', '2026-09-24', new Date(2026, 8, 24, 0, 0, 0, 0).toISOString()],
    ['end', '2026-09-24', new Date(2026, 8, 24, 23, 59, 59, 999).toISOString()],
    ['end', '2026-02-28', new Date(2026, 1, 28, 23, 59, 59, 999).toISOString()],
  ])('widens a bare day to its local %s', (edge, value, expected) => {
    expect(toLocalDayBoundary(value, edge)).toBe(expected);
  });

  it.each([
    ['a value that already carries a time', '2026-09-24T09:30:00.000Z'],
    ['a value that is not a date', 'yesterday'],
    ['an empty value', ''],
  ])('passes %s straight through', (_label, value) => {
    expect(toLocalDayBoundary(value, 'end')).toBe(value);
  });

  it('makes a single-day range span the whole day', () => {
    const from = new Date(toLocalDayBoundary('2026-09-24', 'start')).getTime();
    const to = new Date(toLocalDayBoundary('2026-09-24', 'end')).getTime();

    expect(to - from).toBe(24 * 60 * 60 * 1000 - 1);
  });
});
