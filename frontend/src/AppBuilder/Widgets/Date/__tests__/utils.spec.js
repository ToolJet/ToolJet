/**
 * Pure unit tests for the DaterangePicker exposed-value formatters
 * (src/AppBuilder/Widgets/Date/utils.js).
 *
 * These encode the corrected exposure contract for three DaterangePicker bugs:
 *  1. Picking only the start date exposed the literal "Invalid date" as
 *     `endDate` and inside `selectedDateRange` before the end was chosen.
 *  2. First render with no default dates exposed `startDate`, `endDate`, and
 *     `selectedDateRange` as "Invalid date".
 *  3. The `setDateRange` CSA exposed "Invalid date" inside `selectedDateRange`
 *     when either argument failed to parse.
 *
 * Corrected behavior (flag omitted/false): a missing/invalid date is exposed
 * as `null`, and `selectedDateRange` is only a string once BOTH ends are valid
 * — matching the widget's own clearStartDate/clearEndDate convention of
 * `selectedDateRange: null` for an incomplete range.
 *
 * Legacy behavior (components migrated with `legacyInvalidDates` = true) must
 * stay byte-identical to the historical `moment(x).format(format)` output, so
 * apps that string-match "Invalid date" keep working until they opt out.
 *
 * No store import, zero mocks — plain values in, formatted string or null out.
 */
import moment from 'moment-timezone';
import {
  formatExposedDate,
  formatExposedDateRange,
  getUsableDateBounds,
  getUsableTimeBounds,
  isDateValid,
  isDateRangeValid,
  getTimeSelectionBase,
  parseDateInputText,
  parseDateRangeInput,
  resolveTimezone,
  getUnixTimeFromParsedDate,
  convertToIsoWithTimezoneOffset,
} from '../utils';

const FORMAT = 'DD-MM-YYYY';
const APRIL_2 = new Date(2022, 3, 2); // 02-04-2022
const APRIL_10 = new Date(2022, 3, 10); // 10-04-2022

describe('formatExposedDate (corrected behavior, flag omitted)', () => {
  test('a valid Date is exposed formatted', () => {
    expect(formatExposedDate(APRIL_2, FORMAT)).toBe('02-04-2022');
  });

  test('null is exposed as null, not "Invalid date" (first render with no defaults)', () => {
    expect(formatExposedDate(null, FORMAT)).toBe(null);
  });

  test('undefined is exposed as null, never coerced to the current date', () => {
    // moment(undefined) is moment() — "now" — which would silently expose
    // today's date instead of an empty value.
    expect(formatExposedDate(undefined, FORMAT)).toBe(null);
  });

  test('an invalid moment (unparseable setDateRange argument) is exposed as null', () => {
    expect(formatExposedDate(moment('not-a-date', FORMAT), FORMAT)).toBe(null);
  });

  test('a valid moment parsed with a custom format is exposed in the display format', () => {
    expect(formatExposedDate(moment('2022/04/02', 'YYYY/MM/DD'), FORMAT)).toBe('02-04-2022');
  });
});

describe('formatExposedDateRange (corrected behavior, flag omitted)', () => {
  test('both ends valid exposes "start - end"', () => {
    expect(formatExposedDateRange(APRIL_2, APRIL_10, FORMAT)).toBe('02-04-2022 - 10-04-2022');
  });

  test('start picked but end not chosen exposes null, not "02-04-2022 - Invalid date"', () => {
    expect(formatExposedDateRange(APRIL_2, null, FORMAT)).toBe(null);
  });

  test('end set without a start exposes null', () => {
    expect(formatExposedDateRange(null, APRIL_10, FORMAT)).toBe(null);
  });

  test('no dates at all (first render with no defaults) exposes null', () => {
    expect(formatExposedDateRange(null, null, FORMAT)).toBe(null);
  });

  test('setDateRange with one unparseable argument exposes null', () => {
    expect(formatExposedDateRange(moment('garbage', FORMAT), moment('10-04-2022', FORMAT), FORMAT)).toBe(null);
  });
});

