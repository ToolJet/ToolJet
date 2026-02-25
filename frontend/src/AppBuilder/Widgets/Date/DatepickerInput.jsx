import React, { forwardRef, useEffect, useRef } from 'react';
import cx from 'classnames';
import Loader from '@/ToolJetUI/Loader/Loader';
import { IconX } from '@tabler/icons-react';
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
    isMandatory,
    inputId,
    auto,
    labelWidth,
    label,
    showClearBtn,
    onClear,
    inputPlaceholder = 'Select date',
    clearButtonRightOffset = 0,
    dataCy,
  }) => {
    // Check if value is a placeholder text (not an actual date/time value)
    const isPlaceholderValue =
      value === inputPlaceholder ||
      value === 'Select date' ||
      value === 'Select time' ||
      value === 'Select date and time' ||
      value === 'Select Date Range' ||
      (typeof value === 'string' && value.includes('→') && value.trim() === '→');

    const computedInputStyles = {
      ...inputStyles,
      color: isPlaceholderValue ? 'var(--cc-placeholder-text)' : inputStyles?.color,
    };

    const placeholderValues = new Set([
      inputPlaceholder,
      'Select date',
      'Select time',
      'Select date and time',
      'Select Date Range',
    ]);
    const hasValue = value !== null && value !== undefined && value !== '' && !placeholderValues.has(value);
    const shouldShowClearBtn = showClearBtn && hasValue && !disable && !loading;
    const clearButtonBaseRight = loaderStyles?.right ?? '11px';
    const clearButtonRight =
      clearButtonRightOffset > 0 ? `calc(${clearButtonBaseRight} + ${clearButtonRightOffset}px)` : clearButtonBaseRight;
    const clearButtonTop = '50%';
    const clearButtonTransform = 'translateY(-50%)';
    return (
      <>
        <input
          className={cx('table-column-datepicker-input text-truncate', {
            'is-invalid': !isValid && showValidationError,
          })}
          value={value}
          placeholder={inputPlaceholder}
          onClick={onClick}
          onFocus={() => setTextInputFocus(true)}
          onBlur={() => {
            setTextInputFocus(false);
            setShowValidationError(true);
          }}
          aria-hidden={!visibility}
          aria-disabled={disable || loading}
          aria-busy={loading}
          aria-required={isMandatory}
          aria-invalid={!isValid && showValidationError}
          aria-label={!auto && labelWidth == 0 && label?.length != 0 ? label : undefined}
          ref={dateInputRef}
          id={`component-${inputId}`}
          style={computedInputStyles}
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
          // disabled={disable || loading}
          data-cy={`${String(dataCy).toLowerCase()}-input-field`}
        />
        <span className="cell-icon-display">
          <IconElement style={iconStyles} width="16" className="table-column-datepicker-input-icon" data-cy={`${String(dataCy).toLowerCase()}-icon`} />
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
        {shouldShowClearBtn && (
          <button
            type="button"
            className="tj-input-clear-btn"
            aria-label="Clear"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              onClear?.();
            }}
            style={{
              position: 'absolute',
              right: clearButtonRight,
              top: clearButtonTop,
              transform: clearButtonTransform,
              zIndex: 3,
            }}
            data-cy={`${dataCy}-clear-button`}
          >
            <IconX size={16} color="var(--borders-strong)" className="cursor-pointer clear-indicator" />
          </button>
        )}
        {loading && <Loader style={{ ...loaderStyles }} width="16" />}
      </>
    );
  }
);
