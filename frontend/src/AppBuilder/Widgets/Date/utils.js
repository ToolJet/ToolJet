import moment from 'moment-timezone';

// Canonical timezone vocabulary for the DatetimePickerV2 widget: the inspector
// dropdowns render `name` (a fixed offset label) and persist `value` (an IANA
// id) into the storeTimezone/displayTimezone properties and exposed variables.
export const TIMEZONE_OPTIONS = [
  { name: 'UTC', value: 'Etc/UTC' },
  { name: '-12:00', value: 'Etc/GMT+12' },
  { name: '-11:00', value: 'Etc/GMT+11' },
  { name: '-10:00', value: 'Pacific/Honolulu' },
  { name: '-09:30', value: 'Pacific/Marquesas' },
  { name: '-09:00', value: 'America/Anchorage' },
  { name: '-08:00', value: 'America/Santa_Isabel' },
  { name: '-07:00', value: 'America/Chihuahua' },
  { name: '-06:00', value: 'America/Guatemala' },
  { name: '-05:00', value: 'America/Bogota' },
  { name: '-04:00', value: 'America/Halifax' },
  { name: '-03:30', value: 'America/St_Johns' },
  { name: '-03:00', value: 'America/Sao_Paulo' },
  { name: '-02:00', value: 'Etc/GMT+2' },
  { name: '-01:00', value: 'Atlantic/Cape_Verde' },
  { name: '+00:00', value: 'UTC' },
  { name: '+01:00', value: 'Europe/Berlin' },
  { name: '+02:00', value: 'Africa/Gaborone' },
  { name: '+03:00', value: 'Asia/Baghdad' },
  { name: '+03:30', value: 'Asia/Tehran' },
  { name: '+04:00', value: 'Asia/Muscat' },
  { name: '+04:30', value: 'Asia/Kabul' },
  { name: '+05:00', value: 'Asia/Tashkent' },
  { name: '+05:30', value: 'Asia/Colombo' },
  { name: '+05:45', value: 'Asia/Kathmandu' },
  { name: '+06:00', value: 'Asia/Almaty' },
  { name: '+06:30', value: 'Asia/Yangon' },
  { name: '+07:00', value: 'Asia/Bangkok' },
  { name: '+08:00', value: 'Asia/Makassar' },
  { name: '+09:00', value: 'Asia/Seoul' },
  { name: '+09:30', value: 'Australia/Darwin' },
  { name: '+10:00', value: 'Pacific/Chuuk' },
  { name: '+11:00', value: 'Pacific/Pohnpei' },
  { name: '+12:00', value: 'Etc/GMT-12' },
  { name: '+13:00', value: 'Pacific/Auckland' },
];

const TIMEZONE_LABEL_TO_ID = TIMEZONE_OPTIONS.reduce((acc, curr) => {
  acc[curr.name] = curr.value;
  return acc;
}, {});

const TIMEZONE_IDS = new Set(TIMEZONE_OPTIONS.map((option) => option.value));

// Lookup for the setStoreTimezone/setDisplayTimezone CSAs. Accepts an
// inspector offset label ('+05:30', 'UTC') or an option-list IANA id
// ('Etc/UTC', 'Asia/Colombo' — what the property and the exposed variable
// hold, so inspector values round-trip into the CSA). Labels win the 'UTC'
// label/id collision; both mean +00:00. Anything outside the widget's
// vocabulary resolves to undefined and the CSA no-ops.
export const resolveTimezone = (timezone) =>
  TIMEZONE_LABEL_TO_ID[timezone] ?? (TIMEZONE_IDS.has(timezone) ? timezone : undefined);

// DaterangePicker onSelect gate (user-approved 2026-10-05): react-datepicker's
// range mode reports every calendar click — `[start, null]` after the first,
// `[start, end]` after the second — which made onSelect fire twice per range.
// onSelect fires only on the interaction that COMPLETES the range; a
// start-only click and the clear button (zero dates) are silent, matching the
// sibling date widgets' silent clear.
export const isRangeSelectionComplete = (startDate, endDate) =>
  startDate != null && endDate != null && moment(startDate).isValid() && moment(endDate).isValid();

// This function is used to get the unix time from a parsed date and timezone
// It takes the date converts into a moment object which will now have local timezone
// The date should be date = utc + selected timezone offset
// But when we create moment object its date = incorrectMomentObject + local timezone offset
// utc + selected timezone offset = incorrectMomentObject + local timezone offset
// utc = incorrectMomentObject + local timezone offset - selected timezone offset

export const getOffset = (timezone = moment.tz.guess()) => {
  return -moment.tz.zone(timezone).utcOffset(1577836800000);
};