describe('legacy behavior (components migrated with legacyInvalidDates = true)', () => {
  test('a missing date keeps the historical "Invalid date" exposure', () => {
    expect(formatExposedDate(null, FORMAT, true)).toBe('Invalid date');
  });

  test('a valid date formats identically to the corrected mode', () => {
    expect(formatExposedDate(APRIL_2, FORMAT, true)).toBe('02-04-2022');
  });

  test('start-only range keeps the historical "start - Invalid date" string', () => {
    expect(formatExposedDateRange(APRIL_2, null, FORMAT, true)).toBe('02-04-2022 - Invalid date');
  });

  test('no dates keeps the historical "Invalid date - Invalid date" string', () => {
    expect(formatExposedDateRange(null, null, FORMAT, true)).toBe('Invalid date - Invalid date');
  });

  test('unparseable setDateRange moments keep the historical string', () => {
    expect(formatExposedDateRange(moment('garbage', FORMAT), moment('junk', FORMAT), FORMAT, true)).toBe(
      'Invalid date - Invalid date'
    );
  });
});

// Bug: "Unable to see the error message when the minimum date is later than the
// maximum date." With min > max no calendar day satisfies both bounds, every
// date is disabled, and — because the per-date min/max rules only judge a
// SELECTED date — isDateValid stayed `isValid: true`, so no error message
// could ever surface. The contradictory configuration itself must fail
// validation, for the date pair and the time pair alike.
// Invalid Min/Max bounds are configuration problems, not widget errors: the
// bound(s) are IGNORED by the calendar and validation (the widget surfaces
// nothing), the problem is reported to the debugger by the hooks, and the
// exposed minDate/maxDate keep whatever the user wrote or the dynamic value
// resolved to — even when invalid.
describe('getUsableDateBounds', () => {
  const FORMAT = 'DD/MM/YYYY';

  test('valid ordered bounds pass through as Dates', () => {
    const bounds = getUsableDateBounds('10/11/2026', '01/12/2026', FORMAT);
    expect(moment(bounds.minDate).format(FORMAT)).toBe('10/11/2026');
    expect(moment(bounds.maxDate).format(FORMAT)).toBe('01/12/2026');
    expect(bounds.conflict).toBe(false);
    expect(bounds.invalidMin).toBe(false);
    expect(bounds.invalidMax).toBe(false);
  });

  test('min after max is a conflict: BOTH bounds are ignored (the reported repro: 01/12/2026 > 10/11/2026)', () => {
    const bounds = getUsableDateBounds('01/12/2026', '10/11/2026', FORMAT);
    expect(bounds.minDate).toBeNull();
    expect(bounds.maxDate).toBeNull();
    expect(bounds.conflict).toBe(true);
  });

  test('an unparseable bound is ignored and flagged, the other side survives', () => {
    const bounds = getUsableDateBounds('not-a-date', '10/11/2026', FORMAT);
    expect(bounds.minDate).toBeNull();
    expect(bounds.invalidMin).toBe(true);
    expect(moment(bounds.maxDate).format(FORMAT)).toBe('10/11/2026');
    expect(bounds.conflict).toBe(false);
  });

  test('missing bounds are nulls without flags', () => {
    expect(getUsableDateBounds(null, undefined, FORMAT)).toEqual({
      minDate: null,
      maxDate: null,
      conflict: false,
      invalidMin: false,
      invalidMax: false,
    });
  });

  test('min equal to max is a legitimate single-day window', () => {
    const bounds = getUsableDateBounds('10/11/2026', '10/11/2026', FORMAT);
    expect(bounds.conflict).toBe(false);
    expect(bounds.minDate).not.toBeNull();
  });
});

describe('getUsableTimeBounds', () => {
  const TIME_FORMAT = 'hh:mm A';

  test('valid ordered bounds pass through as the original strings', () => {
    expect(getUsableTimeBounds('09:00 AM', '06:00 PM', TIME_FORMAT)).toEqual({
      minTime: '09:00 AM',
      maxTime: '06:00 PM',
      conflict: false,
      invalidMin: false,
      invalidMax: false,
    });
  });

  test('min after max is a conflict: both bounds ignored', () => {
    const bounds = getUsableTimeBounds('18:00', '09:00', 'HH:mm');
    expect(bounds.minTime).toBeNull();
    expect(bounds.maxTime).toBeNull();
    expect(bounds.conflict).toBe(true);
  });

  test('the documented HH:mm shape parses under a 12-hour display format', () => {
    const bounds = getUsableTimeBounds('19:30', '21:00', TIME_FORMAT);
    expect(bounds.minTime).toBe('19:30');
    expect(bounds.invalidMin).toBe(false);
  });

  test('an unparseable bound is ignored and flagged', () => {
    const bounds = getUsableTimeBounds('25:99', '18:00', 'HH:mm');
    expect(bounds.minTime).toBeNull();
    expect(bounds.invalidMin).toBe(true);
    expect(bounds.maxTime).toBe('18:00');
  });
});

