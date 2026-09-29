import { parseApprovalRangeStart, parseApprovalRangeEnd } from '@modules/workflows/helpers/approval-date-range';

// Repository tests pass Dates; the day-vs-instant decision is only testable here.
/** @group workflows */
describe('approvals list date range', () => {
  describe('a bare YYYY-MM-DD names a whole day', () => {
    it('widens `to` to the last instant of that day, so the selected day is included', () => {
      expect(parseApprovalRangeEnd('2026-09-24')?.toISOString()).toBe('2026-09-24T23:59:59.999Z');
    });

    it('widens `from` to the first instant of that day', () => {
      expect(parseApprovalRangeStart('2026-09-24')?.toISOString()).toBe('2026-09-24T00:00:00.000Z');
    });

    it('makes a single-day range (from === to) cover that day rather than being empty', () => {
      const from = parseApprovalRangeStart('2026-09-24');
      const to = parseApprovalRangeEnd('2026-09-24');
      expect(from.getTime()).toBeLessThan(to.getTime());
      const noon = new Date('2026-09-24T12:00:00Z');
      expect(noon.getTime()).toBeGreaterThanOrEqual(from.getTime());
      expect(noon.getTime()).toBeLessThanOrEqual(to.getTime());
    });
  });

  describe('a value carrying a time is an instant the caller chose', () => {
    it('passes a full UTC timestamp through untouched', () => {
      expect(parseApprovalRangeEnd('2026-09-24T09:30:00.000Z')?.toISOString()).toBe('2026-09-24T09:30:00.000Z');
    });

    it('honors an explicit offset rather than re-anchoring it to UTC — this is how a caller sends its own timezone', () => {
      // End of 24 Sep in UTC+05:30.
      expect(parseApprovalRangeEnd('2026-09-24T23:59:59.999+05:30')?.toISOString()).toBe('2026-09-24T18:29:59.999Z');
    });
  });

  describe('absent or unusable input', () => {
    it.each([undefined, ''])('returns undefined for %p so no bound is applied', (value) => {
      expect(parseApprovalRangeStart(value as string)).toBeUndefined();
      expect(parseApprovalRangeEnd(value as string)).toBeUndefined();
    });

    it('returns undefined rather than an Invalid Date, which would silently match zero rows', () => {
      expect(parseApprovalRangeEnd('not-a-date')).toBeUndefined();
    });
  });
});
