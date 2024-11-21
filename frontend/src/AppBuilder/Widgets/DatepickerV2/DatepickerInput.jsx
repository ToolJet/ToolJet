import React, { forwardRef, useEffect, useRef } from 'react';
import cx from 'classnames';
import Loader from '@/ToolJetUI/Loader/Loader';

export const DatepickerInput = forwardRef(
  ({
    value,
    onClick,
    inputStyles,
    dateInputRef,
    setFocus,
    onDateChange,
    iconStyles,
    loaderStyles,
    loading,
    disable,
    IconElement,
  }) => {
    return (
      <div>
        <input
          className={cx('table-column-datepicker-input text-truncate')}
          value={value}
          onClick={onClick}
          ref={dateInputRef}
          style={inputStyles}
          onChange={(e) => {
            setFocus(true);
            onDateChange(e.target.value);
          }}
          onFocus={() => {
            onDateChange(value);
          }}
          disabled={disable || loading}
        />
        {loading && <Loader style={{ ...loaderStyles }} width="16" />}
        <span className="cell-icon-display">
          <IconElement style={iconStyles} width="16" className="table-column-datepicker-input-icon" />
        </span>
      </div>
    );
  }
);
