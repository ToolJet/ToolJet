import React, { useState, useEffect } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { determineJustifyContentValue } from '@/_helpers/utils';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import HighLightSearch from '@/AppBuilder/Widgets/NewTable/_components/HighLightSearch';

export const NumberColumn = ({
  isEditable,
  handleCellValueChange,
  cellTextColor,
  horizontalAlignment,
  cellValue,
  column,
  cell,
  row,
  searchText,
}) => {
  const [displayValue, setDisplayValue] = useState(cellValue);
  const validateWidget = useStore((state) => state.validateWidget, shallow);
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);

  useEffect(() => {
    setDisplayValue(cellValue);
  }, [cellValue]);

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
          step={allowedDecimalPlaces !== null ? `0.${'0'.repeat(allowedDecimalPlaces - 1)}1` : 'any'}
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
    <div
      className={`d-flex align-items-center h-100 w-100 justify-content-${determineJustifyContentValue(
        horizontalAlignment
      )}`}
      style={{ color: cellTextColor || 'inherit', overflow: 'hidden' }}
    >
      <HighLightSearch text={String(cellValue)} searchTerm={searchText} />
    </div>
  );
};
