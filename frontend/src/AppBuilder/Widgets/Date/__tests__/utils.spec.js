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
  isMinMaxDateValid,
  isMinMaxTimeValid,
  isDateValid,
  isDateRangeValid,
  parseTimeBound,
  getTimeSelectionBase,
  isUsableDateFormat,
  isUsableTimeFormat,
  parseDateInputText,
  parseDateRangeInput,
  resolveTimezone,
  getUnixTimeFromParsedDate,
  convertToIsoWithTimezoneOffset,
  isRangeSelectionComplete,
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
describe('isMinMaxDateValid', () => {
  const FORMAT = 'DD/MM/YY';

  test('min later than max is invalid (reported repro: 01/12/26 > 10/11/26)', () => {
    expect(isMinMaxDateValid('01/12/26', '10/11/26', FORMAT)).toBe(false);
  });

  test('min before max is valid', () => {
    expect(isMinMaxDateValid('10/11/26', '01/12/26', FORMAT)).toBe(true);
  });

  test('min equal to max is a legitimate single-day window', () => {
    expect(isMinMaxDateValid('10/11/26', '10/11/26', FORMAT)).toBe(true);
  });

  test('Date-object bounds (the shape useDateInput feeds the widgets) are compared', () => {
    expect(isMinMaxDateValid(new Date(2026, 11, 1), new Date(2026, 10, 10), FORMAT)).toBe(false);
    expect(isMinMaxDateValid(new Date(2026, 10, 10), new Date(2026, 11, 1), FORMAT)).toBe(true);
  });

  test('a missing bound never conflicts', () => {
    expect(isMinMaxDateValid(null, '10/11/26', FORMAT)).toBe(true);
    expect(isMinMaxDateValid('01/12/26', null, FORMAT)).toBe(true);
    expect(isMinMaxDateValid(undefined, undefined, FORMAT)).toBe(true);
  });

  test('an unparseable bound never conflicts (no false positives)', () => {
    expect(isMinMaxDateValid('not-a-date', '10/11/26', FORMAT)).toBe(true);
  });
});

describe('isMinMaxTimeValid', () => {
  const TIME_FORMAT = 'HH:mm';

  test('min time later than max time is invalid', () => {
    expect(isMinMaxTimeValid('18:00', '09:00', TIME_FORMAT)).toBe(false);
  });

  test('min time before max time is valid', () => {
    expect(isMinMaxTimeValid('09:00', '18:00', TIME_FORMAT)).toBe(true);
  });

  test('equal times are a legitimate single-minute window', () => {
    expect(isMinMaxTimeValid('09:00', '09:00', TIME_FORMAT)).toBe(true);
  });

  test('a missing or unparseable bound never conflicts', () => {
    expect(isMinMaxTimeValid(null, '18:00', TIME_FORMAT)).toBe(true);
    expect(isMinMaxTimeValid('25:99', '18:00', TIME_FORMAT)).toBe(true);
  });
});

