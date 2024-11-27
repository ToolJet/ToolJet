import Label from '@/_ui/Label';
import React, { useEffect, useRef, useState } from 'react';
import DatePickerComponent from 'react-datepicker';
import cx from 'classnames';
import CustomDatePickerHeader from '@/AppBuilder/CodeBuilder/Elements/CustomDatePickerHeader';
import * as Icons from '@tabler/icons-react';
import { DatepickerInput } from './DatepickerInput';
import moment from 'moment-timezone';
import { TIMEZONE_OPTIONS_MAP } from '@/AppBuilder/RightSideBar/Inspector/Components/DatepickerV2';
import TimepickerInput from './TimepickerInput';

import {
  convertToIsoWithTimezoneOffset,
  getFormattedSelectTimestamp,
  getSelectedTimestampFromUnixTimestamp,
  getUnixTime,
  getUnixTimestampFromSelectedTimestamp,
  is24HourFormat,
} from './DatepickerUtils';
const tinycolor = require('tinycolor2');

const DISABLED_DATE_FORMAT = 'MM/DD/YYYY';

const getSafeTime = (hour, minute) => {
  try {
    const time = moment().hours(hour).minutes(minute);
    return time.toDate();
  } catch (error) {
    return null;
  }
};

export const DatepickerV2 = ({
  height,
  properties,
  validation,
  styles,
  setExposedVariable,
  setExposedVariables,
  validate,
  onComponentClick,
  componentName,
  id,
  darkMode,
  fireEvent,
  dataCy,
}) => {
  const dateInputRef = useRef(null);
  const { label, defaultValue, dateFormat, timeFormat, isTimezoneEnabled } = properties;

  const { disabledDates, mandatory: isMandatory } = validation;

  const {
    selectedTextColor,
    fieldBorderRadius,
    boxShadow,
    labelColor,
    alignment,
    direction,
    iconDirection,
    fieldBorderColor,
    fieldBackgroundColor,
    labelWidth,
    iconVisibility,
    auto: labelAutoWidth,
    iconColor,
    accentColor,
    padding,
  } = styles;
  const isInitialRender = useRef(true);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [loading, setLoading] = useState(properties.loadingState);
  const [disable, setDisable] = useState(properties.disabledState);
  const [excludedDates, setExcludedDates] = React.useState([]);
  const [focus, setFocus] = useState(false);
  const [minDate, setMinDateState] = useState(new Date(validation.minDate));
  const [maxDate, setMaxDateState] = useState(new Date(validation.maxDate));
  const [minHour, minMinute] = validation.minTime.split(':');
  const [minTime, setMinTimeState] = useState(getSafeTime(minHour, minMinute));
  const [maxHour, maxMinute] = validation.maxTime.split(':');
  const [maxTime, setMaxTimeState] = useState(getSafeTime(maxHour, maxMinute));
  const displayFormat = `${dateFormat} ${timeFormat}`;
  const [displayTimezone, setDisplayTimezone] = useState(properties.displayTimezone);
  const [storeTimezone, setStoreTimezone] = useState(properties.storeTimezone);
  const [unixTimestamp, setUnixTimestamp] = useState(defaultValue ? getUnixTime(defaultValue) : null);
  const [selectedTimestamp, setSelectedTimestamp] = useState(
    defaultValue ? getSelectedTimestampFromUnixTimestamp(unixTimestamp, displayTimezone, isTimezoneEnabled) : null
  );
  const [displayTimestamp, setDisplayTimestamp] = useState(
    selectedTimestamp ? getFormattedSelectTimestamp(selectedTimestamp, displayFormat) : 'Select time'
  );
  const [textInputFocus, setTextInputFocus] = useState(false);

  const setInputValue = (date) => {
    const unixTimestamp = getUnixTime(date);
    const selectedTimestamp = getSelectedTimestampFromUnixTimestamp(unixTimestamp, displayTimezone, isTimezoneEnabled);
    setUnixTimestamp(unixTimestamp);
    setSelectedTimestamp(selectedTimestamp);
    setExposedDateVariables(unixTimestamp, selectedTimestamp);
  };

  const onDateSelect = (date) => {
    console.log('date', date);
    const selectedTime = getUnixTime(date);
    setSelectedTimestamp(selectedTime);
    const unixTimestamp = getUnixTimestampFromSelectedTimestamp(selectedTimestamp, displayTimezone, isTimezoneEnabled);
    setUnixTimestamp(unixTimestamp);
    setExposedDateVariables(unixTimestamp, selectedTime);
  };

  const onTimeChange = (time, type) => {
    const updatedSelectedTimestamp = moment(selectedTimestamp);
    updatedSelectedTimestamp.set(type, time);
    const updatedUnixTimestamp = getUnixTimestampFromSelectedTimestamp(
      updatedSelectedTimestamp.valueOf(),
      displayTimezone,
      isTimezoneEnabled
    );
    setUnixTimestamp(updatedUnixTimestamp);
    setSelectedTimestamp(updatedSelectedTimestamp.valueOf());
    setExposedDateVariables(updatedUnixTimestamp, updatedSelectedTimestamp.valueOf());
  };

  const setExposedDateVariables = (unixTimestamp, selectedTimestamp) => {
    const selectedTime = getFormattedSelectTimestamp(selectedTimestamp, timeFormat);
    const selectedDate = getFormattedSelectTimestamp(selectedTimestamp, dateFormat);
    const displayValue = getFormattedSelectTimestamp(selectedTimestamp, displayFormat);
    const value = convertToIsoWithTimezoneOffset(unixTimestamp, storeTimezone);
    setExposedVariables({
      selectedTime: selectedTime,
      selectedDate: selectedDate,
      unixTimestamp: unixTimestamp,
      displayValue: displayValue,
      value: value,
    });
  };

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', properties.visibility);
    setVisibility(properties.visibility);
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', properties.loadingState);
    setLoading(properties.loadingState);
  }, [properties.loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', properties.disabledState);
    setDisable(properties.disabledState);
  }, [properties.disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isMandatory', isMandatory);
  }, [isMandatory]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isMandatory', isMandatory);
  }, [isMandatory]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('label', label);
  }, [label]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('dateFormat', dateFormat);
  }, [dateFormat]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('timeFormat', timeFormat);
  }, [timeFormat]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setDisplayTimezone(properties.displayTimezone);
    setExposedVariable('displayTimezone', properties.displayTimezone);
  }, [properties.displayTimezone]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setStoreTimezone(properties.storeTimezone);
    setExposedVariable('storeTimezone', properties.storeTimezone);
  }, [properties.storeTimezone]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setInputValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (isInitialRender.current || textInputFocus) return;
    setDisplayTimestamp(
      selectedTimestamp ? getFormattedSelectTimestamp(selectedTimestamp, displayFormat) : 'Select time'
    );
  }, [selectedTimestamp, displayFormat, textInputFocus]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const selectedTimestamp = getSelectedTimestampFromUnixTimestamp(unixTimestamp, displayTimezone, isTimezoneEnabled);
    const selectedTime = getFormattedSelectTimestamp(selectedTimestamp, timeFormat);
    const selectedDate = getFormattedSelectTimestamp(selectedTimestamp, dateFormat);
    const displayValue = getFormattedSelectTimestamp(selectedTimestamp, displayFormat);
    setSelectedTimestamp(selectedTimestamp);
    setExposedVariables({
      selectedTime,
      selectedDate,
      displayValue,
    });
  }, [isTimezoneEnabled, displayTimezone]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const value = convertToIsoWithTimezoneOffset(unixTimestamp, storeTimezone);
    setExposedVariable('value', value);
  }, [isTimezoneEnabled, storeTimezone]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setMinDateState(new Date(validation.minDate));
  }, [validation.minDate]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setMaxDateState(new Date(validation.maxDate));
  }, [validation.maxDate]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const [hour, minute] = validation.minTime.split(':');
    setMinTimeState(getSafeTime(hour, minute));
  }, [validation.minTime]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const [hour, minute] = validation.maxTime.split(':');
    setMaxTimeState(getSafeTime(hour, minute));
  }, [validation.maxTime]);

  // useEffect(() => {
  //   // Find the component by its ID
  //   const component = document.querySelector(`.ele-${id}`);
  //   console.log('component', component);
  //   if (component) {
  //     // Find the month selector inside the component
  //     const monthSelector = component.querySelector('.tj-datepicker-widget-month-selector');
  //     console.log(monthSelector);
  //     // Define the click handler
  //     const handleClick = () => console.log('I have been clicked');

  //     if (monthSelector) {
  //       // Add the event listener
  //       monthSelector.addEventListener('click', handleClick);
  //     }

  //     // Cleanup: Remove the event listener
  //     return () => {
  //       if (monthSelector) {
  //         monthSelector.removeEventListener('click', handleClick);
  //       }
  //     };
  //   }
  // }, [focus]);

  useEffect(() => {
    const selectedTime = getFormattedSelectTimestamp(selectedTimestamp, timeFormat);
    const selectedDate = getFormattedSelectTimestamp(selectedTimestamp, dateFormat);
    const displayValue = getFormattedSelectTimestamp(selectedTimestamp, displayFormat);
    const value = convertToIsoWithTimezoneOffset(unixTimestamp, storeTimezone);
    const exposedVariables = {
      value: value,
      label: label,
      selectedTime: selectedTime,
      selectedDate: selectedDate,
      unixTimestamp: unixTimestamp,
      displayValue: displayValue,
      dateFormat: dateFormat,
      timeFormat: timeFormat,
      isVisible: properties.visibility,
      isLoading: properties.loadingState,
      isDisabled: properties.disabledState,
      isMandatory: isMandatory,
      setValue: (value) => {
        setInputValue(value);
      },
      clearValue: () => {
        setInputValue(null);
      },
      setValueinTimeStamp: (timeStamp) => {
        setInputValue(timeStamp);
      },
      setDisabledDates: (dates) => {
        setExcludedDates(dates);
      },
      clearDisabledDates: () => {
        setExcludedDates([]);
      },
      setMinDate: (date) => {
        const momentDate = moment(date);
        if (momentDate.isValid()) {
          setMinDateState(momentDate.toDate());
        }
      },
      setMaxDate: (date) => {
        const momentDate = moment(date);
        if (momentDate.isValid()) {
          setMaxDateState(momentDate.toDate());
        }
      },
      setMinTime: (time) => {
        const [hour, minute] = time.split(':');
        setMinTimeState(getSafeTime(hour, minute));
      },
      setMaxTime: (time) => {
        const [hour, minute] = time.split(':');
        setMaxDateState(getSafeTime(hour, minute));
      },
      setDisplayTimezone: (timezone) => {
        const value = TIMEZONE_OPTIONS_MAP[timezone];
        if (value) {
          setDisplayTimezone(value);
          setExposedVariable('displayTimezone', value);
        }
      },
      setStoreTimezone: (timezone) => {
        const value = TIMEZONE_OPTIONS_MAP[timezone];
        if (value) {
          setStoreTimezone(value);
          setExposedVariable('storeTimezone', value);
        }
      },
      setVisibility: (visibility) => {
        setExposedVariable('isVisible', visibility);
        setVisibility(visibility);
      },
      setLoading: (loading) => {
        setExposedVariable('isLoading', loading);
        setLoading(loading);
      },
      setDisable: (disable) => {
        setExposedVariable('isDisabled', disable);
        setDisable(disable);
      },
      setFocus: () => {
        setFocus(true);
      },
      setBlur: () => {
        setFocus(false);
      },
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
  }, []);

  useEffect(() => {
    setExposedVariables({
      setDate: (date) => {
        const [month, day, year] = date.split('/');
        const updatedSelectedTimestamp = moment(selectedTimestamp);
        updatedSelectedTimestamp.set('year', year);
        updatedSelectedTimestamp.set('month', month - 1);
        updatedSelectedTimestamp.set('date', day);
        const unixTimestamp = getUnixTimestampFromSelectedTimestamp(
          updatedSelectedTimestamp.valueOf(),
          displayTimezone,
          isTimezoneEnabled
        );
        setUnixTimestamp(unixTimestamp);
        setSelectedTimestamp(selectedTimestamp);
        setExposedDateVariables(unixTimestamp, selectedTimestamp);
      },
      setTime: (time) => {
        const [hour, minute] = time.split(':');
        const updatedSelectedTimestamp = moment(selectedTimestamp);
        updatedSelectedTimestamp.set('hour', hour);
        updatedSelectedTimestamp.set('minute', minute);
        const updatedUnixTimestamp = getUnixTimestampFromSelectedTimestamp(
          updatedSelectedTimestamp.valueOf(),
          displayTimezone,
          isTimezoneEnabled
        );
        setUnixTimestamp(updatedUnixTimestamp);
        setSelectedTimestamp(updatedSelectedTimestamp.valueOf());
        setExposedDateVariables(updatedUnixTimestamp, updatedSelectedTimestamp.valueOf());
      },
    });
  }, [selectedTimestamp, unixTimestamp, displayTimezone, isTimezoneEnabled]);

  useEffect(() => {
    if (Array.isArray(disabledDates) && disabledDates.length > 0) {
      const _exluded = [];
      disabledDates?.map((item) => {
        if (moment(item, DISABLED_DATE_FORMAT).isValid()) {
          _exluded.push(moment(item, DISABLED_DATE_FORMAT).toDate());
        }
      });
      setExcludedDates(_exluded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledDates]);

  console.log(!['#1B1F24', '#000', '#000000ff'].includes(selectedTextColor), selectedTextColor);
  const computedStyles = {
    height: height == 36 ? (padding == 'default' ? '36px' : '40px') : padding == 'default' ? height : height + 4,
    width: '100%',
    borderColor: focus
      ? accentColor != '4368E3'
        ? accentColor
        : 'var(--primary-accent-strong)'
      : fieldBorderColor != '#CCD1D5'
      ? fieldBorderColor
      : disable || loading
      ? '1px solid var(--borders-disabled-on-white)'
      : 'var(--borders-default)',
    '--tblr-input-border-color-darker': tinycolor(fieldBorderColor).darken(24).toString(),
    borderRadius: `${fieldBorderRadius}px`,
    color: !['#1B1F24', '#000', '#000000ff'].includes(selectedTextColor)
      ? selectedTextColor
      : disable || loading
      ? 'var(--text-disabled)'
      : 'var(--text-primary)',
    boxShadow: boxShadow,
    backgroundColor:
      fieldBackgroundColor != '#fff'
        ? fieldBackgroundColor
        : disable || loading
        ? darkMode
          ? 'var(--surfaces-app-bg-default)'
          : 'var(--surfaces-surface-03)'
        : 'var(--surfaces-surface-01)',
    paddingLeft: '10px',
    ...(iconVisibility && {
      ...(iconDirection === 'left' ? { paddingLeft: '30px' } : { paddingRight: '30px' }),
    }),
  };

  const loaderStyles = {
    right:
      direction === 'right' &&
      alignment === 'side' &&
      ((label?.length > 0 && labelWidth > 0) || (labelAutoWidth && labelWidth == 0 && label && label?.length != 0))
        ? `${labelWidth + 11}px`
        : '11px',
    top: `${
      alignment === 'top'
        ? ((label?.length > 0 && labelWidth > 0) ||
            (labelAutoWidth && labelWidth == 0 && label && label?.length != 0)) &&
          '50%'
        : 'calc(50% - 7px)'
    }`,
    transform:
      alignment === 'top' &&
      ((label?.length > 0 && labelWidth > 0) || (labelAutoWidth && labelWidth == 0 && label && label?.length != 0)) &&
      ' translateY(-50%)',
    zIndex: 3,
  };

  const iconStyles = {
    width: '16px',
    height: '16px',
    transform: ' translateY(-50%)',
    color: iconColor !== '#CFD3D859' ? iconColor : 'var(--icons-weak-disabled)',
    zIndex: 3,
    display: iconVisibility ? 'block' : 'none',
    [iconDirection]: '10px',
  };

  const _width = (labelWidth / 100) * 70;

  const iconName = styles.icon; // Replace with the name of the icon you want
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[iconName] == undefined ? Icons['IconHome2'] : Icons[iconName];

  const isTwentyFourHourMode = is24HourFormat(displayFormat);

  return (
    <div
      data-cy={`label-${String(componentName).toLowerCase()}`}
      className={cx('d-flex datetimepicker-component', {
        [alignment === 'top' &&
        ((labelWidth != 0 && label?.length != 0) || (labelAutoWidth && labelWidth == 0 && label && label?.length != 0))
          ? 'flex-column'
          : 'align-items-center']: true,
        'flex-row-reverse': direction === 'right' && alignment === 'side',
        'text-right': direction === 'right' && alignment === 'top',
        invisible: !visibility,
        visibility: visibility,
      })}
      style={{
        position: 'relative',
        whiteSpace: 'nowrap',
        width: '100%',
      }}
    >
      <Label
        label={label}
        width={labelWidth}
        // labelRef={labelRef}
        darkMode={darkMode}
        color={labelColor}
        defaultAlignment={alignment}
        direction={direction}
        auto={labelAutoWidth}
        isMandatory={isMandatory}
        _width={_width}
        top={'1px'}
      />
      <div className="w-100 px-0 h-100">
        <DatePickerComponent
          className={`input-field form-control validation-without-icon px-2`}
          popperClassName={cx('tj-table-datepicker tj-datepicker-widget', {
            'theme-dark dark-theme': darkMode,
          })}
          onChange={onDateSelect}
          selected={selectedTimestamp}
          value={displayTimestamp}
          dateFormat={dateFormat}
          displayFormat={displayFormat}
          customInput={
            <DatepickerInput
              dateInputRef={dateInputRef}
              setFocus={setFocus}
              IconElement={IconElement}
              iconStyles={iconStyles}
              inputStyles={computedStyles}
              loaderStyles={loaderStyles}
              loading={loading}
              disable={disable}
              onInputChange={onDateSelect}
              displayFormat={displayFormat}
              setDisplayTimestamp={setDisplayTimestamp}
              setTextInputFocus={setTextInputFocus}
            />
          }
          showTimeInput
          // showMonthYearPicker
          customTimeInput={
            <TimepickerInput
              isTwentyFourHourMode={isTwentyFourHourMode}
              currentTimestamp={selectedTimestamp}
              darkMode={darkMode}
              onTimeChange={onTimeChange}
            />
          }
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          excludeDates={excludedDates}
          showPopperArrow={false}
          renderCustomHeader={(headerProps) => <CustomDatePickerHeader {...headerProps} />}
          shouldCloseOnSelect={false}
          popperPlacement="bottom-start"
          timeIntervals={15}
          // timeFormat={is24HourFormatEnabled ? 'HH:mm' : 'h:mm aa'}
          minDate={minDate !== 'Invalid Date' ? minDate : null}
          maxDate={maxDate !== 'Invalid Date' ? maxDate : null}
          minTime={!minTime || minTime === 'Invalid Date' ? moment().hours(0).minutes(0).toDate() : minTime}
          maxTime={!maxTime || maxTime === 'Invalid Date' ? moment().hours(23).minutes(59).toDate() : maxTime}
          onCalendarClose={() => {
            setFocus(false);
          }}
          onCalendarOpen={() => {
            setFocus(true);
          }}
          portalId="component-portal"
        />
      </div>
    </div>
  );
};
