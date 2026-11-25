import moment from 'moment';
import momentTimezone from 'moment-timezone';

// moment 2.31 changed results that user apps can depend on. frontend/patches restores the 2.30.1 results;
// every expected value below was produced by unpatched moment 2.30.1. A failure after a moment upgrade, or
// because the patch was not applied, means app output would change. See frontend/patches/README.md.
const base = () => moment.utc('2026-11-23T10:30:00Z');

describe('moment keeps its 2.30.1 results', () => {
  it('runs on the patched version', () => {
    expect(moment.version).toBe('2.31.0');
    expect(momentTimezone).toBe(moment);
  });

  describe('UTC offsets outside -12:00..+14:00', () => {
    it.each([
      ['+16:00', '2026-11-24T02:30:00+16:00'],
      ['+99:00', '2026-11-27T13:30:00+99:00'],
      ['-15:30', '2026-11-22T19:00:00-15:30'],
      ['+05:30', '2026-11-23T16:00:00+05:30'],
    ])('utcOffset(%s)', (offset, expected) => {
      expect(base().utcOffset(offset).format()).toBe(expected);
    });

    it.each([
      ['2026-11-23T10:00:00+16:00', '2026-11-22T18:00:00.000Z'],
      ['2026-11-23T10:00:00+25:00', '2026-11-22T09:00:00.000Z'],
      ['2026-11-23T10:00:00-15:30', '2026-11-24T01:30:00.000Z'],
      ['2026-11-23T10:00:00+05:30', '2026-11-23T04:30:00.000Z'],
    ])('parses %s', (input, expected) => {
      expect(moment(input).toISOString()).toBe(expected);
      expect(moment(input, moment.ISO_8601, true).toISOString()).toBe(expected);
      expect(moment(input, 'YYYY-MM-DDTHH:mm:ssZ', true).toISOString()).toBe(expected);
      expect(moment.utc(input).toISOString()).toBe(expected);
      expect(moment.parseZone(input).toISOString()).toBe(expected);
      expect(momentTimezone.tz(input, 'Asia/Kolkata').toISOString()).toBe(expected);
    });

    it('keeps the written offset with parseZone', () => {
      expect(moment.parseZone('2026-11-23T10:00:00+16:00').format()).toBe('2026-11-23T10:00:00+16:00');
    });
  });

  it('throws when min or max gets a non-moment', () => {
    expect(() => moment.max(base(), '2030-01-01')).toThrow('isValid is not a function');
    expect(() => moment.min(base(), null)).toThrow();
    expect(moment.max(base(), moment.utc('2030-01-01')).toISOString()).toBe('2030-01-01T00:00:00.000Z');
  });

  it('formats Object.prototype names as before', () => {
    const value = base();
    expect(value.format('constructor')).toBe(value);
    expect(String(value.format('toString'))).toBe('[object Object]');
    expect(value.format('hasOwnProperty')).toBe(false);
  });

  it('rejects a weekday that does not match the filled-in date', () => {
    jest.useFakeTimers({ now: new Date('2026-11-23T10:30:00Z') });
    try {
      // 27 Nov 2026 is a Friday.
      expect(moment.utc('Wednesday 27', 'dddd D').isValid()).toBe(false);
      expect(moment.utc('Friday 27', 'dddd D').format('YYYY-MM-DD')).toBe('2026-11-27');
    } finally {
      jest.useRealTimers();
    }
  });

  it('reads eHHmm as separate tokens', () => {
    expect(moment.utc('31030', 'eHHmm').isValid()).toBe(false);
    expect(moment.utc('021030', 'eHHmm').format('HH:mm')).toBe('10:30');
  });

  it('leaves ordinary dates alone', () => {
    expect(base().format('DD/MM/YYYY hh:mm A Z')).toBe('23/11/2026 10:30 AM +00:00');
    expect(moment.utc('23/11/2026', 'DD/MM/YYYY', true).toISOString()).toBe('2026-11-23T00:00:00.000Z');
    expect(momentTimezone.tz('2026-11-23 10:00', 'America/New_York').format()).toBe('2026-11-23T10:00:00-05:00');
    expect(moment('not a date', 'YYYY-MM-DD', true).isValid()).toBe(false);
  });
});
