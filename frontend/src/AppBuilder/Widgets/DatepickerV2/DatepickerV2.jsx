import Label from '@/_ui/Label';
import React, { useEffect, useRef, useState } from 'react';
import DatePickerComponent from 'react-datepicker';
import cx from 'classnames';
import CustomDatePickerHeader from '@/AppBuilder/CodeBuilder/Elements/CustomDatePickerHeader';
import * as Icons from '@tabler/icons-react';
import { DatepickerInput } from './DatepickerInput';
import moment from 'moment';
import { TIMEZONE_OPTIONS_MAP } from '@/AppBuilder/RightSideBar/Inspector/Components/DatepickerV2';
import TimepickerInput from './TimepickerInput';
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
  const { label, defaultValue, dateFormat, timeFormat, is24HourFormatEnabled, timezoneInterval } = properties;

  const { disabledDates, mandatory: isMandatory } = validation;

  const {
    selectedTextColor,
    fieldBorderRadius,
    justifyContent,
    boxShadow,
    labelColor,
    alignment,
    direction,
    iconDirection,
    fieldBorderColor,
    fieldBackgroundColor,
    labelWidth,
    icon,
    iconVisibility,
    errTextColor,
    auto: labelAutoWidth,
    iconColor,
    accentColor,
    padding,
  } = styles;
  const isInitialRender = useRef(true);
  const [date, setDate] = useState(defaultValue);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [loading, setLoading] = useState(properties.loadingState);
  const [disable, setDisable] = useState(properties.disabledState);
  const [excludedDates, setExcludedDates] = React.useState([]);
  const [focus, setFocus] = useState(false);
  const [minDate, setMinDateState] = useState(new Date(validation.minDate));
  const [maxDate, setMaxDateState] = useState(new Date(validation.maxDate));
  const [selectedTimezone, setSelectedTimezone] = useState(timezoneInterval);
  const [minHour, minMinute] = validation.minTime.split(':');
  const [minTime, setMinTimeState] = useState(getSafeTime(minHour, minMinute));
  const [maxHour, maxMinute] = validation.maxTime.split(':');
  const [maxTime, setMaxTimeState] = useState(getSafeTime(maxHour, maxMinute));

  const displayFormat = `${dateFormat} ${timeFormat}`;

  const computeDateString = (date) => {
    if (date === null) return 'Invalid Date';

    const isUnixTimeStamp =
      typeof date === 'number' || (typeof date === 'string' && !isNaN(date) && date.trim() !== '');

    // if (isTimeSelectionEnabled) {
    //   // const formattedDate = selectedTimezone
    //   //   ? moment(date).tz(selectedTimezone).format(selectedDateFormat)
    //   //   : moment(date).format(selectedDateFormat);

    //   const formattedDate = isUnixTimeStamp
    //     ? moment.unix(date).format(selectedDateFormat)
    //     : moment(date).format(selectedDateFormat);

    //   return formattedDate;

    //   // return isUnixTimeStamp ? formattedDate : moment(date).format(selectedDateFormat);
    // }

    return isUnixTimeStamp ? moment.unix(date).format(displayFormat) : moment(date).format(displayFormat);
  };

  const onDateChange = (date) => {
    // setShowValidationError(true);
    setInputValue(date);
    fireEvent('onSelect');
  };

  const setInputValue = (value) => {
    const isUnixTimeStamp =
      typeof value === 'number' || (typeof value === 'string' && !isNaN(value) && value.trim() !== '');
    setDate(isUnixTimeStamp ? moment.unix(value).toDate() : value);
    setExposedVariable('value', value ? computeDateString(value) : undefined);
    const validationStatus = validate(computeDateString(value));
    // setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
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
    setExposedVariable('errTextColor', errTextColor);
  }, []);

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
    setSelectedTimezone(timezoneInterval);
    setExposedVariable('selectedTimeZone', timezoneInterval);
  }, [timezoneInterval]);

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

  useEffect(() => {
    const exposedVariables = {
      label: label,
      dateFormat: dateFormat,
      timeFormat: timeFormat,
      selectedTimeZone: timezoneInterval,
      isVisible: properties.visibility,
      isLoading: properties.loadingState,
      isDisabled: properties.disabledState,
      isMandatory: isMandatory,
      setValue: () => {
        setInputValue();
      },
      clearValue: () => {
        setInputValue(null); //Done
      },
      setDate: (date) => {
        setInputValue(date);
      },
      setTime: (time) => {
        setInputValue(time);
      },
      setValueinTimeStamp: (timeStamp) => {
        //For the most part done need to fix setDate after toggle has been changed
        setInputValue(timeStamp);
      },
      setDisabledDates: (dates) => {
        //Done
        setExcludedDates(dates);
      },
      clearDisabledDates: () => {
        //Done
        setExcludedDates([]);
      },
      setMinDate: (date) => {
        const momentDate = moment(date);
        if (momentDate.isValid()) {
          setMinDateState(momentDate.toDate()); //Done
        }
      },
      setMaxDate: (date) => {
        const momentDate = moment(date);
        if (momentDate.isValid()) {
          setMaxDateState(momentDate.toDate()); //Done
        }
      },
      setMinTime: (time) => {
        const [hour, minute] = time.split(':');
        setMinTimeState(getSafeTime(hour, minute));
      }, //Done
      setMaxTime: (time) => {
        const [hour, minute] = time.split(':');
        setMaxDateState(getSafeTime(hour, minute));
      }, //Done
      setTimezone: (timezone) => {
        const value = TIMEZONE_OPTIONS_MAP[timezone];
        if (value) {
          setSelectedTimezone(value);
          setExposedVariable('selectedTimeZone', value);
        }
      }, // Done
      setVisibility: (visibility) => {
        setExposedVariable('isVisible', visibility); //Done
        setVisibility(visibility);
      },
      setLoading: (loading) => {
        setExposedVariable('isLoading', loading); //Done
        setLoading(loading);
      },
      setDisable: (disable) => {
        setExposedVariable('isDisabled', disable); //Done
        setDisable(disable);
      },
      setFocus: (focus) => {
        setFocus(focus); //Done
      },
      setBlur: () => {
        setFocus(false); //Done
      },
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
  }, []);

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

  useEffect(() => {
    const dateMomentInstance = defaultValue && moment(defaultValue, displayFormat);
    setInputValue(dateMomentInstance && dateMomentInstance.isValid() ? dateMomentInstance.toDate() : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          onChange={(date) => {
            setFocus(true);
            onDateChange(date);
          }}
          selected={date}
          value={date !== null ? computeDateString(date) : 'Select date'}
          // dateFormat={!isDateSelectionEnabled && isTimeSelectionEnabled ? 'HH:mm' : dateFormat}
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
              onDateChange={onDateChange}
            />
          }
          showTimeInput
          customTimeInput={<TimepickerInput currentDate={date} darkMode={darkMode} />}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          excludeDates={excludedDates}
          showPopperArrow={false}
          renderCustomHeader={(headerProps) => <CustomDatePickerHeader {...headerProps} />}
          shouldCloseOnSelect={false}
          popperProps={{ strategy: 'fixed' }}
          timeIntervals={15}
          timeFormat={is24HourFormatEnabled ? 'HH:mm' : 'h:mm aa'}
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
        />
      </div>
    </div>
  );
};
