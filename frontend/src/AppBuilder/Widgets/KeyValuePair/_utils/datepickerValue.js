import moment from 'moment-timezone';
import { getDateTimeFormat, parseDisplayedDate } from '@/AppBuilder/Shared/DataTypes/renderers/DatePickerRenderer';

// DatePickerRenderer emits edits in the field's display format, while data arriving from the app is in the
// parse format. validateDates reads strings with the parse format only, so an edited value has to be turned
// into a Date first. `isEdited` marks values that came out of the renderer (the changeSet, the last emit).
export function toValidatableDateValue(field, value, isEdited) {
  if (typeof value !== 'string' || value === '' || field?.parseInUnixTimestamp) return value;

  const isTimeChecked = field?.isTimeChecked || false;
  const isTwentyFourHrFormatEnabled = field?.isTwentyFourHrFormatEnabled || false;
  const isDateSelectionEnabled = field?.isDateSelectionEnabled ?? true;

  if (!isEdited && field?.parseDateFormat) {
    const parseFormat = getDateTimeFormat(
      field.parseDateFormat,
      isTimeChecked,
      isTwentyFourHrFormatEnabled,
      isDateSelectionEnabled
    );
    if (moment(value, parseFormat, true).isValid()) return value;
  }

  return (
    parseDisplayedDate({
      value,
      dateDisplayFormat: field?.dateFormat,
      isTimeChecked,
      isTwentyFourHrFormatEnabled,
      isDateSelectionEnabled,
      timeZoneDisplay: field?.timeZoneDisplay,
    }) ?? value
  );
}