describe('isDateValid with contradictory bounds', () => {
  const FORMAT = 'DD/MM/YY';

  test('min > max fails validation even with NO date selected (the reported repro)', () => {
    const result = isDateValid(null, { minDate: '01/12/26', maxDate: '10/11/26', dateFormat: FORMAT });
    expect(result.isValid).toBe(false);
    expect(result.validationError).toBe('Minimum date (01/12/26) cannot be greater than maximum date (10/11/26)');
    // Configuration contradictions bypass the blur gate and display immediately.
    expect(result.isConfigError).toBe(true);
  });

  test('min > max takes precedence over the misleading per-date error when a date IS selected', () => {
    const result = isDateValid(new Date(2026, 10, 20), {
      minDate: '01/12/26',
      maxDate: '10/11/26',
      dateFormat: FORMAT,
    });
    expect(result.isValid).toBe(false);
    expect(result.validationError).toBe('Minimum date (01/12/26) cannot be greater than maximum date (10/11/26)');
    expect(result.isConfigError).toBe(true);
  });

  test('a mandatory empty field still reports the mandatory error first', () => {
    const result = isDateValid(null, {
      minDate: '01/12/26',
      maxDate: '10/11/26',
      dateFormat: FORMAT,
      isMandatory: true,
    });
    expect(result).toEqual({ isValid: false, validationError: 'Input is mandatory' });
  });

  test('min time > max time fails validation with no time selected (TimePicker shape)', () => {
    const result = isDateValid(null, { minTime: '18:00', maxTime: '09:00', timeFormat: 'HH:mm' });
    expect(result.isValid).toBe(false);
    expect(result.validationError).toBe('Minimum time (18:00) cannot be greater than maximum time (09:00)');
    expect(result.isConfigError).toBe(true);
  });

  test('a selected date outside well-ordered bounds is an input error, not a config error', () => {
    const result = isDateValid(new Date(2026, 0, 1), {
      minDate: '10/11/26',
      maxDate: '01/12/26',
      dateFormat: FORMAT,
    });
    expect(result.isValid).toBe(false);
    expect(result.validationError).toContain('less than minimum date');
    expect(result.isConfigError).toBeUndefined();
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
      isConfigError: true,
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
      isConfigError: true,
    });
  });

  test('an ordered range containing an excluded date still reports the exclusion as an input error', () => {
    expect(isDateRangeValid(APRIL_1_2022, APRIL_10_2022, ['05/04/2022'], FORMAT)).toEqual({
      isValid: false,
      validationError: 'Selected date range is excluded',
    });
  });
});

