import React, { useEffect, useState } from 'react';
import DatePickerComponent from 'react-datepicker';
import moment from 'moment';
import 'react-datepicker/dist/react-datepicker.css';
import config from 'config';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DateTimePicker } from '@mui/x-date-pickers';
import 'dayjs/locale/es';
import 'moment/locale/es';

export const Datepicker = function Datepicker({
  height,
  properties,
  styles,
  exposedVariables,
  setExposedVariable,
  validate,
  onComponentClick,
  component,
  id,
  darkMode,
  fireEvent,
  dataCy,
}) {
  moment.locale(config.LANGUAGE);
  const { enableTime, enableDate, defaultValue, disabledDates } = properties;
  const format = typeof properties.format === 'string' ? properties.format : '';
  const { visibility, disabledState, borderRadius, boxShadow } = styles;

  const [date, setDate] = useState(null);
  const [excludedDates, setExcludedDates] = useState([]);

  const selectedDateFormat = enableTime ? `${format} LT` : format;

  const computeDateString = (date) => {
    if (enableDate) {
      return moment(date).format(selectedDateFormat);
    }

    if (!enableDate && enableTime) {
      return moment(date).format('LT');
    }
  };

  const onDateChange = (date) => {
    setDate(date);
    const dateString = computeDateString(date);
    setExposedVariable('value', dateString).then(() => {
      fireEvent('onSelect');
    });
  };

  useEffect(() => {
    const dateMomentInstance = defaultValue && moment(defaultValue, selectedDateFormat);
    if (dateMomentInstance && dateMomentInstance.isValid()) {
      setDate(dateMomentInstance.toDate());
      setExposedVariable('value', defaultValue);
    } else {
      setDate(null);
      setExposedVariable('value', undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  useEffect(() => {
    if (Array.isArray(disabledDates) && disabledDates.length > 0) {
      const _exluded = [];
      disabledDates?.map((item) => {
        if (moment(item, format).isValid()) {
          _exluded.push(moment(item, format).toDate());
        }
      });
      setExcludedDates(_exluded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledDates, format]);

  const validationData = validate(exposedVariables.value);
  const { isValid, validationError } = validationData;

  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  const isDateDisabled = (date) => {
    return excludedDates.some((disabledDate) => moment(disabledDate).isSame(date, 'day'));
  };

  const fromPickerToMoment = (value) => {
    return moment(value);
  };

  const fromMomentToPicker = (value) => {
    return value.toDate();
  };
  return (
    <>
      {config.UI_LIB === 'tooljet' && (
        <div
          data-disabled={disabledState}
          className={`datepicker-widget ${darkMode && 'theme-dark'}`}
          data-cy={dataCy}
          style={{
            height,
            display: visibility ? '' : 'none',
            background: 'none',
          }}
        >
          <DatePickerComponent
            className={`input-field form-control ${!isValid ? 'is-invalid' : ''} validation-without-icon px-2 ${
              darkMode ? 'bg-dark color-white' : 'bg-light'
            }`}
            selected={date}
            value={date !== null ? computeDateString(date) : 'select date'}
            onChange={(date) => onDateChange(date)}
            showTimeInput={enableTime ? true : false}
            showTimeSelectOnly={enableDate ? false : true}
            onFocus={(event) => {
              onComponentClick(id, component, event);
            }}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            excludeDates={excludedDates}
            customInput={<input style={{ borderRadius: `${borderRadius}px`, boxShadow, height }} />}
            timeInputLabel={<div className={`${darkMode && 'theme-dark'}`}>Time</div>}
          />

          <div
            data-cy="date-picker-invalid-feedback"
            className={`invalid-feedback ${isValid ? '' : 'd-flex'}`}
          >
            {validationError}
          </div>
        </div>
      )}
      {config.UI_LIB === 'mui' && (
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <DateTimePicker
            label="Seleccione Fecha"
            format={selectedDateFormat}
            views={!enableTime ? ['year', 'month', 'day'] : undefined}
            disableOpenPicker={!enableDate}
            disabled={disabledState}
            shouldDisableDate={(date) => isDateDisabled(date)}
            value={date ? fromPickerToMoment(date) : null}
            onChange={(newValue) => onDateChange(fromMomentToPicker(newValue))}
            sx={{
              width: '100%',
              display: visibility ? '' : 'none',
              '& .MuiOutlinedInput-root': {
                height,
                minWidth: '176px',
                minHeight: '36px',
                borderRadius: `${borderRadius}px`,
                boxShadow: boxShadow,
              },
            }}
          />
        </LocalizationProvider>
      )}
    </>
  );
};
