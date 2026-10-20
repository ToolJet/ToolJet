import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit 016 (Codex fixtures currentDateDiscontinuity016 and currentDateTimePopupGapRequired016): a local
// date and time the clocks skip (02:30 on 8 March 2026 in Los Angeles, 02:15 on 4 October 2026 on Lord Howe Island,
// all of 30 December 2011 in Samoa) became another real time: 03:30, 02:45, 31 December. ISO text without an offset
// fell through the strict formats to dayjs's loose reading, and atTime set the hour and minute on a day without
// checking they survived. Both now give no date for such a time. These hold in any zone: where the clocks do not
// change on these days, every time exists and reads as written (npm run test:ui2-dates-tz runs them where they do).
import dayjs from 'dayjs';
import { atTime, parseDateTime } from '@/AppBuilder/Widgets/Ui2/_inputs/dateModel';

// Whether this process's zone has the local time: a skipped time comes back as another one.
const exists = (y, mo, d, h = 0, mi = 0) => {
  const t = new Date(y, mo - 1, d, h, mi);
  return (
    t.getFullYear() === y && t.getMonth() === mo - 1 && t.getDate() === d && t.getHours() === h && t.getMinutes() === mi
  );
};

const CASES = [
  {
    name: 'one-hour gap',
    day: [2026, 3, 8],
    time: [2, 30],
    offsets: ['2026-03-08T02:30:00-08:00', '2026-03-08T02:30:00Z'],
  },
  {
    name: 'half-hour gap',
    day: [2026, 10, 4],
    time: [2, 15],
    offsets: ['2026-10-04T02:15:00+10:30', '2026-10-04T02:15:00+11:00'],
  },
  {
    name: 'skipped day',
    day: [2011, 12, 30],
    time: [12, 0],
    offsets: ['2011-12-30T12:00:00-10:00', '2011-12-30T12:00:00+14:00'],
  },
];
const pad = (n) => String(n).padStart(2, '0');

describe.each(CASES)('$name', ({ day: [y, mo, d], time: [h, mi], offsets }) => {
  const date = `${y}-${pad(mo)}-${pad(d)}`;
  const text = `${date}T${pad(h)}:${pad(mi)}`;
  const real = exists(y, mo, d, h, mi);

  test.each([text, `${text}:00`, `${text}:00.000`, text.replace('T', ' ')])('%s reads only when it exists', (v) => {
    const parsed = parseDateTime(v);
    if (real) expect(parsed?.format('YYYY-MM-DDTHH:mm')).toBe(text);
    else expect(parsed).toBeNull();
  });

  test.each(offsets)('%s names its instant, across the change too', (v) => {
    expect(parseDateTime(v)?.valueOf()).toBe(Date.parse(v));
  });
});

// A day picked in the calendar always exists, so atTime is checked on the two days whose clocks skip a time.
test.each(CASES.slice(0, 2))(
  'atTime gives no date for the time the $name skips',
  ({ day: [y, mo, d], time: [h, mi] }) => {
    const text = `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}`;
    const at = atTime(dayjs(new Date(y, mo - 1, d)), h * 60 + mi);
    if (exists(y, mo, d, h, mi)) expect(at?.format('YYYY-MM-DDTHH:mm')).toBe(text);
    else expect(at).toBeNull();
  }
);

test('the day before and after, and the other hours of the day, still read and build', () => {
  for (const [v, minutes] of [
    ['2026-03-07T02:30', 150],
    ['2026-03-09T02:30', 150],
    ['2026-03-08T01:30', 90],
    ['2026-03-08T03:30', 210],
    ['2026-11-01T01:30', 90],
  ]) {
    expect(parseDateTime(v)?.format('YYYY-MM-DDTHH:mm')).toBe(v);
    expect(atTime(dayjs(v.slice(0, 10)), minutes)?.format('YYYY-MM-DDTHH:mm')).toBe(v);
  }
});

test('ISO text that names no real date still reads as none', () => {
  ['2026-02-30T10:00', '2026-13-01T10:00', '2026-03-08T25:00', '2026-03-08T10:60:00.5'].forEach((v) =>
    expect(parseDateTime(v)).toBeNull()
  );
});
