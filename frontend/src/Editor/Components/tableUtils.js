import { validateWidget, validateDates } from '@/_helpers/utils';

export const isRowInValid = (cell, currentState, changeSet) => {
  const rowChangeSet = changeSet ? changeSet[cell.row.index] : null;
  const key = cell.column.key || cell.column.Header;
  const cellValue = rowChangeSet ? rowChangeSet[key] || cell.value : cell.value;
  let validationData = {};
  if (cell.column.isEditable) {
    if (cell.column.columnType === 'number') {
      validationData = {
        ...validateWidget({
          validationObject: {
            minValue: {
              value: cell.column.minValue,
            },
            maxValue: {
              value: cell.column.maxValue,
            },
          },
          widgetValue: cellValue,
          currentState,
          customResolveObjects: { cellValue },
        }),
      };
    }
    if (['string', undefined, 'default', 'text'].includes(cell.column.columnType)) {
      validationData = {
        ...validateWidget({
          validationObject: {
            regex: {
              value: cell.column.regex,
            },
            minLength: {
              value: cell.column.minLength,
            },
            maxLength: {
              value: cell.column.maxLength,
            },
            customRule: {
              value: cell.column.customRule,
            },
          },
          widgetValue: cellValue,
          currentState,
          customResolveObjects: { cellValue: cellValue },
        }),
      };
    }
  }

  if (cell.column.columnType === 'datepicker') {
    validationData = {
      ...validateDates({
        validationObject: {
          minDate: {
            value: cell.column.minDate,
          },
          maxDate: {
            value: cell.column.maxDate,
          },
          minTime: {
            value: cell.column.minTime,
          },
          maxTime: {
            value: cell.column.maxTime,
          },
          parseDateFormat: {
            value: cell.column.parseDateFormat,
          },
        },
        widgetValue: cellValue,
        currentState,
        customResolveObjects: { cellValue },
      }),
    };
  }

  return validationData.isValid === false;
};
