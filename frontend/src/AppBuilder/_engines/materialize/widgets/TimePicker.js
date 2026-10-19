/**
 * TimePicker: what it exposes, and its state actions (see ./index.js). Widgets/Date/TimePicker.jsx and
 * Widgets/Date/hooks/useTimeInput.js use these; it shares the date inputs' (./DatePickerV2.js).
 *
 * A time parses to today at that time (moment fills in the date), as in the widget; only the time, in its format, is
 * exposed.
 */
import { getFormattedSelectTimestamp, getUnixTime, isDateValid } from '@/AppBuilder/Widgets/Date/utils';
import { dateInputActions, dateInputLiveActions, dateInputValuesOf } from './DatePickerV2';

/** What useTimeInput exposes on mount, and validates against: the min and max times as resolved. */
export const timeBoundsValuesOf = (validation = {}) => ({ minTime: validation.minTime, maxTime: validation.maxTime });

/** What the picker validates a time against, from the resolved validation. */
export const timeValidationOf = (validation = {}, timeFormat) => ({
  ...timeBoundsValuesOf(validation),
  customRule: validation.customRule,
  isMandatory: validation.mandatory,
  timeFormat,
});

// useTimeInput's actions leave bounds only the drawn widget keeps.
export const timeBoundsLiveActions = ['setMinTime', 'setMaxTime'];

/** The timestamp the picker starts with, from its default value. */
export const timePickerTimestampOf = ({ defaultValue, timeFormat }) =>
  defaultValue ? getUnixTime(defaultValue, timeFormat) : null;

/**
 * The picker's validation status for its time: against the resolved validation's rules, with the bounds it holds
 * (`held`: its bounds actions change them; on mount, the validation's).
 */
export const timePickerStatusOf = (selectedTimestamp, validation, timeFormat, held) =>
  isDateValid(selectedTimestamp, { ...timeValidationOf(validation, timeFormat), ...held });

/** What the picker exposes for its timestamp (all but isValid, which it validates after mounting). */
export const timePickerValuesOf = (selectedTimestamp, timeFormat) => ({
  value: selectedTimestamp ? getFormattedSelectTimestamp(selectedTimestamp, timeFormat) : null,
  timeFormat,
});

export const timePickerExposure = {
  initial: ({ properties, validation = {} }) => {
    const { timeFormat } = properties;
    const selectedTimestamp = timePickerTimestampOf(properties);
    return {
      ...dateInputValuesOf({ properties, validation }),
      ...timeBoundsValuesOf(validation),
      ...timePickerValuesOf(selectedTimestamp, timeFormat),
      // Exposed as valid on mount; the widget then validates its time, and that is what the store holds once mounted.
      isValid: timePickerStatusOf(selectedTimestamp, validation, timeFormat).isValid,
    };
  },
  actions: dateInputActions,
  // The value actions leave a selected time only the drawn widget keeps.
  liveActions: [...dateInputLiveActions, ...timeBoundsLiveActions, 'setValue', 'clearValue'],
  keepsRow: ['setFocus', ...timeBoundsLiveActions, 'setValue', 'clearValue'],
};
