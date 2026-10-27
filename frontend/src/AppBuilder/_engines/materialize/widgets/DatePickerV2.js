/**
 * DatePickerV2: what it exposes, and its state actions (see ./index.js). Widgets/Date/DatePickerV2.jsx uses these, and
 * so do the hooks every date input shares (Widgets/Date/hooks): the date and time pickers (./TimePicker.js,
 * ./DatetimePickerV2.js, ./DaterangePicker.js) build on what is here.
 *
 * Parsing a value with moment fills in what its format leaves out (no year: this year) from the current date, as the
 * widget's own parse does: these run the same calls, so a drawn and an undrawn row agree on the same day.
 */
import moment from 'moment-timezone';
import {
  convertToIsoWithTimezoneOffset,
  getFormattedSelectTimestamp,
  getSelectedTimestampFromUnixTimestamp,
  getUnixTime,
  isDateValid,
} from '@/AppBuilder/Widgets/Date/utils';

// ─── What every date input shares (Widgets/Date/hooks) ─────────────────────────────────────────────────────────────

/** What useDatetimeInput exposes on mount: the input's states, label and whether it is mandatory, as resolved. */
export const dateInputValuesOf = ({ properties, validation = {} }) => ({
  isVisible: properties.visibility,
  isLoading: properties.loadingState,
  isDisabled: properties.disabledState,
  label: properties.label,
  isMandatory: validation.mandatory,
});

/** useDatetimeInput's state actions: they expose their value as given. */
export const dateInputActions = {
  setVisibility: (current, [value]) => ({ isVisible: value }),
  setLoading: (current, [value]) => ({ isLoading: value }),
  setDisable: (current, [value]) => ({ isDisabled: value }),
};

/** A min or max date as the calendar holds it: the date parsed with the input's format (an invalid Date if it isn't). */
export const dateBoundOf = (date, dateFormat) => moment(date, dateFormat).toDate();

/** The disabled dates the calendar excludes: the ones that parse with the input's format. */
export const excludedDatesOf = (disabledDates, dateFormat) =>
  Array.isArray(disabledDates)
    ? disabledDates
        .filter((date) => moment(date, dateFormat).isValid())
        .map((date) => moment(date, dateFormat).toDate())
    : [];

/** What useDateInput exposes on mount: the min and max dates as resolved. */
export const dateBoundsValuesOf = (validation = {}) => ({ minDate: validation.minDate, maxDate: validation.maxDate });

/** What useDateInput validates a date against, from the resolved validation. */
export const dateValidationOf = (validation = {}, dateFormat) => ({
  minDate: dateBoundOf(validation.minDate, dateFormat),
  maxDate: dateBoundOf(validation.maxDate, dateFormat),
  excludedDates: excludedDatesOf(validation.disabledDates, dateFormat),
  customRule: validation.customRule,
  isMandatory: validation.mandatory,
  dateFormat,
});

// The actions of the shared hooks that need the drawn widget. setFocus opens the calendar and focuses the field (and
// fires onFocus), setBlur closes it (onBlur); the bounds actions leave bounds only the drawn widget keeps.
export const dateInputLiveActions = ['setFocus', 'setBlur'];
export const dateBoundsLiveActions = ['setMinDate', 'setMaxDate', 'setDisabledDates', 'clearDisabledDates'];

// ─── DatePickerV2 ──────────────────────────────────────────────────────────────────────────────────────────────────

/** The timestamps the picker starts with, from its default value: `{ unixTimestamp, selectedTimestamp }`. */
export const datePickerV2TimestampsOf = ({ defaultValue, dateFormat }) => {
  const unixTimestamp = defaultValue ? getUnixTime(defaultValue, dateFormat) : null;
  return {
    unixTimestamp,
    selectedTimestamp: defaultValue ? getSelectedTimestampFromUnixTimestamp(unixTimestamp) : null,
  };
};

/**
 * The picker's validation status for its date: against the resolved validation's rules, with the bounds it holds
 * (`held`: its bounds actions change them; on mount, the validation's).
 */
export const datePickerV2StatusOf = (selectedTimestamp, validation, dateFormat, held) =>
  isDateValid(selectedTimestamp, { ...dateValidationOf(validation, dateFormat), ...held });

/** What the picker exposes for its timestamps (all but isValid, which it validates after mounting). */
export const datePickerV2ValuesOf = ({ unixTimestamp, selectedTimestamp }, dateFormat) => ({
  value: convertToIsoWithTimezoneOffset(unixTimestamp, moment.tz.guess()),
  selectedDate: getFormattedSelectTimestamp(selectedTimestamp, dateFormat),
  unixTimestamp,
  displayValue: getFormattedSelectTimestamp(selectedTimestamp, dateFormat),
  dateFormat,
});

export const datePickerV2Exposure = {
  initial: ({ properties, validation = {} }) => {
    const timestamps = datePickerV2TimestampsOf(properties);
    return {
      ...dateInputValuesOf({ properties, validation }),
      ...dateBoundsValuesOf(validation),
      ...datePickerV2ValuesOf(timestamps, properties.dateFormat),
      // Exposed as valid on mount; the widget then validates its date, and that is what the store holds once mounted.
      isValid: datePickerV2StatusOf(timestamps.selectedTimestamp, validation, properties.dateFormat).isValid,
    };
  },
  actions: dateInputActions,
  // The value actions leave a selected date only the drawn widget keeps; setDate falls back to now when it has none.
  liveActions: [
    ...dateInputLiveActions,
    ...dateBoundsLiveActions,
    'setValue',
    'clearValue',
    'setValueInTimestamp',
    'setDate',
  ],
  keepsRow: ['setFocus', ...dateBoundsLiveActions, 'setValue', 'clearValue', 'setValueInTimestamp', 'setDate'],
};
