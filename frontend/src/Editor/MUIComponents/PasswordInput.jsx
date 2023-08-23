import React from 'react';
import { TextField } from '@mui/material';
import { localizeMessage } from '@/_helpers/localize';

export const PasswordInput = ({
  height,
  validate,
  properties,
  styles,
  setExposedVariable,
  darkMode,
  component,
  fireEvent,
  dataCy,
}) => {
  const { visibility, disabledState, borderRadius, backgroundColor, boxShadow } = styles;

  const placeholder = properties.placeholder;

  const [passwordValue, setPasswordValue] = React.useState('');
  let { isValid, validationError } = validate(passwordValue);

  React.useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passwordValue, isValid]);

  return (
    <TextField
      disabled={disabledState}
      onChange={(e) => {
        setPasswordValue(e.target.value);
        setExposedVariable('value', e.target.value).then(() => fireEvent('onChange'));
      }}
      type="password"
      variant="outlined"
      value={passwordValue}
      sx={{
        width: '100%',
        '& .MuiOutlinedInput-root': {
          height,
          display: visibility ? '' : 'none',
          borderRadius: `${borderRadius}px`,
          backgroundColor,
          boxShadow,
        },
      }}
      error={!isValid}
      helperText={localizeMessage(validationError)}
      placeholder={placeholder}
    />
  );
};
