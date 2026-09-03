/**
 * Unit spec for the pure timer formatting helpers in AppBuilder/Widgets/utils.js.
 *
 * `formatTimerValue`/`padTimeUnit` are pure token replacers — no store, no DOM,
 * zero mocks — so this is a Layer 1 spec (see src/test/README.md "Where a test
 * goes"). It does NOT import the composed store, which is what keeps it a unit
 * spec rather than an integration one.
 */
import { formatTimerValue, padTimeUnit, DEFAULT_TIMER_FORMAT } from '../utils';

const time = { hour: 1, minute: 2, second: 3, mSecond: 45 };

describe('padTimeUnit', () => {
  test('pads to two digits by default', () => {
    expect(padTimeUnit(3)).toBe('03');
  });

  test('pads to three digits when asked, for milliseconds', () => {
    expect(padTimeUnit(45, 3)).toBe('045');
  });

  test('treats 0 as a zero-padded value, not a blank', () => {
    expect(padTimeUnit(0)).toBe('00');
    expect(padTimeUnit(0, 3)).toBe('000');
  });

  test('coerces non-numeric input to zero', () => {
    expect(padTimeUnit(undefined)).toBe('00');
    expect(padTimeUnit(NaN, 3)).toBe('000');
  });

  test('leaves an already-wide value untouched', () => {
    expect(padTimeUnit(123, 3)).toBe('123');
  });
});

describe('formatTimerValue', () => {
  test('renders the full default format hh:mm:ss:SSS', () => {
    expect(formatTimerValue(time)).toBe('01:02:03:045');
  });

  test('hides milliseconds when the format omits SSS', () => {
    expect(formatTimerValue(time, 'hh:mm:ss')).toBe('01:02:03');
  });

  test('renders only minutes and seconds with mm:ss', () => {
    expect(formatTimerValue(time, 'mm:ss')).toBe('02:03');
  });

  test('renders only hours and minutes with hh:mm', () => {
    expect(formatTimerValue(time, 'hh:mm')).toBe('01:02');
  });

  test('matches SSS before SS, so milliseconds never collide with seconds', () => {
    expect(formatTimerValue({ hour: 0, minute: 0, second: 7, mSecond: 8 }, 'ss:SSS')).toBe('07:008');
  });

  test('supports the uppercase HH/MM tokens too', () => {
    expect(formatTimerValue(time, 'HH:MM')).toBe('01:02');
  });

  test('falls back to the default format when given a blank or missing format', () => {
    expect(formatTimerValue(time, '')).toBe('01:02:03:045');
    expect(formatTimerValue(time, undefined)).toBe('01:02:03:045');
  });

  test('preserves separators and literal characters between tokens', () => {
    expect(formatTimerValue(time, 'hh-mm')).toBe('01-02');
  });

  test('defaults every unit to zero when the time object is empty', () => {
    expect(formatTimerValue({})).toBe('00:00:00:000');
  });

  test('DEFAULT_TIMER_FORMAT is hh:mm:ss:SSS', () => {
    expect(DEFAULT_TIMER_FORMAT).toBe('hh:mm:ss:SSS');
  });
});
