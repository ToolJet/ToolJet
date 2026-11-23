import { isoDateLabel } from '../_utils/isoDateLabel';

describe('isoDateLabel', () => {
  it('reads a bare ISO date as a date (clinic and todo tables showed 2026-10-12)', () => {
    expect(isoDateLabel('2026-10-12', 'en-US')).toBe('Oct 12, 2026');
  });

  it('reads an ISO timestamp as date and time', () => {
    expect(isoDateLabel('2026-10-12T14:30:00', 'en-US')).toBe('Oct 12, 2026, 2:30 PM');
  });

  it('leaves everything else alone', () => {
    for (const v of ['2026-10', 'Oct 12', '12/10/2026', 'Booked', 42, '', null, '2026-13-45']) {
      expect(isoDateLabel(v, 'en-US')).toBeNull();
    }
  });
});
