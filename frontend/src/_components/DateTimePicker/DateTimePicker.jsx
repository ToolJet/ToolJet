import React, { useState, useRef, useEffect, useMemo } from 'react';
import DatePickerComponent from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import cx from 'classnames';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import './styles.scss';
import { convertToDateType, formatDate, getLocalTimeZone } from '@/_helpers/utils';

export const DateTimePicker = ({
  enableDate = true,
  enableTime = true,
  format = 'dd/MM/yyyy, h:mm aa',
  isOpenOnStart = false,
  timestamp = null,
  setTimestamp,
  isNotNull = true,
  defaultValue = null,
  isEditCell = false,
  saveFunction = () => {},
  timezone = getLocalTimeZone(),
}) => {
  const transformedTimestamp = timestamp ? convertToDateType(timestamp, timezone) : null;
  const timestampRef = useRef(timestamp);
  const prevTimestampRef = useRef(timestamp || new Date().toISOString());
  const [isOpen, setIsOpen] = useState(isOpenOnStart);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter') {
      handleSave();
      setIsOpen(false);
    }
    e.stopPropagation();
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleSave = () => {
    saveFunction(timestampRef.current);
    setIsOpen(false);
  };

  const handleCellEditChange = (newTimestamp) => {
    const stringifiedTimestamp = formatDate(newTimestamp, timezone);
    timestampRef.current = stringifiedTimestamp;
    setTimestamp(stringifiedTimestamp);
  };

  const handleDefaultChange = (newTimestamp) => {
    const stringifiedTimestamp = formatDate(newTimestamp, timezone);
    timestampRef.current = stringifiedTimestamp;
    setTimestamp(stringifiedTimestamp);
    setIsOpen(false);
  };

  useEffect(() => {
    const currentTimeInMilliseconds = new Date(timestampRef.current).getTime();
    const defaultValueInMilliseconds = new Date(defaultValue).getTime();
    if (currentTimeInMilliseconds !== defaultValueInMilliseconds && timestampRef.current !== null) {
      prevTimestampRef.current = timestampRef.current;
    }
  }, [timestampRef.current]);

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
            <div className={`fw-500 tjdbCellMenuShortcutsInfo`} id="escbutton">
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
            onClick={handleSave}
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
          marginTop: '-4px',
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

  const memoizedCustomCalendarContainer = useMemo(() => CustomCalendarContainer, [isOpen]);

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
      className={cx('datepicker-widget', {
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
        className={`input-field form-control validation-without-icon px-2 ${
          darkMode ? 'bg-dark color-white' : 'bg-light'
        } `}
        popperPlacement={'bottom-start'}
        popperClassName={`${!isEditCell && 'tjdb-datepicker-reset'}`}
        onInputClick={() => setIsOpen(true)}
        onClickOutside={() => setIsOpen(false)}
        placeholderText="DD/MM/YYYY, 12:00pm"
        selected={transformedTimestamp}
        onChange={(newTimestamp) => {
          isEditCell ? handleCellEditChange(newTimestamp) : handleDefaultChange(newTimestamp);
        }}
        autoFocus={true}
        open={isOpen}
        onClick={() => {
          setIsOpen(true);
        }}
        showTimeInput={enableTime ? true : false}
        showTimeSelectOnly={enableDate ? false : true}
        showMonthDropdown
        showYearDropdown
        fixedHeight
        dropdownMode="select"
        customInput={
          transformedTimestamp ? (
            <input style={{ borderRadius: `${styles.borderRadius}px`, display: isEditCell ? 'block' : 'flex' }} />
          ) : (
            <div
              style={{
                ...(!isEditCell && { minWidth: '125px' }),
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
              }}
              tabindex="0"
              className="null-container"
            >
              <span
                style={{
                  position: 'static',
                  margin: isEditCell ? '0px 0px 0px 0px' : '4px 0px 4px 0px',
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
        {...(isEditCell && { calendarContainer: memoizedCustomCalendarContainer, onKeyDown: handleKeyDown })}
        {...(!isEditCell && { calendarContainer: memoizedDefaultCalendarContainer })}
      />
    </div>
  );
};
