import React, { useEffect } from 'react';
import { FormControlLabel } from '@mui/material';
import MuiCheckbox from '@mui/material/Checkbox';

export const Checkbox = function Checkbox({
  height,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  registerAction,
  darkMode,
  dataCy,
}) {
  const defaultValueFromProperties = properties.defaultValue ?? false;
  const [defaultValue, setDefaultvalue] = React.useState(defaultValueFromProperties);
  const [checked, setChecked] = React.useState(defaultValueFromProperties);
  const { label } = properties;
  const { visibility, disabledState, checkboxColor, boxShadow } = styles;
  const textColor = darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor;

  function toggleValue(e) {
    const isChecked = e.target.checked;
    setChecked(isChecked);
    setExposedVariable('value', isChecked);
    if (isChecked) {
      fireEvent('onCheck');
    } else {
      fireEvent('onUnCheck');
    }
  }
  useEffect(() => {
    setExposedVariable('value', defaultValueFromProperties);
    setDefaultvalue(defaultValueFromProperties);
    setChecked(defaultValueFromProperties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValueFromProperties]);

  registerAction(
    'setChecked',
    async function (status) {
      setExposedVariable('value', status).then(() => (status ? fireEvent('onCheck') : fireEvent('onUnCheck')));
      setChecked(status);
    },
    [setChecked]
  );

  return (
    <FormControlLabel
      style={{
        height,
        display: visibility ? '' : 'none',
        boxShadow,
        color: textColor,
        width: ' 100% ',
      }}
      control={
        <MuiCheckbox
          defaultChecked={defaultValue}
          checked={checked}
          onClick={(e) => {
            toggleValue(e);
          }}
          name="muiCheckbox"
          style={{ color: checked ? `${checkboxColor}` : 'white', marginTop: '1px' }}
        />
      }
      label={label}
      disabled={disabledState}
    />
  );
};
