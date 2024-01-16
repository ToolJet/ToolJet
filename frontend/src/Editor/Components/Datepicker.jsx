import React, { useEffect, forwardRef, useState, useRef } from 'react';
import DatePickerComponent from 'react-datepicker';
import { getMonth, getYear } from 'date-fns';
import range from 'lodash/range';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import moment from 'moment';
import 'react-datepicker/dist/react-datepicker.css';
import { ToolTip } from '@/_components/ToolTip';
import * as Icons from '@tabler/icons-react';
import Loader from '@/ToolJetUI/Loader/Loader';
import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import './datepicker.scss';

const MyDatePicker = forwardRef(({ value, onClick, styles }, ref) => {
  return <input className="custom-input-datepicker" value={value} onClick={onClick} ref={ref} style={styles}></input>;
});

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
  const { enableTime, enableDate, defaultValue, disabledDates, tooltip, label, loadingState, disabledState } =
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
    borderColor: ['#D7DBDF'].includes(borderColor) ? (darkMode ? '#4C5155' : '#D7DBDF') : borderColor,
    color: darkMode && textColor === '#11181C' ? '#ECEDEE' : textColor,
    boxShadow,
    borderRadius: `${borderRadius}px`,
    height: height == 40 ? (padding == 'default' ? '36px' : '40px') : padding == 'default' ? height : height + 4,
    paddingLeft: !component?.definition?.styles?.iconVisibility?.value ? '10px' : '29px',
  };
  const labelRef = useRef();

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

  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';
  const [labelWidth, setLabelWidth] = useState(0);
  const isMandatory = resolveReferences(component?.definition?.validation?.mandatory?.value, currentState) ?? false;
  const [visibility, setVisibility] = useState(properties.visibility);
  const [loading, setLoading] = useState(loadingState);
  const [isFocused, setIsFocused] = useState(false);
  const currentState = useCurrentState();
  const [disable, setDisable] = useState(disabledState || loadingState);
  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

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
  const [startDate, setStartDate] = useState(new Date());
  const years = range(1990, getYear(new Date()) + 1, 1);
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');

  const ExampleCustomInput = ({ value, onClick }, ref) => (
    <input onClick={onClick} ref={ref}>
      {value}
    </input>
  );

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
              // backgroundColor: 'red',
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
              display: 'block',
              overflow: label?.length > 18 && 'hidden', // Hide any content that overflows the box
              textOverflow: 'ellipsis', // Display ellipsis for overflowed content
              fontWeight: 500,
              textAlign: direction == 'right' ? 'right' : 'left',
              whiteSpace: 'nowrap', // Keep the text in a single line
            }}
          >
            {label}
            <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
          </label>
        )}

        <DatePickerComponent
          showIcon
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
          // customInput={<MyDatePicker styles={datepickerinputStyles} />}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          excludeDates={excludedDates}
          timeInputLabel={<div className={`${darkMode && 'theme-dark'}`}>Time</div>}
          showPopperArrow={false}
          // timeFormat="HH:mm:ss:ssss"
          // selected={startDate}
          // onChange={(date) => setStartDate(date)}
          minDate={new Date(component?.definition?.validation?.minDate?.value)}
          maxDate={component?.definition?.validation?.maxDate?.value}
          renderCustomHeader={({
            date,
            changeYear,
            changeMonth,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => (
            <>
              <div
                style={{
                  margin: 10,
                  display: 'flex',
                  justifyContent: 'center',
                  height: '44px',
                  borderBottom: `1px solid var(--slate7)`,
                }}
              >
                <button
                  className="tj-datepicker-widget-arrows tj-datepicker-widget-left "
                  onClick={decreaseMonth}
                  disabled={prevMonthButtonDisabled}
                >
                  <SolidIcon name="cheveronleft" />
                </button>
                <div>
                  <select
                    value={months[getMonth(date)]}
                    onChange={({ target: { value } }) => changeMonth(months.indexOf(value))}
                  >
                    {months.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <select value={getYear(date)} onChange={({ target: { value } }) => changeYear(value)}>
                    {years.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="tj-datepicker-widget-arrows tj-datepicker-widget-right "
                  onClick={increaseMonth}
                  disabled={nextMonthButtonDisabled}
                >
                  <SolidIcon name="cheveronright" />
                </button>
              </div>
            </>
          )}
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
