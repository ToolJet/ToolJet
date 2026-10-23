/**
 * DaterangePicker: what it exposes, and its state actions (see ./index.js). Widgets/Date/DaterangePicker.jsx uses
 * these; it shares the date inputs' (./DatePickerV2.js).
 */
import moment from 'moment-timezone';
import { isDateRangeValid, isDateValid } from '@/AppBuilder/Widgets/Date/utils';
import {
  dateBoundsLiveActions,
  dateBoundsValuesOf,
  dateInputActions,
  dateInputLiveActions,
  dateInputValuesOf,
  dateValidationOf,
} from './DatePickerV2';

/** A default start or end date as the picker holds it: the date parsed with its format, or null if it doesn't parse. */
export const rangeDateOf = (date, format) => {
  const parsed = moment(date, format);
  return parsed.isValid() ? parsed.toDate() : null;
};

/** What the picker exposes for its dates (all but isValid, which it validates after mounting). */
export const daterangePickerValuesOf = (startDate, endDate, format) => ({
  startDate: moment(startDate).format(format),
  endDate: moment(endDate).format(format),
  selectedDateRange: `${moment(startDate).format(format)} - ${moment(endDate).format(format)}`,
  startDateInUnix: startDate ? moment(startDate).valueOf() : null,
  endDateInUnix: endDate ? moment(endDate).valueOf() : null,
  dateFormat: format,
});

/** The range's validation status: each date against the bounds and rules, then the range against the excluded dates. */
export const dateRangeValidationOf = (
  startDate,
  endDate,
  { minDate, maxDate, customRule, isMandatory, excludedDates, format }
) => {
  const rules = { minDate, maxDate, customRule, isMandatory, dateFormat: format };
  const startStatus = isDateValid(startDate, rules);
  if (!startStatus.isValid) return startStatus;
  const endStatus = isDateValid(endDate, rules);
  if (!endStatus.isValid) return endStatus;
  return isDateRangeValid(startDate, endDate, excludedDates, format);
};

/**
 * The picker's validation status for its range: against the resolved validation's rules, with the bounds it holds
 * (`held`: its bounds actions change them; on mount, the validation's).
 */
export const daterangePickerStatusOf = (startDate, endDate, validation, format, held) =>
  dateRangeValidationOf(startDate, endDate, { ...dateValidationOf(validation, format), ...held, format });

const rangeActions = ['setStartDate', 'clearStartDate', 'setEndDate', 'clearEndDate', 'setDateRange', 'clearDateRange'];

export const daterangePickerExposure = {
  initial: ({ properties, validation = {} }) => {
    const { format } = properties;
    const startDate = rangeDateOf(properties.defaultStartDate, format);
    const endDate = rangeDateOf(properties.defaultEndDate, format);
    return {
      ...dateInputValuesOf({ properties, validation }),
      ...dateBoundsValuesOf(validation),
      ...daterangePickerValuesOf(startDate, endDate, format),
      // Exposed as valid on mount; the widget then validates its range, and that is what the store holds once mounted.
      isValid: daterangePickerStatusOf(startDate, endDate, validation, format).isValid,
    };
  },
  actions: dateInputActions,
  // The range actions leave dates only the drawn widget keeps.
  liveActions: [...dateInputLiveActions, ...dateBoundsLiveActions, ...rangeActions],
  keepsRow: ['setFocus', ...dateBoundsLiveActions, ...rangeActions],
};
