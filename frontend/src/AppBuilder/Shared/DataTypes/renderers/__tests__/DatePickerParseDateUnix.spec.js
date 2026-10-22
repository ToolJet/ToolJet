import { parseDate } from '../DatePickerRenderer';

const EPOCH_SECONDS = 1777395540;
const unixArgs = (unixTimestamp, value) => ({
  value,
  parseDateFormat: 'DD/MM/YYYY h:mm A',
  parseInUnixTimestamp: true,
  unixTimestamp,
});

describe('parseDate with "Parse in unix timestamp" on', () => {
  it.each([
    ['seconds', EPOCH_SECONDS],
    ['milliseconds', EPOCH_SECONDS * 1000],
  ])('parses a numeric epoch in %s', (unit, value) => {
    expect(parseDate(unixArgs(unit, value)).getTime()).toBe(EPOCH_SECONDS * 1000);
  });

  it.each([
    ['seconds', String(EPOCH_SECONDS)],
    ['milliseconds', String(EPOCH_SECONDS * 1000)],
  ])('parses a numeric string epoch in %s', (unit, value) => {
    expect(parseDate(unixArgs(unit, value)).getTime()).toBe(EPOCH_SECONDS * 1000);
  });

  it.each([['seconds'], ['milliseconds']])('returns null for a formatted date string in %s', (unit) => {
    expect(parseDate(unixArgs(unit, '28/04/2027 4:59 PM'))).toBeNull();
  });

  it.each([['seconds'], ['milliseconds']])('returns null for an ISO string in %s', (unit) => {
    expect(parseDate(unixArgs(unit, '2027-04-28T11:29:00Z'))).toBeNull();
  });
});
