import React, { useState } from 'react';
import useTextColor from '../_hooks/useTextColor';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { DatePickerRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/DatePickerRenderer';
import { noop } from 'lodash';

export const DatepickerColumn = ({
  value,
  onChange,
  readOnly,
  isTimeChecked,
  isEditable,
  dateDisplayFormat,
  parseDateFormat,
  timeZoneValue,
  timeZoneDisplay,
  isDateSelectionEnabled,
  isTwentyFourHrFormatEnabled,
  disabledDates,
  unixTimestamp = 'seconds',
  parseInUnixTimestamp,
  column,
  darkMode,
  textColor,
  id,
  containerWidth,
}) => {
  const cellTextColor = useTextColor(id, textColor);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const validateDates = useStore((state) => state.validateDates, shallow);
  const { isValid, validationError } = validateDates({
    validationObject: {
      minDate: {
        value: column.minDate,
      },
      maxDate: {
        value: column.maxDate,
      },
      minTime: {
        value: column.minTime,
      },
      maxTime: {
        value: column.maxTime,
      },
      parseDateFormat: {
        value: column.parseDateFormat,
      },
      customRule: {
        value: column.customRule,
      },
    },
    widgetValue: value,
    customResolveObjects: { cellValue: value },
  });

  return (
    <DatePickerRenderer
      value={value}
      onChange={onChange}
      isEditable={isEditable && !readOnly}
      dateDisplayFormat={dateDisplayFormat}
      parseDateFormat={parseDateFormat}
      isTimeChecked={isTimeChecked}
      isDateSelectionEnabled={isDateSelectionEnabled}
      isTwentyFourHrFormatEnabled={isTwentyFourHrFormatEnabled}
      timeZoneValue={timeZoneValue}
      timeZoneDisplay={timeZoneDisplay}
      unixTimestamp={unixTimestamp}
      parseInUnixTimestamp={parseInUnixTimestamp}
      disabledDates={disabledDates}
      textColor={cellTextColor}
      darkMode={darkMode}
      containerWidth={containerWidth}
      isValid={isValid}
      validationError={validationError}
      setIsInputFocused={setIsInputFocused}
      isInputFocused={isInputFocused}
    />
  );
};
