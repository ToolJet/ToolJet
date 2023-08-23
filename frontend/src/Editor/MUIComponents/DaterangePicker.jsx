import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DateRangePicker as DateRangePickerMUI } from '@mui/x-date-pickers-pro/DateRangePicker';
import { useTranslation } from 'react-i18next';

export const DaterangePicker = function DaterangePicker({
  height,
  properties,
  styles,
  setExposedVariable,
  width,
  darkMode,
  fireEvent,
  dataCy,
}) {
  const { borderRadius, visibility, disabledState } = styles;
  const { defaultStartDate, defaultEndDate } = properties;
  const formatProp = typeof properties.format === 'string' ? properties.format : '';

  const [startDate, setStartDate] = useState(moment(defaultStartDate, formatProp));
  const [endDate, setEndDate] = useState(moment(defaultEndDate, formatProp));
  const [value, setValue] = React.useState([moment(startDate, formatProp), moment(endDate, formatProp)]);

  useEffect(() => {
    setStartDate(moment(defaultStartDate, formatProp));
    setEndDate(moment(defaultEndDate, formatProp));
    setExposedVariable('startDate', startDate.format(formatProp));
    setExposedVariable('endDate', endDate.format(formatProp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultEndDate, defaultStartDate, formatProp]);

  const { t } = useTranslation();

  return (
    <Box
      className={`daterange-picker-widget ${darkMode && 'theme-dark'} p-0`}
      style={{ height, display: visibility ? '' : 'none', borderRadius, background: 'transparent' }}
      data-cy={dataCy}
    >
      {value && formatProp && (
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <DateRangePickerMUI
            disabled={disabledState}
            format={formatProp}
            value={value}
            onChange={(newValue) => setValue(newValue)}
            localeText={{
              start: t('globals.start', 'Start'),
              end: 'Fin',
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                height,
                minHeight: '36px',
                borderRadius: `${borderRadius}px`,
              },
            }}
          />
        </LocalizationProvider>
      )}
    </Box>
  );
};
