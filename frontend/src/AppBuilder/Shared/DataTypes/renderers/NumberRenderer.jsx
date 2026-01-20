import React, { useState, useEffect, useRef } from 'react';
import { determineJustifyContentValue } from '@/_helpers/utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { noop } from 'lodash';

/**
 * Utility function to generate input step for decimal places
 */
const getInputStep = (allowedDecimalPlaces) => {
  if (allowedDecimalPlaces === null || allowedDecimalPlaces === undefined) {
    return 'any';
  }

  const num = Number(allowedDecimalPlaces);
  if (!Number.isFinite(num) || num < 0) {
    return 'any';
  }

  const validDecimalPlaces = Math.floor(num);
  return validDecimalPlaces === 0 ? '1' : `0.${'0'.repeat(validDecimalPlaces - 1)}1`;
};

/**
 * Utility function to remove excess decimal places
 */
const removingExcessDecimalPlaces = (value, allowedDecimalPlaces) => {
  if (value?.toString()?.includes('.')) {
    const [integerPart, decimalPart] = value.toString().split('.');
    const truncatedDecimalPart = decimalPart.slice(0, allowedDecimalPlaces);
    return Number(`${integerPart}.${truncatedDecimalPart}`);
  }
  return value;
};

/**
 * NumberRenderer - Pure number value renderer with editing support
 *
 * Renders numeric values with increment/decrement controls, validation, and search highlighting.
 *
 * @param {Object} props
 * @param {number} props.value - The numeric value to render
 * @param {boolean} props.isEditable - Whether the value can be edited
 * @param {Function} props.onChange - Callback when value changes
 * @param {string} props.textColor - Text color
 * @param {string} props.horizontalAlignment - Horizontal alignment
 * @param {number} props.containerWidth - Container width for overlay
 * @param {boolean} props.darkMode - Whether dark mode is enabled
 * @param {number} props.decimalPlaces - Allowed decimal places
 * @param {boolean} props.isValid - Whether current value is valid
 * @param {string} props.validationError - Validation error message
 * @param {string} props.searchText - Search text for highlighting
 * @param {React.Component} props.SearchHighlightComponent - Optional component for search highlighting
 */
export const NumberRenderer = ({
  value: initialValue,
  isEditable = false,
  onChange,
  textColor,
  horizontalAlignment = 'left',
  containerWidth,
  darkMode = false,
  decimalPlaces = null,
  isValid = true,
  validationError,
  searchText,
  SearchHighlightComponent,
  setIsEditing = noop,
  id,
  className,
}) => {
  const cellValue = decimalPlaces !== null ? removingExcessDecimalPlaces(initialValue, decimalPlaces) : initialValue;
  const [displayValue, setDisplayValue] = useState(cellValue);
  const [showOverlay, setShowOverlay] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setDisplayValue(cellValue);
  }, [cellValue]);

  useEffect(() => {
    setShowOverlay(hovered);
  }, [hovered]);

  const handleIncrement = (e) => {
    e.preventDefault();
    const newValue = (cellValue || 0) + 1;
    if (!isNaN(newValue)) {
      onChange?.(Number(newValue));
    }
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    const newValue = (cellValue || 0) - 1;
    if (!isNaN(newValue)) {
      onChange?.(Number(newValue));
    }
  };

  const handleValueChange = (value) => {
    if (value === '') return;

    const numValue = Number(value);
    if (isNaN(numValue)) return;

    const processedValue = decimalPlaces !== null ? removingExcessDecimalPlaces(numValue, decimalPlaces) : numValue;
    setDisplayValue(processedValue);
    onChange?.(processedValue);
  };

  const getOverlay = () => (
    <div
      className={`overlay-cell-table ${darkMode ? 'dark-theme' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ color: 'var(--text-primary)' }}
    >
      <span style={{ width: `${containerWidth}px` }}>{String(cellValue)}</span>
    </div>
  );

  const _showOverlay =
    ref?.current &&
    (ref?.current?.clientWidth < ref?.current?.children[0]?.offsetWidth ||
      ref?.current?.clientHeight < ref?.current?.children[0]?.offsetHeight);

  const renderText = (text) => {
    if (SearchHighlightComponent) {
      return <SearchHighlightComponent text={String(text)} searchTerm={searchText} />;
    }
    return String(text);
  };

  if (isEditable) {
    return (
      <div className="h-100 d-flex flex-column justify-content-center position-relative">
        <input
          id={id}
          type="number"
          style={{
            color: textColor || 'inherit',
            outline: 'none',
            border: 'none',
            background: 'inherit',
            paddingRight: '20px',
          }}
          className={`${className} input-number h-100 ${!isValid ? 'is-invalid' : ''}`}
          value={displayValue}
          onChange={(e) => setDisplayValue(e.target.value)}
          step={getInputStep(decimalPlaces)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (displayValue !== cellValue) {
                handleValueChange(displayValue);
              }
            }
          }}
          onBlur={() => {
            setIsEditing(false); // Required for KeyValuePair
            if (displayValue !== cellValue) {
              handleValueChange(displayValue);
            }
          }}
          onFocus={(e) => e.stopPropagation()}
        />
        <div className="arror-container">
          <div onClick={handleIncrement}>
            <SolidIcon
              width="16px"
              style={{ top: '1px', right: '1px', zIndex: 3 }}
              className="numberinput-up-arrow-table"
              name="uparrow"
              fill="var(--icons-default)"
            />
          </div>
          <div onClick={handleDecrement}>
            <SolidIcon
              style={{ right: '1px', bottom: '1px', zIndex: 3 }}
              width="16px"
              className="numberinput-down-arrow-table"
              name="downarrow"
              fill="var(--icons-default)"
            />
          </div>
        </div>
        {!isValid && <div className="invalid-feedback text-truncate">{validationError}</div>}
      </div>
    );
  }

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={_showOverlay ? getOverlay() : <div />}
      trigger={_showOverlay && ['hover', 'focus']}
      rootClose={true}
      show={_showOverlay && showOverlay}
    >
      <div
        className={`d-flex align-items-center h-100 w-100 justify-content-${determineJustifyContentValue(
          horizontalAlignment
        )}`}
        style={{ color: textColor || 'inherit', overflow: 'hidden' }}
        onMouseMove={() => !hovered && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        ref={ref}
      >
        {renderText(cellValue)}
      </div>
    </OverlayTrigger>
  );
};

export default NumberRenderer;
