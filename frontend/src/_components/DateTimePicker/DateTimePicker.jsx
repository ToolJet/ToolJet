import React from 'react';
import { Datepicker } from '@/Editor/Components/Datepicker';

export const DateTimePicker = ({ height = '387px', width = '260px' }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const properties = {
    enableTime: true,
    enableDate: true,
    format: 'MM/DD/YYYY',
    defaultValue: '01/01/2022',
    disabledDates: [],
  };

  const styles = {
    visibility: true,
    disabledState: false,
    borderRadius: 5,
  };

  const exposedVariables = {
    value: '',
    isValid: true,
  };

  const setExposedVariable = (key, value) => {
    console.log(`Set ${key} to ${value}`);
  };

  const validate = (value) => {
    return { isValid: true, validationError: '' };
  };

  return (
    <div style={{ height, width }}>
      <Datepicker
        darkMode={darkMode}
        properties={properties}
        styles={styles}
        exposedVariables={exposedVariables}
        setExposedVariable={setExposedVariable}
        validate={validate}
        component="DatepickerComponent"
        isTjdb={true}
      />
    </div>
  );
};
