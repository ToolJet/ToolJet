import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const NumberColumn = ({
  isEditable,
  handleCellValueChange,
  cellTextColor,
  horizontalAlignment,
  cellValue,
  column,
  row,
  validateWidget,
  currentState,
}) => {
  const validationData =
    validateWidget?.({
      validationObject: {
        regex: { value: column.regex },
        minValue: { value: column.minValue },
        maxValue: { value: column.maxValue },
        customRule: { value: column.customRule },
      },
      widgetValue: cellValue,
      currentState,
      customResolveObjects: { cellValue },
    }) || {};

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

  return (
    <div className="h-100 d-flex flex-column justify-content-center position-relative">
      <input
        type="number"
        style={{
          color: cellTextColor,
          outline: 'none',
          border: 'none',
          background: 'inherit',
          paddingRight: '20px',
        }}
        disabled={!isEditable}
        onFocus={(e) => e.stopPropagation()}
        className={`table-column-type-input-element input-number h-100 ${!isValid ? 'is-invalid' : ''}`}
        defaultValue={cellValue}
        onChange={(e) => handleCellValueChange(row.index, column.key || column.name, e.target.value, row.original)}
      />
      {isEditable && (
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
              width="16px"
              style={{ right: '1px', bottom: '1px', zIndex: 3 }}
              className="numberinput-down-arrow-table"
              name="downarrow"
              fill="var(--icons-default)"
            />
          </div>
        </div>
      )}
      {!isValid && <div className="invalid-feedback d-block">{validationError}</div>}
    </div>
  );
};
