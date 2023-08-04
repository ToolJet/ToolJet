import React, { useRef, useEffect } from 'react';
import config from 'config';
import { Box, CircularProgress, TextField } from '@mui/material';

export const NumberInput = function NumberInput({
  height,
  properties,
  styles,
  setExposedVariable,
  darkMode,
  fireEvent,
  dataCy,
}) {
  const { visibility, borderRadius, borderColor, backgroundColor, boxShadow } = styles;

  const textColor = darkMode && ['#232e3c', '#000000ff'].includes(styles.textColor) ? '#fff' : styles.textColor;

  const [value, setValue] = React.useState(Number(parseFloat(properties.value).toFixed(properties.decimalPlaces)));
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(Number(parseFloat(value).toFixed(properties.decimalPlaces)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.decimalPlaces]);

  useEffect(() => {
    setValue(Number(parseFloat(properties.value).toFixed(properties.decimalPlaces)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

  const handleChange = (e) => {
    if (
      !isNaN(parseFloat(properties.minValue)) &&
      !isNaN(parseFloat(properties.maxValue)) &&
      parseFloat(properties.minValue) > parseFloat(properties.maxValue)
    ) {
      setValue(Number(parseFloat(properties.maxValue)).toFixed(properties.decimalPlaces));
    } else if (
      !isNaN(parseFloat(properties.maxValue)) &&
      parseFloat(e.target.value) > parseFloat(properties.maxValue)
    ) {
      setValue(Number(parseFloat(properties.maxValue)).toFixed(properties.decimalPlaces));
    } else if (
      !isNaN(parseFloat(properties.minValue)) &&
      parseFloat(e.target.value) < parseFloat(properties.minValue)
    ) {
      setValue(Number(parseFloat(properties.minValue)).toFixed(properties.decimalPlaces));
    } else {
      setValue(Number(parseFloat(e.target.value)));
    }
    fireEvent('onChange');
  };
  const handleBlur = (e) => {
    setValue(Number(parseFloat(e.target.value).toFixed(properties.decimalPlaces)));
  };

  useEffect(() => {
    if (!isNaN(value)) {
      setExposedVariable('value', value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const computedStyles = {
    height,
    display: visibility ? '' : 'none',
    borderRadius: `${borderRadius}px`,
    borderColor,
    color: textColor,
    backgroundColor: darkMode && ['#ffffff', '#ffffffff'].includes(backgroundColor) ? '#000000' : backgroundColor,
    boxShadow,
  };

  return (
    <>
      {config.UI_LIB === 'tooljet' && (
        <>
          {!properties.loadingState && (
            <input
              ref={inputRef}
              disabled={styles.disabledState}
              onChange={handleChange}
              onBlur={handleBlur}
              type="number"
              className="form-control"
              placeholder={properties.placeholder}
              style={computedStyles}
              value={value}
              data-cy={dataCy}
            />
          )}
          {properties.loadingState === true && (
            <div style={{ width: '100%' }}>
              <center>
                <div
                  className="spinner-border"
                  role="status"
                ></div>
              </center>
            </div>
          )}
        </>
      )}
      {config.UI_LIB === 'mui' && (
        <>
          {!properties.loadingState && (
            <TextField
              id={inputRef}
              variant="outlined"
              type="number"
              disabled={styles.disabledState}
              onChange={handleChange}
              onBlur={handleBlur}
              label={properties.placeholder}
              defaultValue={value}
              value={value}
              className="form-control"
              sx={{
                width: '100%',
                borderRadius: `${borderRadius}px`,
                '& .MuiInputLabel-root': {
                  color: borderColor,
                  display: visibility ? '' : 'none',
                },
                '& .MuiOutlinedInput-root': {
                  height,
                  display: visibility ? '' : 'none',
                  color: textColor,
                  borderRadius: `${borderRadius}px`,
                  backgroundColor:
                    darkMode && ['#ffffff', '#ffffffff'].includes(backgroundColor) ? '#000000' : backgroundColor,
                  boxShadow,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: borderColor,
                },
              }}
            />
          )}
          {properties.loadingState === true && (
            <Box
              role="status"
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <CircularProgress />
            </Box>
          )}
        </>
      )}
    </>
  );
};
