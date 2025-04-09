import React, { useState, useRef, useEffect, useMemo } from 'react';
import DatePickerComponent from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import cx from 'classnames';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import './styles.scss';
import { getLocalTimeZone, convertToDateType, formatDate } from '../util';
export const DateTimePicker = ({
  enableDate = true,
  enableTime = true,
  format = 'dd/MM/yyyy, hh:mm aa',
  timeFormat = 'hh:mm aa',
  isOpenOnStart = false,
  timestamp = null,
  setTimestamp,
  isNotNull = true,
  defaultValue = null,
  isEditCell = false,
  saveFunction = () => {},
  timezone = getLocalTimeZone(),
  isClearable = false,
  isPlaceholderEnabled = false,
  isDisabled = false,
  errorMessage,
}) => {
  const startValue = useRef(timestamp);
  const timestampRef = useRef(timestamp);
  const prevTimestampRef = useRef(timestamp || new Date().toISOString());
  const transformedTimestamp = timestamp ? convertToDateType(timestamp, timezone) : null;
  const [triggeredKeyPress, setTriggeredKeyPress] = useState(0);
  const minDate = new Date(1800, 0, 1);
  const maxDate = new Date(2200, 11, 31);
  const [isOpen, setIsOpen] = useState(isOpenOnStart);

  const handleKeyDown = (e) => {
    if (isEditCell) {
      if (e.key === 'Escape') {
        handleCancel();
        timestampRef.current = startValue.current;
        setTimestamp(startValue.current);
      } else if (e.key === 'Enter') {
        handleSave();
      }
    }
    e.stopPropagation();
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleSave = (e) => {
    if (e) {
      e.stopPropagation();
    }
    saveFunction(timestampRef.current);
    startValue.current = timestampRef.current;
    setIsOpen(false);
  };

  const handleCellEditChange = (newTimestamp) => {
    const stringifiedTimestamp = formatDate(newTimestamp, timezone);
    timestampRef.current = stringifiedTimestamp;
    setTimestamp(stringifiedTimestamp);
  };

  const handleDefaultChange = (newTimestamp, isTimeSelect = false) => {
    const stringifiedTimestamp = formatDate(newTimestamp, timezone);
    timestampRef.current = stringifiedTimestamp;
    setTimestamp(stringifiedTimestamp, isTimeSelect);
  };

  useEffect(() => {
    if (isOpen === false && isEditCell) {
      setIsOpen(true);
    }
  }, [triggeredKeyPress]);

  useEffect(() => {
    const currentTimeInMilliseconds = new Date(timestampRef.current).getTime();
    const defaultValueInMilliseconds = new Date(defaultValue).getTime();
    if (currentTimeInMilliseconds !== defaultValueInMilliseconds && timestampRef.current !== null) {
      prevTimestampRef.current = timestampRef.current;
    }
  }, [timestampRef.current]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const SaveChangesSection = () => {
    const [isNull, setIsNull] = useState(timestampRef.current === null);
    const [isDefault, setIsDefault] = useState(timestampRef.current === defaultValue);

    const handleNullToggle = () => {
      if (!isNull) {
        timestampRef.current = null;
        setTimestamp(null);
      } else {
        timestampRef.current = prevTimestampRef.current;
        setTimestamp(prevTimestampRef.current);
      }
    };

    const handleDefaultToggle = () => {
      if (!isDefault) {
        timestampRef.current = defaultValue;
        setTimestamp(defaultValue);
      } else {
        timestampRef.current = prevTimestampRef.current;
        setTimestamp(prevTimestampRef.current);
      }
    };

    useEffect(() => {
      const currentTimeInMilliseconds = new Date(timestampRef.current).getTime();
      const defaultValueInMilliseconds = new Date(defaultValue).getTime();

      if (timestampRef.current === null && currentTimeInMilliseconds === defaultValueInMilliseconds) {
        setIsNull(true);
        setIsDefault(true);
      } else if (currentTimeInMilliseconds === defaultValueInMilliseconds) {
        setIsNull(false);
        setIsDefault(true);
      } else if (timestampRef.current === null) {
        setIsNull(true);
        setIsDefault(false);
      } else {
        setIsNull(false);
        setIsDefault(false);
      }
    }, [timestampRef.current]);

    useEffect(() => {
      if (isEditCell) {
        const style = document.createElement('style');
        style.innerHTML = `
          .react-datepicker__navigation-icon--next::before {
            top: 21px !important; 
          }
          .react-datepicker__navigation-icon--previous::before {
            top: 21px !important; 
          }
        `;
        document.head.appendChild(style);
        return () => {
          document.head.removeChild(style);
        };
      }
    }, [isEditCell]);

    return (
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex flex-column align-items-start gap-1">
          <div className="d-flex align-items-center gap-1">
            <div className={`fw-500 tjdbCellMenuShortcutsInfo`} id="enterbutton">
              <SolidIcon name="enterbutton" />
            </div>
            <div className={`fw-400 tjdbCellMenuShortcutsText`}>Save Changes</div>
          </div>
          <div className="d-flex align-items-center gap-1">
            <div className={`fw-500 tjdbCellMenuShortcutsInfo esc-btn-datepicker`} id="escbutton">
              Esc
            </div>
            <div className={`fw-400 tjdbCellMenuShortcutsText`}>Discard Changes</div>
          </div>
        </div>
        <div className="d-flex flex-column align-items-end gap-1">
          {isNotNull === false && (
            <div className="d-flex align-items-center gap-2">
              <div className="d-flex flex-column">
                <span style={{ width: 'auto' }} className="fw-400 fs-12">
                  Set to null
                </span>
              </div>
              <div>
                <label className={`form-switch`}>
                  <input className="form-check-input" type="checkbox" checked={isNull} onChange={handleNullToggle} />
                </label>
              </div>
            </div>
          )}

          {defaultValue !== null && (
            <div className="d-flex align-items-center gap-2">
              <div className="d-flex flex-column">
                <span style={{ width: 'auto' }} className="fw-400 fs-12">
                  Set to default
                </span>
              </div>
              <div>
                <label className={`form-switch`}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={isDefault}
                    onChange={handleDefaultToggle}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SaveChangesFooter = () => {
    return (
      <div className={cx('d-flex align-items-center', 'justify-content-end')}>
        <div className="d-flex" style={{ gap: '8px' }}>
          <ButtonSolid onClick={handleCancel} variant="tertiary" size="sm" className="fs-12 p-2">
            Cancel
          </ButtonSolid>
          <ButtonSolid
            onClick={(e) => handleSave(e)}
            disabled={timestamp == timestampRef.current ? true : false}
            variant="primary"
            size="sm"
            className="fs-12 p-2"
          >
            Save
          </ButtonSolid>
        </div>
      </div>
    );
  };

  const defaultCalendarContainer = ({ children }) => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '240px',
          fontSize: '12px',
          borderRadius: '6px',
          boxShadow: '0px 8px 16px 0px #3032331A',
          backgroundColor: darkMode ? '#232e3c' : '#FFFFFF',
          marginTop: '-2px',
        }}
      >
        <div style={{ width: '100%' }}>{children}</div>
      </div>
    );
  };

  const memoizedDefaultCalendarContainer = useMemo(() => defaultCalendarContainer, []);

  const CustomCalendarContainer = ({ children }) => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '280px',
          borderRadius: '6px',
          boxShadow: '0px 8px 16px 0px #3032331A',
          backgroundColor: darkMode ? '#232e3c' : '#FFFFFF',
        }}
      >
        <div style={{ width: '100%' }}>{children}</div>
        <div
          className={`d-flex flex-column gap-3`}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '12px',
            borderTop: '1px solid var(--Slate-05, #E6E8EB)',
          }}
        >
          <SaveChangesSection />
          <SaveChangesFooter />
        </div>
      </div>
    );
  };

  const memoizedCustomCalendarContainer = useMemo(() => CustomCalendarContainer, []);

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const styles = {
    visibility: true,
    disabledState: false,
    borderRadius: 5,
    boxShadow: '0px 0px 5px 0px rgba(0,0,0,0.75)',
  };

  return (
    <div
      data-disabled={styles.disabledState}
      className={cx('datepicker-widget position-relative', {
        'theme-tjdb': !darkMode,
        'theme-dark': darkMode,
      })}
      style={{
        display: styles.visibility ? '' : 'none',
        background: 'none',
        width: '100%',
      }}
    >
      <DatePickerComponent
        className={cx('input-field', 'validation-without-icon', 'px-2', {
          'bg-dark color-white': darkMode,
          'bg-light': !darkMode,
          'tjdb-datepicker-wrapper': !isEditCell,
          'tjdb-datepicker-celledit': isEditCell,
          'form-control': !isDisabled,
          'form-control-disabled': isDisabled && !darkMode,
          'dark-form-control-disabled': isDisabled && darkMode,
          'null-value-padding': !transformedTimestamp && !isEditCell,
          'input-value-padding': transformedTimestamp,
        })}
        popperPlacement={'bottom-start'}
        popperClassName={cx({
          // 'tjdb-datepicker-reset': !isEditCell,
          'tjdb-datepicker-celledit-reset': isEditCell,
        })}
        onInputClick={() => {
          setIsOpen(true);
        }}
        isClearable={isClearable}
        value={transformedTimestamp}
        onClickOutside={() => setIsOpen(false)}
        placeholderText="dd/mm/yyyy, 12:00am/pm"
        selected={transformedTimestamp}
        minDate={minDate}
        maxDate={maxDate}
        onChange={(newTimestamp, event) => {
          if (isEditCell) {
            handleCellEditChange(newTimestamp);
            if (event?.type === 'keydown') {
              setTriggeredKeyPress((prev) => prev + 1);
              setIsOpen(false);
            }
          } else {
            if (event) {
              handleDefaultChange(newTimestamp);
              if (event.type === 'click') {
                setIsOpen(false);
              }
            } else {
              handleDefaultChange(newTimestamp, true);
            }
          }
          event?.stopPropagation();
        }}
        autoFocus={true}
        open={isOpen}
        showTimeInput={enableTime ? true : false}
        showTimeSelectOnly={enableDate ? false : true}
        showMonthDropdown
        showYearDropdown
        locale="en-GB"
        fixedHeight
        dropdownMode="select"
        customInput={
          transformedTimestamp || isPlaceholderEnabled ? (
            <input
              onFocus={'auto'}
              style={{
                borderRadius: `${styles.borderRadius}px`,
                display: isEditCell ? 'block' : 'flex',
                alignItems: 'center',
                overflow: 'hidden',
              }}
              className={cx({ 'tjdb-datepicker-celledit-input': isEditCell, 'input-error-border': errorMessage })}
            />
          ) : (
            <div
              style={{
                ...(!isEditCell && { minWidth: '125px' }),
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                border: 'none',
                backgroundColor: 'transparent',
              }}
              className={cx('null-container', {
                'tjdb-datepicker-celledit-input': isEditCell,
                'bg-dark color-white': darkMode,
                'bg-white': !darkMode,
                'input-error-border': errorMessage,
              })}
              tabindex="0"
            >
              <span
                style={{
                  position: 'static',
                  margin: isEditCell ? '8px 0px 8px 0px' : '5px 0px 5px 0px',
                  backgroundColor: 'transparent',
                }}
                className={cx({ 'cell-text-null': isEditCell, 'null-tag': !isEditCell })}
              >
                Null
              </span>
            </div>
          )
        }
        timeInputLabel={<div className={`${darkMode && 'theme-dark'}`}>Time</div>}
        dateFormat={format}
        timeFormat={timeFormat}
        {...(isEditCell && { calendarContainer: memoizedCustomCalendarContainer })}
        {...(!isEditCell && { calendarContainer: memoizedDefaultCalendarContainer })}
      />
      {errorMessage && (
        <small
          className="tj-input-error"
          style={{
            fontSize: '10px',
            color: '#DB4324',
          }}
          data-cy="app-name-error-label"
        >
          {errorMessage}
        </small>
      )}
    </div>
  );
};