// Bug: "Time picker: unable to select PM and other [hours] as per the min and
// max time." The dropdown's bound parsing was a naive split(':'): with
// Min '07:00 AM' / Max '07:00 PM' the meridiem was discarded (max hour became
// 07, disabling PM and hours 8-12 outright) and the minute bound became the
// string '00 PM'. Bounds must be parsed meridiem-aware against the widget's
// time format, with the documented 'HH:mm' shape as fallback.
describe('parseTimeBound', () => {
  test("'07:00 PM' under 'hh:mm A' is 19:00 (the reported repro)", () => {
    expect(parseTimeBound('07:00 PM', 'hh:mm A', { hour: 23, minute: 59 })).toEqual({ hour: 19, minute: 0 });
  });

  test("'07:00 AM' under 'hh:mm A' is 07:00", () => {
    expect(parseTimeBound('07:00 AM', 'hh:mm A', { hour: 0, minute: 0 })).toEqual({ hour: 7, minute: 0 });
  });

  test("a 24-hour 'HH:mm' bound still parses when the display format is 12-hour", () => {
    expect(parseTimeBound('19:30', 'hh:mm A', { hour: 23, minute: 59 })).toEqual({ hour: 19, minute: 30 });
  });

  test("a bound matching the widget's 24-hour format parses directly", () => {
    expect(parseTimeBound('18:45', 'HH:mm', { hour: 23, minute: 59 })).toEqual({ hour: 18, minute: 45 });
  });

  test('a Date-object bound uses its own hours/minutes', () => {
    expect(parseTimeBound(new Date(2026, 0, 1, 21, 15), 'hh:mm A', { hour: 23, minute: 59 })).toEqual({
      hour: 21,
      minute: 15,
    });
  });

  test('a missing bound returns the fallback', () => {
    expect(parseTimeBound(null, 'hh:mm A', { hour: 0, minute: 0 })).toEqual({ hour: 0, minute: 0 });
    expect(parseTimeBound('', 'HH:mm', { hour: 23, minute: 59 })).toEqual({ hour: 23, minute: 59 });
  });

  test('an unparseable bound returns the fallback instead of NaN gating', () => {
    expect(parseTimeBound('not-a-time', 'hh:mm A', { hour: 23, minute: 59 })).toEqual({ hour: 23, minute: 59 });
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

// Bug: "Date range Picker: updated invalid date with invalid format" — a Format
// binding like {{42}} resolves to "42", which moment treats as a pure literal:
// every display becomes the text "42" and nothing can parse, with no error
// anywhere. A format with no recognizable tokens is a configuration error; the
// widget falls back to its shipped default format so the field stays usable.
describe('isUsableDateFormat / isUsableTimeFormat', () => {
  test('a tokenless format like "42" is unusable (the reported repro)', () => {
    expect(isUsableDateFormat('42')).toBe(false);
  });

  test('standard date formats are usable', () => {
    expect(isUsableDateFormat('DD/MM/YYYY')).toBe(true);
    expect(isUsableDateFormat('DD-MM-YYYY')).toBe(true);
    expect(isUsableDateFormat('MM/YYYY')).toBe(true);
  });

  test('empty or non-string formats are unusable', () => {
    expect(isUsableDateFormat('')).toBe(false);
    expect(isUsableDateFormat(undefined)).toBe(false);
    expect(isUsableDateFormat(42)).toBe(false);
  });

  test('time formats need an hour or minute token', () => {
    expect(isUsableTimeFormat('HH:mm')).toBe(true);
    expect(isUsableTimeFormat('hh:mm A')).toBe(true);
    expect(isUsableTimeFormat('42')).toBe(false);
    expect(isUsableTimeFormat('')).toBe(false);
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

  test('accepts an option-list IANA id as-is, so exposed values round-trip into the CSA', () => {
    expect(resolveTimezone('Etc/UTC')).toBe('Etc/UTC');
    expect(resolveTimezone('Asia/Colombo')).toBe('Asia/Colombo');
    expect(resolveTimezone('Etc/GMT-12')).toBe('Etc/GMT-12');
  });

  test("the 'UTC' label/id collision resolves as the label (both mean +00:00)", () => {
    expect(resolveTimezone('UTC')).toBe('Etc/UTC');
  });

  test('anything outside the widget timezone vocabulary is undefined (CSA no-op)', () => {
    // Valid IANA zone, but not one the widget offers — the inspector could
    // never produce it, so the CSA must not accept it either.
    expect(resolveTimezone('Asia/Kolkata')).toBeUndefined();
    expect(resolveTimezone('Mars/Olympus')).toBeUndefined();
    expect(resolveTimezone('')).toBeUndefined();
    expect(resolveTimezone(null)).toBeUndefined();
    expect(resolveTimezone(undefined)).toBeUndefined();
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

/**
 * DaterangePicker onSelect firing gate (customer bug, 2026-10-05, user-approved
 * option A): react-datepicker's range mode calls the widget's onChange on BOTH
 * calendar clicks — `[start, null]` after the first, `[start, end]` after the
 * second — so onSelect fired twice per range selection. The approved contract:
 * onSelect fires exactly once, on the interaction that COMPLETES the range.
 * A start-only click is silent, and the clear button is silent (zero dates is
 * not a completed range — matching the sibling date widgets' silent clear).
 *
 * `isRangeSelectionComplete` is the gate the widget's onChange now consults
 * before firing.
 */
describe('isRangeSelectionComplete (DaterangePicker onSelect gate)', () => {
  const start = moment('01-04-2022', FORMAT).toDate();
  const end = moment('10-04-2022', FORMAT).toDate();

  test('both dates present → complete, onSelect may fire', () => {
    expect(isRangeSelectionComplete(start, end)).toBe(true);
  });

  test('first calendar click (start only) is incomplete → silent', () => {
    expect(isRangeSelectionComplete(start, null)).toBe(false);
  });

  test('end-only (backwards selection in progress) is incomplete → silent', () => {
    expect(isRangeSelectionComplete(null, end)).toBe(false);
  });

  test('cleared range (both null) is incomplete → clear button is silent', () => {
    expect(isRangeSelectionComplete(null, null)).toBe(false);
  });

  test('an invalid Date object does not count as a completed end', () => {
    expect(isRangeSelectionComplete(start, new Date('nonsense'))).toBe(false);
    expect(isRangeSelectionComplete(new Date('nonsense'), end)).toBe(false);
  });
});
