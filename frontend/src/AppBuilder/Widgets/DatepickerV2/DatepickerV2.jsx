import React, { useState } from 'react';
import DatePickerComponent from 'react-datepicker';

export const DatepickerV2 = ({
  height,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  validate,
  onComponentClick,
  id,
  darkMode,
  fireEvent,
  dataCy,
}) => {
  const { defaultValue } = properties;
  const [date, setDate] = useState(defaultValue);
  console.log('Here is the date', date);
  return (
    <div>
      <DatePickerComponent
        customInput={<input className={`tj-text-input-widget validation-without-icon`} />}
        value={date}
        onChange={setDate}
      />
    </div>
  );
};
