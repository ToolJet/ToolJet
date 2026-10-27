/**
 * DatetimePickerV2: what it exposes, and its state actions (see ./index.js). Widgets/Date/DatetimePickerV2.jsx uses
 * these; it shares the date and time inputs' (./DatePickerV2.js, ./TimePicker.js).
 */
import moment from 'moment-timezone';
import {
  convertToIsoWithTimezoneOffset,
  getFormattedSelectTimestamp,
  getSelectedTimestampFromUnixTimestampV2,
  getUnixTimeFromParsedDate,
  isDateValid,
} from '@/AppBuilder/Widgets/Date/utils';
import {
  dateBoundsLiveActions,
  dateBoundsValuesOf,
  dateInputActions,
  dateInputLiveActions,
  dateInputValuesOf,
  dateValidationOf,
} from './DatePickerV2';
import { timeBoundsLiveActions, timeBoundsValuesOf, timeValidationOf } from './TimePicker';

/**
 * What the picker starts with, from its props: the time zones it shows and stores in (the browser's unless time zones
 * are managed), and its default value's timestamps (`unixTimestamp`, and `selectedTimestamp` as shown).
 */
export const datetimePickerV2StartOf = ({
  defaultValue,
  dateFormat,
  timeFormat,
  isTimezoneEnabled,
  displayTimezone: displayTimezoneProp,
  storeTimezone: storeTimezoneProp,
}) => {
  const displayTimezone = isTimezoneEnabled ? displayTimezoneProp : moment.tz.guess();
  const storeTimezone = isTimezoneEnabled ? storeTimezoneProp : moment.tz.guess();
  const isISOString = defaultValue.includes('T');
  const unixTimestamp = defaultValue
    ? isISOString
      ? moment(defaultValue).valueOf()
      : getUnixTimeFromParsedDate(defaultValue, storeTimezone, `${dateFormat} ${timeFormat}`)
    : null;
  const selectedTimestamp = defaultValue
    ? getSelectedTimestampFromUnixTimestampV2(unixTimestamp, displayTimezone)
    : null;
  return { displayTimezone, storeTimezone, unixTimestamp, selectedTimestamp };
};

/**
 * The picker's validation status for its value: against the resolved validation's date and time rules, with the bounds
 * it holds (`held`: its bounds actions change them; on mount, the validation's).
 */
export const datetimePickerV2StatusOf = (selectedTimestamp, validation, { dateFormat, timeFormat }, held) =>
  isDateValid(selectedTimestamp, {
    ...dateValidationOf(validation, dateFormat),
    ...timeValidationOf(validation, timeFormat),
    ...held,
  });

/** What the picker exposes for what it starts with (all but isValid, which it validates after mounting). */
export const datetimePickerV2ValuesOf = (
  { unixTimestamp, selectedTimestamp, displayTimezone, storeTimezone },
  { dateFormat, timeFormat, isTimezoneEnabled }
) => ({
  value: convertToIsoWithTimezoneOffset(unixTimestamp, storeTimezone),
  selectedTime: getFormattedSelectTimestamp(selectedTimestamp, timeFormat),
  selectedDate: getFormattedSelectTimestamp(selectedTimestamp, dateFormat),
  unixTimestamp,
  displayValue: getFormattedSelectTimestamp(selectedTimestamp, `${dateFormat} ${timeFormat}`),
  dateFormat,
  timeFormat,
  storeTimezone: isTimezoneEnabled ? storeTimezone : moment.tz.guess(),
  displayTimezone: isTimezoneEnabled ? displayTimezone : moment.tz.guess(),
});

const valueActions = ['setValue', 'clearValue', 'setValueInTimestamp', 'setDate', 'setTime'];

export const datetimePickerV2Exposure = {
  initial: ({ properties, validation = {} }) => {
    const start = datetimePickerV2StartOf(properties);
    return {
      ...dateInputValuesOf({ properties, validation }),
      ...dateBoundsValuesOf(validation),
      ...timeBoundsValuesOf(validation),
      ...datetimePickerV2ValuesOf(start, properties),
      // Exposed as valid on mount; the widget then validates its value, and that is what the store holds once mounted.
      isValid: datetimePickerV2StatusOf(start.selectedTimestamp, validation, properties).isValid,
    };
  },
  actions: dateInputActions,
  // The value actions leave a selected date and time only the drawn widget keeps (setDate and setTime fall back to now
  // when it has none); the time zone ones leave time zones its later values are computed in.
  liveActions: [
    ...dateInputLiveActions,
    ...dateBoundsLiveActions,
    ...timeBoundsLiveActions,
    ...valueActions,
    'setDisplayTimezone',
    'setStoreTimezone',
  ],
  keepsRow: [
    'setFocus',
    ...dateBoundsLiveActions,
    ...timeBoundsLiveActions,
    ...valueActions,
    'setDisplayTimezone',
    'setStoreTimezone',
  ],
};
