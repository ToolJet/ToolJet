import React, { useEffect, forwardRef, useState, useRef } from 'react';
import DatePickerComponent from 'react-datepicker';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import moment from 'moment';
import 'react-datepicker/dist/react-datepicker.css';
import { ToolTip } from '@/_components/ToolTip';
import * as Icons from '@tabler/icons-react';
import Loader from '@/ToolJetUI/Loader/Loader';
import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import './datepicker.scss';
import CustomDatePickerHeader from './CustomDatePickerHeader';
import { valueinTimeStamp } from './datepickerUtils';
import { setHours, setMinutes, set, format } from 'date-fns';

const TjDatepicker = forwardRef(
  ({ value, onClick, styles, setShowValidationError, setIsFocused, fireEvent, dateInputRef }, ref) => {
    return (
      <input
        onBlur={(e) => {
          setShowValidationError(true);
          setIsFocused(false);
          e.stopPropagation();
          fireEvent('onBlur');
          setIsFocused(false);
        }}
        onFocus={(e) => {
          setIsFocused(true);
          e.stopPropagation();
          fireEvent('onFocus');
        }}
        className="custom-input-datepicker"
        value={value}
        onClick={onClick}
        ref={dateInputRef}
        style={styles}
      ></input>
    );
  }
);

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
  isResizing,
}) {
  const { enableTime, enableDate, defaultValue, tooltip, label, loadingState, disabledState, timeFormat, timeZone } =
    properties;
  const format = typeof properties.format === 'string' ? properties.format : '';
  const {
    padding,
    borderRadius,
    borderColor,
    backgroundColor,
    boxShadow,
    width,
    alignment,
    direction,
    color,
    auto,
    textColor,
    errTextColor,
    iconColor,
  } = styles;

  const datepickerinputStyles = {
    backgroundColor: darkMode && ['#fff'].includes(backgroundColor) ? '#313538' : backgroundColor,
    // borderColor: ['#D7DBDF'].includes(borderColor) ? (darkMode ? '#4C5155' : '#D7DBDF') : borderColor,
    borderColor: isFocused
      ? '#3E63DD'
      : ['#D7DBDF'].includes(borderColor)
      ? darkMode
        ? '#4C5155'
        : '#D7DBDF'
      : borderColor,
    color: darkMode && textColor === '#11181C' ? '#ECEDEE' : textColor,
    boxShadow,
    borderRadius: `${borderRadius}px`,
    height: height == 40 ? (padding == 'default' ? '36px' : '40px') : padding == 'default' ? height : height + 4,
    paddingLeft: !component?.definition?.styles?.iconVisibility?.value ? '10px' : '29px',
  };
  const labelRef = useRef();
  const dateInputRef = useRef(null); // Create a ref

  const [date, setDate] = useState(null);
  const [excludedDates, setExcludedDates] = useState([]);
  const [showValidationError, setShowValidationError] = useState(false);

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
    setShowValidationError(true);
    setDate(date);
    const dateString = computeDateString(date);
    setExposedVariable('value', dateString);
    fireEvent('onSelect');
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

  const disabledDates = component?.definition?.validation?.disabledDates?.value;

  useEffect(() => {
    console.log('log---', disabledDates);
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
  const convertTime = (timeInput) => {
    if (timeInput) {
      const [hours, minutes] = timeInput.split(':').map(Number);
      return { hours, minutes };
    }
    return {};
  };
  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';
  const [labelWidth, setLabelWidth] = useState(0);
  const isMandatory = resolveReferences(component?.definition?.validation?.mandatory?.value, currentState) ?? false;
  const [visibility, setVisibility] = useState(properties.visibility);
  const [loading, setLoading] = useState(loadingState);
  const [isFocused, setIsFocused] = useState(false);
  const currentState = useCurrentState();
  const [disable, setDisable] = useState(disabledState || loadingState);
  const [minDate, setMinDate] = useState(component?.definition?.validation?.minDate?.value);
  const [maxDate, setMaxDate] = useState(component?.definition?.validation?.maxDate?.value);
  const [minTime, setMinTime] = useState(convertTime(component?.definition?.validation?.minTime?.value));
  const [maxTime, setMaxTime] = useState(convertTime(component?.definition?.validation?.maxTime?.value));

  console.log('try---', minTime, maxTime);

  // Adjust minTime and maxTime based on the selected date and user input
  // setMinTime(setHours(setMinutes(date, minutes), hours));
  // setMaxTime(setHours(setMinutes(date, minutes + 30), hours));

  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  useEffect(() => {
    setExposedVariable('label', label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  useEffect(() => {
    const unixTimestamp = new Date(date).getTime() / 1000;
    setExposedVariable('valueUnix', unixTimestamp);
    // setExposedVariable('selectedDate', date);
  }, [date]);

  useEffect(() => {
    setExposedVariable('dateFormat', selectedDateFormat);
  }, [selectedDateFormat]);

  useEffect(() => {
    setExposedVariable('timeFormat', timeFormat);
  }, [timeFormat]);

  useEffect(() => {
    setExposedVariable('selectedTimeZone', timeZone);
  }, [timeZone]);

  useEffect(() => {
    if (labelRef.current) {
      const width = labelRef.current.offsetWidth;
      padding == 'default' ? setLabelWidth(width + 7) : setLabelWidth(width + 5);
    } else setLabelWidth(0);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isResizing,
    width,
    auto,
    defaultAlignment,
    component?.definition?.styles?.iconVisibility?.value,
    label?.length,
    isMandatory,
    padding,
    direction,
    alignment,
  ]);
  useEffect(() => {
    disable !== disabledState && setDisable(disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);
  useEffect(() => {
    visibility !== properties.visibility && setVisibility(properties.visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);
  useEffect(() => {
    loading !== loadingState && setLoading(loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    setExposedVariable('isMandatory', isMandatory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMandatory]);

  useEffect(() => {
    setExposedVariable('isLoading', loading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    setExposedVariable('setLoading', async function (loading) {
      setLoading(loading);
      setExposedVariable('isLoading', loading);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.loadingState]);

  useEffect(() => {
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    setExposedVariable('setVisibility', async function (state) {
      setVisibility(state);
      setExposedVariable('isVisible', state);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    setExposedVariable('setDisable', async function (disable) {
      setDisable(disable);
      setExposedVariable('isDisabled', disable);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    setExposedVariable('isDisabled', disable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disable]);

  const iconName = styles.icon; // Replace with the name of the icon you want
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[iconName] == undefined ? Icons['IconHome2'] : Icons[iconName];
  // eslint-disable-next-line import/namespace

  const loaderStyle = {
    right:
      direction === 'right' && defaultAlignment === 'side'
        ? padding == 'default'
          ? `${labelWidth + 14}px`
          : `${labelWidth + 17}px`
        : padding == 'default'
        ? '13px'
        : '11px',
    top: `${defaultAlignment === 'top' ? '53%' : ''}`,
    transform: alignment == 'top' && label?.length == 0 && 'translateY(-50%)',
  };

  // CSA's

  // clearValue
  useEffect(() => {
    setExposedVariable('clearValue', async function () {
      setDate(null);
      setExposedVariable('value', null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // setValue

  useEffect(() => {
    setExposedVariable('setValue', async function (value) {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        setDate(parsedDate);
      }
      setExposedVariable('value', value);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // setDate
  useEffect(() => {
    setExposedVariable('setDate', async function (value) {
      // const newDate = moment(value); // Change the date as needed
      // const originalDate = new Date('Sat Jan 01 2022 00:00:00 GMT+0530');

      const dateObject = new Date(value);
      const formattedDate = format(dateObject, 'dd/mm/yyyy');

      const month = formattedDate.getMonth() + 1; // Months are 0-indexed, so add 1
      const day = formattedDate.getDate();
      const year = formattedDate.getFullYear();
      const newDate = set(new Date(), {
        year: year,
        month: month, // Months are zero-based, so May is 4
        date: day,
        hours: date?.getHours(),
        minutes: date?.getMinutes(),
      });
      console.log('Date----', newDate);
      setDate(newDate);
      setExposedVariable('value', newDate);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    // console.log('Date----', date);
  }, [date]);

  const handleSetTime = (userInputTime) => {
    const [hours, minutes] = userInputTime.split(':');
    const newDate = new Date(date);
    newDate.setHours(parseInt(hours, 10));
    newDate.setMinutes(parseInt(minutes, 10));
    setDate(newDate);
    setExposedVariable('value', newDate);
  };

  // setTime
  useEffect(() => {
    setExposedVariable('setTime', async function (value) {
      handleSetTime(value);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setExposedVariable('setDisabledDates', async function (disabledDates) {
      if (Array.isArray(disabledDates) && disabledDates.length > 0) {
        const _exluded = [];
        disabledDates?.map((item) => {
          if (moment(item, format).isValid()) {
            _exluded.push(moment(item, format).toDate());
          }
        });
        setExcludedDates(_exluded);
      }
    });

    setExposedVariable('clearDisabledDates', async function () {
      setExcludedDates([]);
    });

    setExposedVariable('setValueinTimeStamp', async function (value) {
      const date = moment.unix(value).format(format);
      setDate(new Date(date));
      const dateMomentInstance = date && moment(date, selectedDateFormat);
      if (dateMomentInstance && dateMomentInstance.isValid()) {
        setDate(dateMomentInstance.toDate());
        setExposedVariable('value', date);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setExposedVariable('setFocus', async function () {
      if (dateInputRef.current) {
        dateInputRef.current.focus();
      }
    });

    setExposedVariable('setBlur', async function () {
      if (dateInputRef.current) {
        dateInputRef.current.blur();
      }
    });
  }, [dateInputRef]);

  useEffect(() => {
    setExposedVariable('timezone', async function (date) {
      setDate(date);
      // moment(1369266934311).utcOffset(-420).format('YYYY-MM-DD HH:mm');
    });
  }, []);

  // useEffect(() => {
  //   setExposedVariable('setMinDate', async function (date) {
  //     setMinDate(date);
  //   });
  //   setExposedVariable('setMaxDate', async function (date) {
  //     setMaxDate(date);
  //   });
  // }, []);

  // useEffect(() => {
  //   setExposedVariable('setMinTime', async function (time) {
  //     setMinTime(convertTime(time));
  //   });
  //   setExposedVariable('setMaxTime', async function (time) {
  //     setMaxTime(convertTime(time));
  //   });
  // }, []);

  const renderDatePicker = () => (
    <>
      <div
        data-cy={dataCy}
        data-disabled={disable || loading}
        className={` datepicker-widget  d-flex  ${darkMode && 'theme-dark'} ${
          defaultAlignment === 'top' ? 'flex-column' : 'align-items-center '
        }  ${direction === 'right' && defaultAlignment === 'side' ? 'flex-row-reverse' : ''}
       ${direction === 'right' && defaultAlignment === 'top' ? 'text-right' : ''}
       ${visibility || 'invisible'}`}
        style={{
          padding: padding === 'default' ? '2px' : '',
          position: 'relative',
          width: '100%',
          display: !visibility ? 'none' : 'flex',
          background: 'none',
          // height,
        }}
      >
        {component?.definition?.styles?.iconVisibility?.value && !isResizing && (
          <IconElement
            style={{
              width: '16px',
              height: '16px',
              left:
                direction === 'right'
                  ? padding == 'default'
                    ? '13px'
                    : '11px'
                  : defaultAlignment === 'top'
                  ? padding == 'default'
                    ? '13px'
                    : '11px'
                  : `${labelWidth + 15}px`,
              position: 'absolute',
              top: `${
                defaultAlignment === 'side' ? '50%' : label?.length > 0 && width > 0 ? 'calc(50% + 10px)' : '50%'
              }`,
              transform: ' translateY(-50%)',
              color: iconColor,
              zIndex: 100,
            }}
            stroke={1.5}
          />
        )}
        {label && width > 0 && (
          <label
            ref={labelRef}
            style={{
              color: darkMode && color === '#11181C' ? '#fff' : color,
              width: label?.length === 0 ? '0%' : auto ? 'auto' : defaultAlignment === 'side' ? `${width}%` : '100%',
              maxWidth: auto && defaultAlignment === 'side' ? '70%' : '100%',
              marginRight: label?.length > 0 && direction === 'left' && defaultAlignment === 'side' ? '9px' : '',
              marginLeft: label?.length > 0 && direction === 'right' && defaultAlignment === 'side' ? '9px' : '',
              display: 'flex',
              // overflow: label?.length > 18 && 'hidden', // Hide any content that overflows the box
              // textOverflow: 'ellipsis', // Display ellipsis for overflowed content
              fontWeight: 500,
              textAlign: direction == 'right' ? 'right' : 'left',
              // whiteSpace: 'nowrap', // Keep the text in a single line
            }}
          >
            <span
              style={{
                overflow: label?.length > 18 && 'hidden', // Hide any content that overflows the box
                textOverflow: 'ellipsis', // Display ellipsis for overflowed content
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {label}
            </span>
            <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
          </label>
        )}
        <DatePickerComponent
          calendarIcon={<IconElement stroke={1.5} />}
          className={`input-field form-control tj-text-input-widget  ${
            !isValid && showValidationError ? 'is-invalid' : ''
          } validation-without-icon px-2 ${darkMode ? 'bg-dark color-white' : 'bg-light'}`}
          popperClassName="tj-datepicker-widget"
          selected={date}
          onChange={(date) => onDateChange(date)}
          value={date !== null ? computeDateString(date) : 'select date'}
          showTimeInput={enableTime ? true : false}
          showTimeSelectOnly={enableDate ? false : true}
          onFocus={(event) => {
            onComponentClick(id, component, event);
          }}
          customInput={
            <TjDatepicker
              styles={datepickerinputStyles}
              setShowValidationError={setShowValidationError}
              fireEvent={fireEvent}
              setIsFocused={setIsFocused}
              dateInputRef={dateInputRef}
            />
          }
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          excludeDates={excludedDates}
          timeInputLabel={<div className={`${darkMode && 'theme-dark'}`}>Time</div>}
          showPopperArrow={false}
          timeFormat={timeFormat === 'HH:mm' ? 'HH:mm' : 'hh:mm a'}
          minDate={minDate && new Date(minDate)}
          maxDate={maxDate && new Date(maxDate)}
          minTime={setHours(setMinutes(new Date(), minTime.minutes), minTime.hours)}
          maxTime={setHours(setMinutes(new Date(), maxTime.minutes), maxTime.hours)}
          renderCustomHeader={(headerProps) => <CustomDatePickerHeader {...headerProps} />}
        />
        {loading && <Loader style={{ ...loaderStyle }} width="16" />}
        <div
          data-cy="date-picker-invalid-feedback"
          className={`invalid-feedback ${isValid ? '' : 'd-flex'}`}
          style={{ color: errTextColor, textAlign: direction == 'left' && 'end' }}
        >
          {showValidationError && validationError}
        </div>
      </div>
    </>
  );

  return (
    <>
      {properties?.tooltip?.length > 0 ? (
        <ToolTip message={tooltip}>
          <div>{renderDatePicker()}</div>
        </ToolTip>
      ) : (
        <div>{renderDatePicker()}</div>
      )}
    </>
  );
};
