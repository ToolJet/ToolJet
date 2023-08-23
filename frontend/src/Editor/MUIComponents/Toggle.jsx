import React, { useEffect } from 'react';
import { FormControlLabel } from '@mui/material';
import SwitchMUI from '@mui/material/Switch';

export const ToggleSwitch = ({ height, properties, styles, fireEvent, setExposedVariable, darkMode, dataCy }) => {
  // definition props
  const defaultValue = properties.defaultValue ?? false;
  const [on, setOn] = React.useState(defaultValue);
  const label = properties.label;

  const { visibility, disabledState, toggleSwitchColor, boxShadow } = styles;
  const textColor = darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor;

  function toggleValue(e) {
    const toggled = e.target.checked;
    setExposedVariable('value', toggled);
    fireEvent('onChange');
  }

  // Exposing the initially set false value once on load
  useEffect(() => {
    setExposedVariable('value', defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setOn(defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  const toggle = () => setOn(!on);

  return (
    <FormControlLabel
      className="form-check-label form-check-label col-auto my-auto"
      sx={{ width: '100%' }}
      control={
        <SwitchMUI
          checked={on}
          onClick={toggle}
          onChange={toggleValue}
          disabled={disabledState}
          sx={{
            '& .MuiSwitch-switchBase': {
              '&.Mui-checked': {
                color: 'white',
                '& + .MuiSwitch-track': {
                  backgroundColor: toggleSwitchColor,
                  opacity: 1,
                  border: 0,
                },
                '&.Mui-disabled + .MuiSwitch-track': {
                  opacity: 0.5,
                },
              },
            },
          }}
        />
      }
      label={label}
      style={{ color: textColor, height, display: visibility ? '' : 'none', boxShadow }}
    />
  );
};
