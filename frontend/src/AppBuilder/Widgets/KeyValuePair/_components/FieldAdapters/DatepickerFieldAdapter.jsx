import React from 'react';
import { DatePickerRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/DatePickerRenderer';

/**
 * DatepickerFieldAdapter - KeyValuePair adapter for Date display/editing
 *
 * Uses DatePickerRenderer for consistent date rendering across the app.
 */
export const DatepickerField = ({
  value,
  onChange,
  isEditable = false,
  // dateFormat = 'MM/DD/YYYY',
  // showTimeSelect = false,
  // timeFormat = 'HH:mm',
  darkMode = false,
  textColor,
  field,
  id,
  setIsEditing,
  isEditing,
}) => {
  // Extract field-specific settings
  const dateDisplayFormat = field?.dateFormat;
  const isTimeChecked = field?.isTimeChecked || false;
  const isTwentyFourHrFormatEnabled = field?.isTwentyFourHrFormatEnabled || false;
  const isDateSelectionEnabled = field?.isDateSelectionEnabled || true;
  return (
    <DatePickerRenderer
      id={id}
      value={value}
      onChange={onChange}
      isEditable={isEditable}
      dateDisplayFormat={dateDisplayFormat}
      parseDateFormat={field?.parseDateFormat}
      isTimeChecked={isTimeChecked}
      isDateSelectionEnabled={isDateSelectionEnabled}
      isTwentyFourHrFormatEnabled={isTwentyFourHrFormatEnabled}
      timeZoneValue={field?.timeZoneValue}
      timeZoneDisplay={field?.timeZoneDisplay}
      unixTimestamp={field?.unixTimestamp}
      parseInUnixTimestamp={field?.parseInUnixTimestamp}
      disabledDates={field?.disabledDates}
      textColor={textColor}
      darkMode={darkMode}
      isInputFocused={isEditing}
      setIsInputFocused={setIsEditing}
      widgetType="KeyValuePair"
    />
  );
};

export default DatepickerField;