export const getUnixTimeFromParsedDate = (date, timezone, displayFormat) => {
  const momentObj = moment(date, displayFormat);
  const localOffset = getOffset();
  const selectedOffset = getOffset(timezone);
  const modifiedTime = momentObj.add(localOffset - selectedOffset, 'minutes');
  const val = modifiedTime.valueOf();
  return val === 'Invalid date' ? null : val;
};

export const getSelectedTimestampFromUnixTimestampV2 = (unixTimestamp, timezone) => {
  const momentObj = moment(unixTimestamp);
  const localOffset = getOffset();
  const selectedOffset = getOffset(timezone);
  const modifiedTime = momentObj.add(selectedOffset - localOffset, 'minutes');
  const val = modifiedTime.valueOf();
  return val === 'Invalid date' ? null : val;
};

export const getFormattedSelectTimestamp = (selectedTime, displayFormat) => {
  const val = moment(selectedTime).format(displayFormat);
  return val === 'Invalid date' ? null : val;
};

// DaterangePicker exposed-value formatting.
//
// Legacy components — migrated with `properties.legacyInvalidDates = {{true}}`
// — keep the historical `moment(x).format(format)` output, where a missing or
// unparseable date is exposed as the literal "Invalid date". Corrected
// behavior (flag omitted or cleared) exposes `null` for a missing/invalid
// date, and `selectedDateRange` only once BOTH ends are valid, matching the
// widget's clearStartDate/clearEndDate convention for incomplete ranges.
export const formatExposedDate = (date, format, legacyInvalidDates = false) => {
  if (legacyInvalidDates) return moment(date).format(format);
  // `date != null` guards undefined explicitly: moment(undefined) is "now",
  // which would expose today's date instead of an empty value.
  return date != null && moment(date).isValid() ? moment(date).format(format) : null;
};

export const formatExposedDateRange = (startDate, endDate, format, legacyInvalidDates = false) => {
  if (legacyInvalidDates) return `${moment(startDate).format(format)} - ${moment(endDate).format(format)}`;
  const start = formatExposedDate(startDate, format);
  const end = formatExposedDate(endDate, format);
  return start !== null && end !== null ? `${start} - ${end}` : null;
};

// The above functions are the new ones

export const getUnixTime = (date, displayFormat) => {
  if (!date && date !== 0) return null;
  const numberDate = Number(date);
  if (!isNaN(numberDate) && numberDate > 99999) return Number(date);
  const momentObj = moment(date, displayFormat);
  const val = momentObj.utc().valueOf();
  return val === 'Invalid date' ? null : val;
};

export const getSelectedTimestampFromUnixTimestamp = (
  unixTimestamp,
  displayTimezone = moment.tz.guess(),
  isTimezoneEnabled = false
) => {
  if (!isTimezoneEnabled || !unixTimestamp) return unixTimestamp;
  const localTimeOffset = getOffset();
  const selectedTimeOffset = getOffset(displayTimezone);
  const modifiedTime = moment(unixTimestamp).subtract(localTimeOffset - selectedTimeOffset, 'minutes');
  return modifiedTime.valueOf() === 'Invalid date' ? null : modifiedTime.valueOf();
};

export const getUnixTimestampFromSelectedTimestamp = (selectedTime, displayTimezone = moment.tz.guess()) => {
  if (!selectedTime) return selectedTime;
  const localTimeOffset = getOffset();
  const selectedTimeOffset = getOffset(displayTimezone);
  const modifiedTime = moment(selectedTime).add(localTimeOffset - selectedTimeOffset, 'minutes');
  return modifiedTime.valueOf() === 'Invalid date' ? null : modifiedTime.valueOf();
};

export const convertToIsoWithTimezoneOffset = (timestamp, timezone) => {
  const val = moment.tz(timestamp, timezone).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
  return val === 'Invalid date' ? null : val;
};

export const is24HourFormat = (displayFormat) => {
  const uses24HourTokens = /H{1,2}/.test(displayFormat);
  const hasAmPm = /[aA]/.test(displayFormat);
  return uses24HourTokens && !hasAmPm;
};

export const isMinTimeValid = (minDate, selectedDate, dateFormat) => {
  if (!minDate) return true;

  const parsedMinDate = moment(minDate, dateFormat, true);
  if (!parsedMinDate.isValid()) return true;

  const selectedHours = moment(selectedDate).hours();
  const selectedMinutes = moment(selectedDate).minutes();

  const selectedTime = parsedMinDate.clone().hours(selectedHours).minutes(selectedMinutes);

  return selectedTime.isSameOrAfter(parsedMinDate);
};

export const isMaxTimeValid = (minDate, selectedDate, dateFormat) => {
  if (!minDate) return true;

  const parsedMaxDate = moment(minDate, dateFormat, true);
  if (!parsedMaxDate.isValid()) return true;

  const selectedHours = moment(selectedDate).hours();
  const selectedMinutes = moment(selectedDate).minutes();

  const selectedTime = parsedMaxDate.clone().hours(selectedHours).minutes(selectedMinutes);

  return selectedTime.isSameOrBefore(parsedMaxDate);
};

