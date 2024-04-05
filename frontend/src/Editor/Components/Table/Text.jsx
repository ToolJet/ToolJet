import React from 'react';
import { resolveReferences, validateWidget, determineJustifyContentValue } from '@/_helpers/utils';

const Text = ({
  isEditable,
  darkMode,
  handleCellValueChange,
  cellTextColor,
  horizontalAlignment,
  cellValue,
  column,
  currentState,
  width,
  cell,
}) => {
  const validationData = validateWidget({
    validationObject: {
      minLength: {
        value: column.minLength,
      },
      maxLength: {
        value: column.maxLength,
      },
      customRule: {
        value: column.customRule,
      },
    },
    widgetValue: cellValue,
    currentState,
    customResolveObjects: { cellValue },
  });
  const { isValid, validationError } = validationData;
  if (!isEditable) {
    return (
      <div
        className={`d-flex align-items-center h-100 w-100 justify-content-${determineJustifyContentValue(
          horizontalAlignment
        )}`}
        style={{
          color: cellTextColor ? cellTextColor : 'inherit',
          overflow: 'hidden',
        }}
      >
        {cellValue}
      </div>
    );
  }
  return (
    <>
      <textarea
        rows="1"
        className={`${!isValid ? 'is-invalid' : ''} h-100 long-text-input text-container ${
          darkMode ? ' textarea-dark-theme' : ''
        }`}
        style={{
          color: cellTextColor ? cellTextColor : 'inherit',
          maxWidth: width,
          outline: 'none',
          border: 'none',
          background: 'inherit',
        }}
        readOnly={!isEditable}
        onBlur={(e) => {
          if (isEditable && e.target.defaultValue !== e.target.value) {
            handleCellValueChange(cell.row.index, column.key || column.name, e.target.value, cell.row.original);
          }
        }}
        onKeyDown={(e) => {
          e.persist();
          if (e.key === 'Enter' && !e.shiftKey && isEditable) {
            handleCellValueChange(cell.row.index, column.key || column.name, e.target.value, cell.row.original);
          }
        }}
        onFocus={(e) => e.stopPropagation()}
        defaultValue={cellValue}
      ></textarea>
      <div className={isValid ? '' : 'invalid-feedback'}>{validationError}</div>
    </>
  );
};

export default Text;
