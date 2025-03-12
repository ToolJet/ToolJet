import React, { forwardRef, useEffect, useRef } from 'react';
import cx from 'classnames';
import Loader from '@/ToolJetUI/Loader/Loader';
import moment from 'moment-timezone';

export const DatepickerInput = forwardRef(
  ({
    value,
    onClick,
    inputStyles,
    dateInputRef,
    iconStyles,
    loaderStyles,
    loading,
    disable,
    onInputChange,
    datepickerSelectionType = 'single',
    displayFormat,
    setDisplayTimestamp,
    setTextInputFocus,
    IconElement,
    showValidationError,
    setShowValidationError,
    isValid,
    validationError,
    visibility,
    errTextColor,
    direction,
  }) => {
    return (
      <>
        <input
          className={cx('table-column-datepicker-input text-truncate', {
            'is-invalid': !isValid && showValidationError,
          })}
          value={value}
          onClick={onClick}
          onFocus={() => setTextInputFocus(true)}
          onBlur={() => {
            setTextInputFocus(false);
            setShowValidationError(true);
          }}
          ref={dateInputRef}
          style={inputStyles}
          onChange={(e) => {
            const inputVal = e.target.value;
            setDisplayTimestamp(inputVal);
            if (datepickerSelectionType === 'range') {
              const [start, end] = inputVal.split('-');
              const parsedStartDate = moment(start, displayFormat);
              const parsedEndDate = moment(end, displayFormat);
              if (parsedStartDate.isValid() && parsedEndDate.isValid()) {
                onInputChange([parsedStartDate.toDate(), parsedEndDate.toDate()]);
              }
            } else {
              const parsedDate = moment(inputVal, displayFormat);
              if (parsedDate.isValid()) {
                onInputChange(parsedDate.toDate());
              }
            }
          }}
          disabled={disable || loading}
        />
        <span className="cell-icon-display">
          <IconElement style={iconStyles} width="16" className="table-column-datepicker-input-icon" />
        </span>
        <span>
          {!isValid && showValidationError && visibility && (
            <div
              style={{
                color: errTextColor,
                fontSize: '11px',
                fontWeight: '400',
                lineHeight: '16px',
                position: 'absolute',
                [direction == 'left' ? 'right' : 'left']: '0',
              }}
            >
              {showValidationError && validationError}
            </div>
          )}
        </span>
        {loading && <Loader style={{ ...loaderStyles }} width="16" />}
      </>
    );
  }
);