export const isMaxDateValid = (maxDate, selectedDate, dateFormat) => {
  if (!maxDate) return true;
  const parsedSelectedDate = moment(selectedDate);
  const parsedMaxDate = moment(maxDate, dateFormat, true);

  if (!parsedSelectedDate.isValid() || !parsedMaxDate.isValid()) {
    return true;
  }

  return parsedSelectedDate.isSameOrBefore(parsedMaxDate);
};

export const isMinDateValid = (minDate, selectedDate, dateFormat) => {
  if (!minDate) return true;
  const parsedSelectedDate = moment(selectedDate);
  const parsedMinDate = moment(minDate, dateFormat, true);

  if (!parsedSelectedDate.isValid() || !parsedMinDate.isValid()) {
    return true;
  }

  return parsedSelectedDate.isSameOrAfter(parsedMinDate);
};

export const isCustomRuleValid = (customRule) => {
  if (typeof customRule === 'string' && customRule !== '') {
    return false;
  }
  return true;
};

// A minimum bound later than the maximum bound is a contradictory
// configuration: no date (or time) can satisfy both, the calendar disables
// every day, and the per-bound rules below — which only judge a SELECTED
// value — never fire. The pair itself must fail validation so the widget can
// surface an error message. Bounds may arrive as strings (raw validation
// config) or Date objects (useDateInput state); a missing or unparseable
// bound never conflicts — those are the per-bound rules' concern.
export const isMinMaxDateValid = (minDate, maxDate, dateFormat) => {
  if (!minDate || !maxDate) return true;
  const parsedMinDate = moment(minDate, dateFormat, true);
  const parsedMaxDate = moment(maxDate, dateFormat, true);
  if (!parsedMinDate.isValid() || !parsedMaxDate.isValid()) return true;
  return !parsedMinDate.isAfter(parsedMaxDate);
};

export const isMinMaxTimeValid = (minTime, maxTime, timeFormat) => {
  if (!minTime || !maxTime) return true;
  const parsedMinTime = moment(minTime, timeFormat, true);
  const parsedMaxTime = moment(maxTime, timeFormat, true);
  if (!parsedMinTime.isValid() || !parsedMaxTime.isValid()) return true;
  return !parsedMinTime.isAfter(parsedMaxTime);
};

// The time dropdown's min/max bounds arrive as strings (the validation fields
// document 'HH:mm', but users naturally enter the widget's own display format,
// e.g. '07:00 PM' under 'hh:mm A') or as Date objects. A naive split(':')
// discarded the meridiem — Max '07:00 PM' became hour 7, disabling PM and
// every afternoon hour — and left the minute bound as the string '00 PM'.
// Parse strictly against the widget's time format first, then the documented
// 'HH:mm' shape; anything missing or unparseable keeps the fallback bound
// instead of NaN-gating the dropdown.
export const parseTimeBound = (bound, timeFormat, fallback) => {
  if (!bound) return fallback;
  if (bound instanceof Date) return { hour: bound.getHours(), minute: bound.getMinutes() };
  const parsed = moment(bound, [timeFormat, 'HH:mm'], true);
  return parsed.isValid() ? { hour: parsed.hour(), minute: parsed.minute() } : fallback;
};

// Base for a time-dropdown unit change. With nothing selected the base must be
// today's MIDNIGHT: seeding from `moment()` (now) leaked the current
// wall-clock minutes/seconds into the value when only an hour was picked
// (clicking 02 at xx:39 produced 02:39).
export const getTimeSelectionBase = (selectedTimestamp) => {
  const base = moment(selectedTimestamp ?? NaN);
  return base.isValid() ? base : moment().startOf('day');
};

// A format with no recognizable tokens (e.g. a `{{42}}` binding resolving to
// "42") makes every display a literal and every parse fail, silently. It is a
// configuration error: the widgets show "Invalid date/time format" immediately
// (isConfigError channel) and fall back to their shipped default format so the
// field stays usable.
export const isUsableDateFormat = (format) => typeof format === 'string' && /[dmy]/i.test(format);

export const isUsableTimeFormat = (format) => typeof format === 'string' && /[hm]/i.test(format);

// Typed text for a single date/time field, parsed with the same leniency as
// committed input and defaults. `hasError` marks genuinely unparseable text,
// which the widget keeps on screen with an "Invalid date" message instead of
// silently reverting it on blur (the reported bug: no error could ever show
// because unparseable text never reached state or validation).
export const parseDateInputText = (text, format) => {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (!trimmed) return { isEmpty: true, hasError: false, date: null };
  const parsed = moment(trimmed, format);
  return parsed.isValid()
    ? { isEmpty: false, hasError: false, date: parsed.toDate() }
    : { isEmpty: false, hasError: true, date: null };
};

