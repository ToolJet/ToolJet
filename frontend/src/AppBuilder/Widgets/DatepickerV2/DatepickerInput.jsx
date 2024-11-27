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
    setFocus,
    iconStyles,
    loaderStyles,
    loading,
    disable,
    onInputChange,
    displayFormat,
    setDisplayTimestamp,
    setTextInputFocus,
    IconElement,
  }) => {
    return (
      <>
        <input
          className={cx('table-column-datepicker-input text-truncate')}
          value={value}
          onClick={onClick}
          onFocus={() => setTextInputFocus(true)}
          onBlur={() => setTextInputFocus(false)}
          ref={dateInputRef}
          style={inputStyles}
          onChange={(e) => {
            const inputVal = e.target.value;
            setDisplayTimestamp(inputVal);
            const parsedDate = moment(inputVal, displayFormat);
            if (parsedDate.isValid()) {
              onInputChange(parsedDate.toDate());
            }
            setFocus(true);
          }}
          disabled={disable || loading}
        />
        <span className="cell-icon-display">
          <IconElement style={iconStyles} width="16" className="table-column-datepicker-input-icon" />
        </span>
        {loading && <Loader style={{ ...loaderStyles }} width="16" />}
      </>
    );
  }
);
