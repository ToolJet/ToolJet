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
  dateFormat = 'MM/DD/YYYY',
  showTimeSelect = false,
  timeFormat = 'HH:mm',
  darkMode = false,
  textColor,
  field,
  id,
  setIsEditing,
  isEditing,
}) => {
  // Extract field-specific settings
  const dateDisplayFormat = field?.dateFormat ?? dateFormat;
  const isTimeChecked = field?.showTimeSelect ?? showTimeSelect;
  const isTwentyFourHrFormatEnabled = (field?.timeFormat ?? timeFormat) === 'HH:mm';
  const isDateSelectionEnabled = field?.isDateSelectionEnabled ?? true;

  return (
    <DatePickerRenderer
      value={value}
      onChange={onChange}
      isEditable={isEditable}
      dateDisplayFormat={dateDisplayFormat}
      parseDateFormat={dateDisplayFormat}
      isTimeChecked={isTimeChecked}
      isDateSelectionEnabled={isDateSelectionEnabled}
      isTwentyFourHrFormatEnabled={isTwentyFourHrFormatEnabled}
      textColor={textColor}
      darkMode={darkMode}
      id={id}
      isInputFocused={isEditing}
      setIsInputFocused={setIsEditing}
      widgetType="KeyValuePair"
    />
  );
};

export default DatepickerField;