describe('isDateValid with ignored (invalid) bounds', () => {
  const FORMAT = 'DD/MM/YY';

  test('nulled-out bounds mean NO bound validation runs — any date is valid', () => {
    // The widgets feed isDateValid the bounds AFTER getUsableDateBounds nulled
    // a conflicting pair, so no "less than minimum"/"greater than maximum"
    // error can fire from a contradictory configuration.
    expect(isDateValid(new Date(2026, 10, 20), { minDate: null, maxDate: null, dateFormat: FORMAT })).toEqual({
      isValid: true,
      validationError: '',
    });
  });

  test('a mandatory empty field still reports the mandatory error', () => {
    const result = isDateValid(null, { minDate: null, maxDate: null, dateFormat: FORMAT, isMandatory: true });
    expect(result).toEqual({ isValid: false, validationError: 'Input is mandatory' });
  });

  test('a selected date outside well-ordered bounds is still an input error', () => {
    const result = isDateValid(new Date(2026, 0, 1), {
      minDate: '10/11/26',
      maxDate: '01/12/26',
      dateFormat: FORMAT,
    });
    expect(result.isValid).toBe(false);
    expect(result.validationError).toContain('less than minimum date');
  });

  test('well-ordered bounds with no selection remain valid', () => {
    expect(isDateValid(null, { minDate: '10/11/26', maxDate: '01/12/26', dateFormat: FORMAT })).toEqual({
      isValid: true,
      validationError: '',
    });
  });
});

// Bug: a Default end date earlier than the Default start date was silently
// swallowed — the defaults effect dropped the end date (exposing null) and no
// rule ever flagged the inversion, while setStartDate/setEndDate CSAs could
// even expose an inverted range as valid. The range order itself must fail
// validation; the widget keeps BOTH dates so the user can see and fix them.
describe('isDateRangeValid ordering', () => {
  const FORMAT = 'DD/MM/YYYY';
  const APRIL_1_2022 = new Date(2022, 3, 1);
  const APRIL_10_2021 = new Date(2021, 3, 10);
  const APRIL_10_2022 = new Date(2022, 3, 10);

  test('start after end is invalid (reported repro: 01/04/2022 → 10/04/2021)', () => {
    expect(isDateRangeValid(APRIL_1_2022, APRIL_10_2021, [], FORMAT)).toEqual({
      isValid: false,
      validationError: 'Start date cannot be greater than end date',
    });
  });

  test('start before end is valid', () => {
    expect(isDateRangeValid(APRIL_1_2022, APRIL_10_2022, [], FORMAT)).toEqual({
      isValid: true,
      validationError: '',
    });
  });

  test('start equal to end is a legitimate single-day range', () => {
    expect(isDateRangeValid(APRIL_1_2022, new Date(2022, 3, 1), [], FORMAT)).toEqual({
      isValid: true,
      validationError: '',
    });
  });

  test('an incomplete range (either side missing) is not judged for order', () => {
    expect(isDateRangeValid(APRIL_1_2022, null, [], FORMAT).isValid).toBe(true);
    expect(isDateRangeValid(null, APRIL_10_2022, [], FORMAT).isValid).toBe(true);
  });

  test('the ordering error takes precedence over the excluded-dates check', () => {
    expect(isDateRangeValid(APRIL_1_2022, APRIL_10_2021, ['05/04/2022'], FORMAT)).toEqual({
      isValid: false,
      validationError: 'Start date cannot be greater than end date',
    });
  });

  test('an ordered range containing an excluded date still reports the exclusion as an input error', () => {
    expect(isDateRangeValid(APRIL_1_2022, APRIL_10_2022, ['05/04/2022'], FORMAT)).toEqual({
      isValid: false,
      validationError: 'Selected date range is excluded',
    });
  });
});

