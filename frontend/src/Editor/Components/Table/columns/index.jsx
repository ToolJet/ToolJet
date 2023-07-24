import React from 'react';
import _ from 'lodash';
import SelectSearch from 'react-select-search';
import { resolveReferences, validateWidget } from '@/_helpers/utils';
import { CustomSelect } from '../CustomSelect';
import { Tags } from '../Tags';
import { Radio } from '../Radio';
import { Toggle } from '../Toggle';
import { Datepicker } from '../Datepicker';
import moment from 'moment';

export default function generateColumnsData({
  columnProperties,
  columnSizes,
  currentState,
  handleCellValueChange,
  customFilter,
  defaultColumn,
  changeSet,
  tableData,
  variablesExposedForPreview,
  exposeToCodeHinter,
  id,
  fireEvent,
  tableRef,
  t,
  darkMode,
}) {
  return columnProperties.map((column) => {
    const columnSize = columnSizes[column.id] || columnSizes[column.name];
    const columnType = column.columnType;
    let sortType = 'alphanumeric';

    const columnOptions = {};
    if (
      columnType === 'dropdown' ||
      columnType === 'multiselect' ||
      columnType === 'badge' ||
      columnType === 'badges' ||
      columnType === 'radio' ||
      columnType === 'image'
    ) {
      columnOptions.selectOptions = [];
      const values = resolveReferences(column.values, currentState, []);
      const labels = resolveReferences(column.labels, currentState, []);

      if (Array.isArray(labels) && Array.isArray(values)) {
        columnOptions.selectOptions = labels.map((label, index) => {
          return { name: label, value: values[index] };
        });
      }
    }
    if (columnType === 'datepicker') {
      column.isTimeChecked = column.isTimeChecked ? column.isTimeChecked : false;
      column.dateFormat = column.dateFormat ? column.dateFormat : 'DD/MM/YYYY';
      column.parseDateFormat = column.parseDateFormat ?? column.dateFormat; //backwards compatibility
      sortType = (firstDate, secondDate) => {
        const columnKey = column.key || column.name;
        // Return -1 if second date is higher, 1 if first date is higher
        if (secondDate?.original[columnKey] === '') {
          return 1;
        } else if (firstDate?.original[columnKey] === '') return -1;

        const parsedFirstDate = moment(firstDate?.original[columnKey], column.parseDateFormat);
        const parsedSecondDate = moment(secondDate?.original[columnKey], column.parseDateFormat);

        if (moment(parsedSecondDate).isSameOrAfter(parsedFirstDate)) {
          return -1;
        } else {
          return 1;
        }
      };
    }

    const width = columnSize || defaultColumn.width;
    return {
      id: column.id,
      Header: resolveReferences(column.name, currentState) ?? '',
      accessor: column.key || column.name,
      filter: customFilter,
      width: width,
      columnOptions,
      cellBackgroundColor: column.cellBackgroundColor,
      columnType,
      isEditable: column.isEditable,
      key: column.key,
      textColor: column.textColor,
      minValue: column.minValue,
      maxValue: column.maxValue,
      minLength: column.minLength,
      maxLength: column.maxLength,
      regex: column.regex,
      customRule: column?.customRule,
      sortType,
      columnVisibility: column?.columnVisibility ?? true,
      Cell: function ({ cell, isEditable, newRowsChangeSet = null }) {
        const updatedChangeSet = newRowsChangeSet === null ? changeSet : newRowsChangeSet;
        const rowChangeSet = updatedChangeSet ? updatedChangeSet[cell.row.index] : null;
        let cellValue = rowChangeSet ? rowChangeSet[column.key || column.name] ?? cell.value : cell.value;

        const rowData = tableData?.[cell?.row?.index];
        if (
          cell.row.index === 0 &&
          !_.isEmpty(variablesExposedForPreview) &&
          !_.isEqual(variablesExposedForPreview[id]?.rowData, rowData)
        ) {
          const customResolvables = {};
          customResolvables[id] = { ...variablesExposedForPreview[id], rowData };
          exposeToCodeHinter((prevState) => ({ ...prevState, ...customResolvables }));
        }
        cellValue = cellValue === undefined || cellValue === null ? '' : cellValue;

        switch (columnType) {
          case 'string':
          case undefined:
          case 'default': {
            const textColor = resolveReferences(column.textColor, currentState, '', { cellValue, rowData });

            const cellStyles = {
              color: textColor ?? '',
            };

            if (isEditable) {
              const validationData = validateWidget({
                validationObject: {
                  regex: {
                    value: column.regex,
                  },
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
              const cellStyles = {
                color: textColor ?? '',
              };

              return (
                <div className="h-100 d-flex flex-column justify-content-center">
                  <input
                    type="text"
                    style={{ ...cellStyles, maxWidth: width }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (e.target.defaultValue !== e.target.value) {
                          handleCellValueChange(
                            cell.row.index,
                            column.key || column.name,
                            e.target.value,
                            cell.row.original
                          );
                        }
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.defaultValue !== e.target.value) {
                        handleCellValueChange(
                          cell.row.index,
                          column.key || column.name,
                          e.target.value,
                          cell.row.original
                        );
                      }
                    }}
                    className={`form-control-plaintext form-control-plaintext-sm ${!isValid ? 'is-invalid' : ''}`}
                    defaultValue={cellValue}
                  />
                  <div className="invalid-feedback">{validationError}</div>
                </div>
              );
            }
            return (
              <div className="d-flex align-items-center h-100" style={cellStyles}>
                {String(cellValue)}
              </div>
            );
          }
          case 'number': {
            const textColor = resolveReferences(column.textColor, currentState, '', { cellValue, rowData });

            const cellStyles = {
              color: textColor ?? '',
            };
            if (isEditable) {
              const validationData = validateWidget({
                validationObject: {
                  minValue: {
                    value: column.minValue,
                  },
                  maxValue: {
                    value: column.maxValue,
                  },
                },
                widgetValue: cellValue,
                currentState,
                customResolveObjects: { cellValue },
              });

              const { isValid, validationError } = validationData;
              console.log('validationData', column.minValue, column.maxValue, validationData);
              const cellStyles = {
                color: textColor ?? '',
              };

              return (
                <div className="h-100 d-flex flex-column justify-content-center">
                  <input
                    type="number"
                    style={{ ...cellStyles, maxWidth: width }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (e.target.defaultValue !== e.target.value) {
                          handleCellValueChange(
                            cell.row.index,
                            column.key || column.name,
                            Number(e.target.value),
                            cell.row.original
                          );
                        }
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.defaultValue !== e.target.value) {
                        handleCellValueChange(
                          cell.row.index,
                          column.key || column.name,
                          Number(e.target.value),
                          cell.row.original
                        );
                      }
                    }}
                    className={`form-control-plaintext form-control-plaintext-sm ${!isValid ? 'is-invalid' : ''}`}
                    defaultValue={cellValue}
                  />
                  <div className="invalid-feedback">{validationError}</div>
                </div>
              );
            }
            return (
              <div className="d-flex align-items-center h-100" style={cellStyles}>
                {cellValue}
              </div>
            );
          }
          case 'text': {
            return (
              <textarea
                rows="1"
                className={`form-control-plaintext text-container ${
                  darkMode ? 'text-light textarea-dark-theme' : 'text-muted'
                }`}
                readOnly={!isEditable}
                style={{ maxWidth: width }}
                onBlur={(e) => {
                  if (isEditable && e.target.defaultValue !== e.target.value) {
                    handleCellValueChange(cell.row.index, column.key || column.name, e.target.value, cell.row.original);
                  }
                }}
                onKeyDown={(e) => {
                  e.persist();
                  if (e.key === 'Enter' && isEditable) {
                    handleCellValueChange(cell.row.index, column.key || column.name, e.target.value, cell.row.original);
                  }
                }}
                defaultValue={cellValue}
              ></textarea>
            );
          }
          case 'dropdown': {
            const validationData = validateWidget({
              validationObject: {
                regex: {
                  value: column.regex,
                },
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

            return (
              <div className="h-100 d-flex align-items-center">
                <SelectSearch
                  options={columnOptions.selectOptions}
                  value={cellValue}
                  search={true}
                  onChange={(value) => {
                    handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                  }}
                  fuzzySearch
                  placeholder={t('globals.select', 'Select') + '...'}
                  disabled={!isEditable}
                  className="select-search"
                />
                <div className={`invalid-feedback ${isValid ? '' : 'd-flex'}`}>{validationError}</div>
              </div>
            );
          }
          case 'multiselect': {
            return (
              <div className="h-100 d-flex align-items-center custom-select">
                <SelectSearch
                  printOptions="on-focus"
                  multiple
                  search={true}
                  placeholder={t('globals.select', 'Select') + '...'}
                  options={columnOptions.selectOptions}
                  value={cellValue}
                  onChange={(value) => {
                    handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                  }}
                  disabled={!isEditable}
                  className={'select-search'}
                />
              </div>
            );
          }
          case 'badge':
          case 'badges': {
            return (
              <div className="h-100 d-flex align-items-center">
                <CustomSelect
                  options={columnOptions.selectOptions}
                  value={cellValue}
                  multiple={columnType === 'badges'}
                  onChange={(value) => {
                    handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                  }}
                  darkMode={darkMode}
                  isEditable={isEditable}
                  width={width}
                />
              </div>
            );
          }
          case 'tags': {
            return (
              <div>
                <Tags
                  value={cellValue}
                  onChange={(value) => {
                    handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                  }}
                  readOnly={!isEditable}
                />
              </div>
            );
          }
          case 'image': {
            return (
              <div>
                {cellValue && (
                  <img
                    src={cellValue}
                    style={{
                      pointerEvents: 'auto',
                      width: `${column?.width}px`,
                      height: `${column?.height}px`,
                      borderRadius: `${column?.borderRadius}%`,
                      objectFit: `${column?.objectFit}`,
                    }}
                    alt={cellValue}
                  />
                )}
              </div>
            );
          }
          case 'radio': {
            return (
              <div className="h-100 d-flex align-items-center">
                <Radio
                  options={columnOptions.selectOptions}
                  value={cellValue}
                  readOnly={!isEditable}
                  onChange={(value) => {
                    handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                  }}
                />
              </div>
            );
          }
          case 'toggle': {
            return (
              <div className="h-100 d-flex align-items-center">
                <Toggle
                  value={cellValue}
                  readOnly={!isEditable}
                  activeColor={column.activeColor}
                  onChange={(value) => {
                    handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original).then(
                      () => {
                        fireEvent('OnTableToggleCellChanged', {
                          column: column,
                          rowId: cell.row.id,
                          row: cell.row.original,
                        });
                      }
                    );
                  }}
                />
              </div>
            );
          }
          case 'datepicker': {
            return (
              <div className="h-100 d-flex align-items-center">
                <Datepicker
                  timeZoneValue={column.timeZoneValue}
                  timeZoneDisplay={column.timeZoneDisplay}
                  dateDisplayFormat={column.dateFormat}
                  isTimeChecked={column.isTimeChecked}
                  value={cellValue}
                  readOnly={isEditable}
                  parseDateFormat={column.parseDateFormat}
                  onChange={(value) => {
                    handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                  }}
                  tableRef={tableRef}
                />
              </div>
            );
          }
        }
        return cellValue || '';
      },
    };
  });
}
