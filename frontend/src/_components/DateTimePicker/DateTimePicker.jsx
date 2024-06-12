import React, { useState, useCallback, useRef } from 'react';
import DatePickerComponent from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import cx from 'classnames';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import './styles.scss';

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
}) => {
  // States
  const transformedTimestamp = timestamp ? new Date(timestamp) : null;
  const timestampRef = useRef(transformedTimestamp);
  const [isOpen, setIsOpen] = useState(isOpenOnStart);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSave = useCallback(() => {
    saveFunction(timestampRef.current);
    setIsOpen(false);
  }, []);

  const handleCellEditChange = (newTimestamp) => {
    timestampRef.current = newTimestamp;
    setTimestamp(newTimestamp);
  };

  const handleDefaultChange = (newTimestamp) => {
    timestampRef.current = newTimestamp;
    setTimestamp(newTimestamp);
    setIsOpen(false);
  };

  const SaveChangesSection = () => {
    return (
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex flex-column align-items-start gap-1">
          <div className="d-flex align-items-center gap-1">
            <div className={`fw-500 tjdbCellMenuShortcutsInfo`}>
              <SolidIcon name="enterbutton" />
            </div>
            <div className={`fw-400 tjdbCellMenuShortcutsText`}>Save Changes</div>
          </div>
          <div className="d-flex align-items-center gap-1">
            <div className={`fw-500 tjdbCellMenuShortcutsInfo`}>Esc</div>
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
                  <input
                    className="form-check-input"
                    type="checkbox"
                    // checked={nullValue}
                    // onChange={() => setNullValue((prev) => !prev)}
                  />
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
                    // checked={defaultValue}
                    // onChange={() => handleDefaultChange(columnDetails?.column_default, !defaultValue)}
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
            // disabled={cellValue == previousCellValue ? true : false}
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

  const CustomCalendarContainer = ({ children }) => {
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

  const memoizedCustomCalendarContainer = useCallback(CustomCalendarContainer, []);

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
      }}
    >
      <DatePickerComponent
        className={`input-field form-control validation-without-icon px-2 ${
          darkMode ? 'bg-dark color-white' : 'bg-light'
        }`}
        shouldCloseOnSelect={!isEditCell}
        onInputClick={() => setIsOpen(true)}
        onClickOutside={() => setIsOpen(false)}
        value={transformedTimestamp !== null ? transformedTimestamp : 'Select date'}
        selected={transformedTimestamp}
        onChange={(newTimestamp) => {
          isEditCell ? handleCellEditChange(newTimestamp) : handleDefaultChange(newTimestamp);
        }}
        open={isOpen}
        showTimeInput={enableTime ? true : false}
        showTimeSelectOnly={enableDate ? false : true}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        customInput={
          transformedTimestamp || !isEditCell ? (
            <input style={{ borderRadius: `${styles.borderRadius}px`, display: isEditCell ? 'block' : 'flex' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ padding: '0px 14px 0px 14px' }} className="cell-text-null">
                Null
              </span>
            </div>
          )
        }
        timeInputLabel={<div className={`${darkMode && 'theme-dark'}`}>Time</div>}
        dateFormat={format}
        {...(isEditCell && { calendarContainer: memoizedCustomCalendarContainer })}
      />
    </div>
  );
};