// Typed text for the range field. Splits on the display arrow
// ("01/04/2022 → 10/04/2022") — the previous split('-') broke every format
// containing dashes (DD-MM-YYYY). A missing side or missing arrow is
// incomplete prefix typing, not an error; `isComplete` gates committing the
// pair to state.
export const parseDateRangeInput = (text, format) => {
  const result = { isEmpty: false, hasError: false, isComplete: false, startDate: null, endDate: null };
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (!trimmed) return { ...result, isEmpty: true };
  const parts = trimmed.split('→').map((part) => part.trim());
  if (parts.length > 2) return { ...result, hasError: true };
  const [startText = '', endText = ''] = parts;
  const parsedStart = startText ? moment(startText, format) : null;
  const parsedEnd = endText ? moment(endText, format) : null;
  if ((parsedStart && !parsedStart.isValid()) || (parsedEnd && !parsedEnd.isValid())) {
    return { ...result, hasError: true };
  }
  return {
    ...result,
    startDate: parsedStart ? parsedStart.toDate() : null,
    endDate: parsedEnd ? parsedEnd.toDate() : null,
    isComplete: Boolean(parsedStart && parsedEnd),
  };
};

export const isMandatoryValid = (isMandatory, selectedDate) => {
  if (isMandatory && !selectedDate) return false;
  return true;
};

export const isDateRangeValid = (startDate, endDate, excludedDates, format) => {
  const parsedStartDate = moment(startDate, format, true);
  const parsedEndDate = moment(endDate, format, true);

  if (!parsedStartDate.isValid() || !parsedEndDate.isValid()) {
    return { isValid: true, validationError: '' };
  }

  // An inverted range (e.g. Default end date earlier than Default start date,
  // or one built via the setStartDate/setEndDate actions) used to pass
  // silently; the order itself is a validation failure. `isConfigError` marks
  // it as a configuration contradiction, which the widgets display immediately
  // instead of waiting for the blur/submit gate input errors use.
  if (parsedStartDate.isAfter(parsedEndDate)) {
    return { isValid: false, validationError: 'Start date cannot be greater than end date', isConfigError: true };
  }

  if (excludedDates && excludedDates.length) {
    const isExcluded = excludedDates.find((date) =>
      moment(date, format, true).isBetween(parsedStartDate, parsedEndDate, 'day', '[]')
    );
    if (isExcluded) return { isValid: false, validationError: 'Selected date range is excluded' };
  }

  return { isValid: true, validationError: '' };
};

export const isDateValid = (selectedDate, validation) => {
  const { minDate, maxDate, minTime, maxTime, customRule, excludedDates, isMandatory, dateFormat, timeFormat } =
    validation;

  if (!isMandatoryValid(isMandatory, selectedDate)) return { isValid: false, validationError: 'Input is mandatory' };

  if (!isMinMaxDateValid(minDate, maxDate, dateFormat))
    return {
      isValid: false,
      validationError: `Minimum date (${moment(minDate, dateFormat).format(
        dateFormat
      )}) cannot be greater than maximum date (${moment(maxDate, dateFormat).format(dateFormat)})`,
      // Configuration contradiction: displayed immediately, bypassing the blur gate.
      isConfigError: true,
    };

  if (!isMinMaxTimeValid(minTime, maxTime, timeFormat))
    return {
      isValid: false,
      validationError: `Minimum time (${minTime}) cannot be greater than maximum time (${maxTime})`,
      isConfigError: true,
    };

  if (!isMinDateValid(minDate, selectedDate, dateFormat) && moment(minDate, dateFormat).isValid())
    return {
      isValid: false,
      validationError: `Selected date is less than minimum date (${moment(minDate, dateFormat).format(dateFormat)})`,
    };

  if (!isMaxDateValid(maxDate, selectedDate, dateFormat) && moment(maxDate, dateFormat).isValid())
    return {
      isValid: false,
      validationError: `Selected date is greater than maximum date (${moment(maxDate, dateFormat).format(dateFormat)})`,
    };

  if (!isMinTimeValid(minTime, selectedDate, timeFormat))
    return { isValid: false, validationError: `Selected time is less than minimum time (${minTime})` };

  if (!isMaxTimeValid(maxTime, selectedDate, timeFormat))
    return { isValid: false, validationError: `Selected time is greater than maximum time (${maxTime})` };

  if (!isCustomRuleValid(customRule)) return { isValid: false, validationError: customRule };

  if (excludedDates && excludedDates.length) {
    const isExcluded = excludedDates.find((date) => moment(date, dateFormat).isSame(selectedDate, 'day'));
    if (isExcluded) return { isValid: false, validationError: 'Selected date is excluded' };
  }

  return { isValid: true, validationError: '' };
};