// Bug: "Time picker: uses the current minutes when only the hour is selected."
// With nothing selected, the time dropdown seeded its base from `moment()` —
// NOW — then set only the clicked unit, so picking hour 02 at xx:39 produced
// 02:39 (and leaked the current seconds too). An empty widget must base time
// edits on today's MIDNIGHT so unpicked units read 00.
describe('getTimeSelectionBase', () => {
  test('with nothing selected, the base is today at midnight, not now', () => {
    const base = getTimeSelectionBase(null);
    expect(base.format('HH:mm:ss')).toBe('00:00:00');
    expect(base.isSame(moment(), 'day')).toBe(true);
  });

  test('picking only an hour on an empty widget yields HH:00 (the reported repro)', () => {
    const updated = getTimeSelectionBase(null).set('hours', 2);
    expect(updated.format('H:mm')).toBe('2:00');
  });

  test('an existing selection is used as the base unchanged', () => {
    const existing = moment('2026-10-05 14:25:36', 'YYYY-MM-DD HH:mm:ss').valueOf();
    expect(getTimeSelectionBase(existing).valueOf()).toBe(existing);
  });
});

// Bug: "Date range picker: Unable to display an error message when an invalid
// date is entered." Typed text that failed to parse was silently dropped and
// reverted on blur — validation never saw it, so no message could exist. These
// parsers classify the committed text: hasError marks genuinely unparseable
// input (kept on screen with an "Invalid date" message), while incomplete
// prefix typing stays error-free. Parsing is lenient, matching committed input
// and defaults.
describe('parseDateInputText', () => {
  const FORMAT = 'DD/MM/YYYY';

  test('garbage text is an error (the reported repro)', () => {
    expect(parseDateInputText('abc', FORMAT)).toEqual({ isEmpty: false, hasError: true, date: null });
  });

  test('an overflowing date like 99/99/9999 is an error', () => {
    expect(parseDateInputText('99/99/9999', FORMAT).hasError).toBe(true);
  });

  test('a valid date parses leniently', () => {
    const result = parseDateInputText('1/4/2022', FORMAT);
    expect(result.hasError).toBe(false);
    expect(moment(result.date).format(FORMAT)).toBe('01/04/2022');
  });

  test('empty text is empty, not an error', () => {
    expect(parseDateInputText('', FORMAT)).toEqual({ isEmpty: true, hasError: false, date: null });
    expect(parseDateInputText('   ', FORMAT).isEmpty).toBe(true);
  });
});

describe('parseDateRangeInput', () => {
  const FORMAT = 'DD/MM/YYYY';

  test('a full valid range splits on the display arrow and completes', () => {
    const result = parseDateRangeInput('01/04/2022 → 10/04/2022', FORMAT);
    expect(result.hasError).toBe(false);
    expect(result.isComplete).toBe(true);
    expect(moment(result.startDate).format(FORMAT)).toBe('01/04/2022');
    expect(moment(result.endDate).format(FORMAT)).toBe('10/04/2022');
  });

  test('dash-containing formats parse typed ranges (the old split("-") broke DD-MM-YYYY)', () => {
    const result = parseDateRangeInput('02-04-2022 → 10-04-2022', 'DD-MM-YYYY');
    expect(result.hasError).toBe(false);
    expect(result.isComplete).toBe(true);
    expect(moment(result.startDate).format('DD-MM-YYYY')).toBe('02-04-2022');
  });

  test('a garbage side is an error', () => {
    expect(parseDateRangeInput('abc → 10/04/2022', FORMAT).hasError).toBe(true);
    expect(parseDateRangeInput('01/04/2022 → xyz', FORMAT).hasError).toBe(true);
  });

  test('incomplete prefix typing is neither an error nor complete', () => {
    const startOnly = parseDateRangeInput('01/04/2022', FORMAT);
    expect(startOnly.hasError).toBe(false);
    expect(startOnly.isComplete).toBe(false);

    const arrowBlankEnd = parseDateRangeInput('01/04/2022 → ', FORMAT);
    expect(arrowBlankEnd.hasError).toBe(false);
    expect(arrowBlankEnd.isComplete).toBe(false);
  });

  test('empty text is empty, not an error', () => {
    expect(parseDateRangeInput('', FORMAT).isEmpty).toBe(true);
    expect(parseDateRangeInput('  ', FORMAT).isEmpty).toBe(true);
  });

  test('more than one arrow is an error', () => {
    expect(parseDateRangeInput('01/04/2022 → 05/04/2022 → 10/04/2022', FORMAT).hasError).toBe(true);
  });
});

