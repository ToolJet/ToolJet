import React, { useState, useEffect, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { determineJustifyContentValue } from '@/_helpers/utils';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import HighLightSearch from '@/AppBuilder/Widgets/NewTable/_components/HighLightSearch';
import useTextColor from '../DataTypes/_hooks/useTextColor';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

// Utility function to generate input step for decimal places
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

export const NumberColumn = ({
  id,
  isEditable,
  handleCellValueChange,
  textColor,
  horizontalAlignment,
  cellValue,
  column,
  cell,
  row,
  searchText,
  containerWidth,
  darkMode,
}) => {
  const [displayValue, setDisplayValue] = useState(cellValue);
  const [showOverlay, setShowOverlay] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const validateWidget = useStore((state) => state.validateWidget, shallow);
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);
  const cellTextColor = useTextColor(id, textColor);

  useEffect(() => {
    setDisplayValue(cellValue);
  }, [cellValue]);

  useEffect(() => {
    setShowOverlay(hovered);
  }, [hovered]);

  const removingExcessDecimalPlaces = (value, allowedDecimalPlaces) => {
    if (value?.toString()?.includes('.')) {
      const [integerPart, decimalPart] = value.toString().split('.');
      const truncatedDecimalPart = decimalPart.slice(0, allowedDecimalPlaces);
      return Number(`${integerPart}.${truncatedDecimalPart}`);
    }
    return value;
  };

  const allowedDecimalPlaces = getResolvedValue(column?.decimalPlaces) ?? null;
  cellValue = allowedDecimalPlaces ? removingExcessDecimalPlaces(cellValue, allowedDecimalPlaces) : cellValue;

  const validationData = validateWidget({
    validationObject: {
      minValue: {
        value: column?.minValue,
      },
      maxValue: {
        value: column?.maxValue,
      },
      regex: {
        value: column?.regex,
      },
      customRule: {
        value: column?.customRule,
      },
    },
    widgetValue: cellValue,
    customResolveObjects: { cellValue },
  });

  const { isValid, validationError } = validationData;

  const handleIncrement = (e) => {
    e.preventDefault();
    const newValue = (cellValue || 0) + 1;
    if (!isNaN(newValue)) {
      handleCellValueChange(row.index, column.key || column.name, Number(newValue), row.original);
    }
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    const newValue = (cellValue || 0) - 1;
    if (!isNaN(newValue)) {
      handleCellValueChange(row.index, column.key || column.name, Number(newValue), row.original);
    }
  };

  const handleValueChange = (value) => {
    if (value === '') return;

    const numValue = Number(value);
    if (isNaN(numValue)) return;

    const processedValue =
      allowedDecimalPlaces !== null ? removingExcessDecimalPlaces(numValue, allowedDecimalPlaces) : numValue;
    setDisplayValue(processedValue);
    handleCellValueChange(row.index, column.key || column.name, processedValue, row.original);
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

  if (isEditable) {
    return (
      <div className="h-100 d-flex flex-column justify-content-center position-relative">
        <input
          type="number"
          style={{
            color: cellTextColor || 'inherit',
            outline: 'none',
            border: 'none',
            background: 'inherit',
            paddingRight: '20px',
          }}
          className={`table-column-type-input-element input-number h-100 ${!isValid ? 'is-invalid' : ''}`}
          value={displayValue}
          onChange={(e) => setDisplayValue(e.target.value)}
          step={getInputStep(allowedDecimalPlaces)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (displayValue !== cellValue) {
                handleValueChange(displayValue);
              }
            }
          }}
          onBlur={() => {
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
              style={{
                top: '1px',
                right: '1px',
                zIndex: 3,
              }}
              className="numberinput-up-arrow-table"
              name="uparrow"
              fill="var(--icons-default)"
            />
          </div>
          <div onClick={handleDecrement}>
            <SolidIcon
              style={{
                right: '1px',
                bottom: '1px',
                zIndex: 3,
              }}
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
        style={{ color: cellTextColor || 'inherit', overflow: 'hidden' }}
        onMouseMove={() => !hovered && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        ref={ref}
      >
        <HighLightSearch text={String(cellValue)} searchTerm={searchText} />
      </div>
    </OverlayTrigger>
  );
};
