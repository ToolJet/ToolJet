import React, { useEffect } from 'react';
import { DatePickerRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/DatePickerRenderer';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

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
  onValidationChange,
}) => {
  // Extract field-specific settings
  const dateDisplayFormat = field?.dateFormat;
  const isTimeChecked = field?.isTimeChecked || false;
  const isTwentyFourHrFormatEnabled = field?.isTwentyFourHrFormatEnabled || false;
  const isDateSelectionEnabled = field?.isDateSelectionEnabled ?? true;

  // Same validateDates store action the Table widget's Datepicker column uses, keeping
  // minDate/maxDate/minTime/maxTime behavior identical across both widgets.
  const validateDates = useStore((state) => state.validateDates, shallow);
  const { isValid, validationError } = validateDates({
    validationObject: {
      minDate: { value: field?.minDate },
      maxDate: { value: field?.maxDate },
      minTime: { value: field?.minTime },
      maxTime: { value: field?.maxTime },
      parseDateFormat: { value: field?.parseDateFormat },
      customRule: { value: field?.customRule },
    },
    widgetValue: value,
    customResolveObjects: { cellValue: value },
  });

  useEffect(() => {
    onValidationChange?.({ isValid, validationError });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid, validationError]);

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
      isValid={isValid}
      validationError={validationError}
      widgetType="KeyValuePair"
    />
  );
};

export default DatepickerField;