/**
 * DatetimePickerV2 `setStoreTimezone` / `setDisplayTimezone` CSAs
 * (customer bug, 2026-10-05): the CSAs looked timezones up ONLY by the
 * inspector dropdown label ('+05:30', 'UTC'), while the property, the exposed
 * `storeTimezone`/`displayTimezone` variables, and therefore anything a user
 * copies out of the inspector hold IANA ids ('Etc/UTC', 'Asia/Colombo') — so
 * `setStoreTimezone(components.x.storeTimezone)` was a silent no-op.
 *
 * `resolveTimezone` is the single lookup both CSAs go through: it accepts a
 * label OR an option-list IANA id and returns the IANA id, undefined for
 * anything outside the widget's timezone vocabulary.
 */
describe('resolveTimezone (DatetimePickerV2 timezone CSA lookup)', () => {
  test('resolves an inspector offset label to its IANA id', () => {
    expect(resolveTimezone('+05:30')).toBe('Asia/Colombo');
    expect(resolveTimezone('-12:00')).toBe('Etc/GMT+12');
    expect(resolveTimezone('+00:00')).toBe('UTC');
  });

  test('accepts ANY valid IANA zone id — the dropdowns list region names and zones sharing an offset stay distinct', () => {
    expect(resolveTimezone('Etc/UTC')).toBe('Etc/UTC');
    expect(resolveTimezone('Asia/Colombo')).toBe('Asia/Colombo');
    // Not in the curated option list, but a real zone (the reported repro:
    // Asia/Kolkata and Asia/Colombo are both +05:30 yet different regions).
    expect(resolveTimezone('Asia/Kolkata')).toBe('Asia/Kolkata');
    expect(resolveTimezone('Etc/GMT-12')).toBe('Etc/GMT-12');
  });

  test("the 'UTC' label/id collision resolves as the label (both mean +00:00)", () => {
    expect(resolveTimezone('UTC')).toBe('Etc/UTC');
  });

  test('anything moment-tz does not know is undefined (CSA no-op)', () => {
    expect(resolveTimezone('Mars/Olympus')).toBeUndefined();
    expect(resolveTimezone('')).toBeUndefined();
    expect(resolveTimezone(null)).toBeUndefined();
    expect(resolveTimezone(undefined)).toBeUndefined();
    expect(resolveTimezone(42)).toBeUndefined();
  });
});

/**
 * Parity contract behind the `setStoreTimezone` CSA fix (user-approved
 * 2026-10-05, option A): the CSA must do what editing the Store timezone
 * property does — re-interpret the default value string in the new zone, so
 * the instant (unixTimestamp) and the serialized `value` both move. These
 * pin the math the widget wires together: parse-in-zone + serialize-in-zone.
 * The timezone pairs are chosen from fixed-offset zones so results are
 * machine-timezone-independent.
 */
describe('store-timezone parity math (setStoreTimezone CSA)', () => {
  const DEFAULT = '01/01/2022 12:00';
  const DISPLAY_FORMAT = 'DD/MM/YYYY HH:mm';

  test('re-parsing the default value in a new store zone moves the instant', () => {
    const inUtc = getUnixTimeFromParsedDate(DEFAULT, 'Etc/UTC', DISPLAY_FORMAT);
    const inColombo = getUnixTimeFromParsedDate(DEFAULT, 'Asia/Colombo', DISPLAY_FORMAT);
    // 12:00 wall clock in +05:30 is 5h30m EARLIER as an instant than 12:00 UTC.
    expect(inUtc - inColombo).toBe(5.5 * 60 * 60 * 1000);
    expect(moment.utc(inUtc).format('YYYY-MM-DD HH:mm')).toBe('2022-01-01 12:00');
    expect(moment.utc(inColombo).format('YYYY-MM-DD HH:mm')).toBe('2022-01-01 06:30');
  });

  test('the re-parsed instant serializes in the new zone with the default wall clock intact', () => {
    const inColombo = getUnixTimeFromParsedDate(DEFAULT, 'Asia/Colombo', DISPLAY_FORMAT);
    expect(convertToIsoWithTimezoneOffset(inColombo, 'Asia/Colombo')).toBe('2022-01-01T12:00:00.000+05:30');
    const inGmtMinus12 = getUnixTimeFromParsedDate(DEFAULT, 'Etc/GMT-12', DISPLAY_FORMAT);
    expect(convertToIsoWithTimezoneOffset(inGmtMinus12, 'Etc/GMT-12')).toBe('2022-01-01T12:00:00.000+12:00');
  });
});
