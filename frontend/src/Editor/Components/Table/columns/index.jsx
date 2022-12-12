import React from 'react';
import _ from 'lodash';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { resolveReferences, validateWidget } from '@/_helpers/utils';
import { CustomSelect } from '../CustomSelect';
import { Tags } from '../Tags';
import { Radio } from '../Radio';
import { Toggle } from '../Toggle';
import { Datepicker } from '../Datepicker';

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
    }

    const width = columnSize || defaultColumn.width;

    return {
      id: column.id,
      Header: column.name,
      accessor: column.key || column.name,
      filter: customFilter,
      width: width,
      columnOptions,
      cellBackgroundColor: column.cellBackgroundColor,
      columnType,
      isEditable: column.isEditable,
      Cell: function (cell) {
        const rowChangeSet = changeSet ? changeSet[cell.row.index] : null;
        const cellValue = rowChangeSet ? rowChangeSet[column.name] || cell.value : cell.value;
        const rowData = tableData[cell.row.index];

        if (
          cell.row.index === 0 &&
          variablesExposedForPreview &&
          !_.isEqual(variablesExposedForPreview[id]?.rowData, rowData)
        ) {
          const customResolvables = {};
          customResolvables[id] = { ...variablesExposedForPreview[id], rowData };
          exposeToCodeHinter((prevState) => ({ ...prevState, ...customResolvables }));
        }

        switch (columnType) {
          case 'string':
          case undefined:
          case 'default': {
            const textColor = resolveReferences(column.textColor, currentState, '', { cellValue, rowData });

            const cellStyles = {
              color: textColor ?? '',
            };

            if (column.isEditable) {
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
                <div>
                  <input
                    type="text"
                    style={{ ...cellStyles, maxWidth: width, minWidth: width - 10 }}
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
            return <span style={cellStyles}>{cellValue}</span>;
          }
          case 'number': {
            const textColor = resolveReferences(column.textColor, currentState, '', { cellValue, rowData });

            const cellStyles = {
              color: textColor ?? '',
            };

            if (column.isEditable) {
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
                <div>
                  <input
                    type="number"
                    style={{ ...cellStyles, maxWidth: width, minWidth: width - 10 }}
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
            return <span style={cellStyles}>{cellValue}</span>;
          }
          case 'text': {
            return (
              <textarea
                rows="1"
                className={`form-control-plaintext text-container ${
                  darkMode ? 'text-light textarea-dark-theme' : 'text-muted'
                }`}
                readOnly={!column.isEditable}
                style={{ maxWidth: width, minWidth: width - 10 }}
                onBlur={(e) => {
                  if (column.isEditable) {
                    handleCellValueChange(cell.row.index, column.key || column.name, e.target.value, cell.row.original);
                  }
                }}
                onKeyDown={(e) => {
                  e.persist();
                  if (e.key === 'Enter' && column.isEditable) {
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
              <div>
                <SelectSearch
                  options={columnOptions.selectOptions}
                  value={cellValue}
                  search={true}
                  onChange={(value) => {
                    handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                  }}
                  filterOptions={fuzzySearch}
                  placeholder={t('globals.select', 'Select') + '...'}
                  disabled={!column.isEditable}
                  className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                />
                <div className={`invalid-feedback ${isValid ? '' : 'd-flex'}`}>{validationError}</div>
              </div>
            );
          }
          case 'multiselect': {
            return (
              <div>
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
                  disabled={!column.isEditable}
                  className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                />
              </div>
            );
          }
          case 'badge':
          case 'badges': {
            return (
              <div>
                <CustomSelect
                  options={columnOptions.selectOptions}
                  value={cellValue}
                  multiple={columnType === 'badges'}
                  onChange={(value) => {
                    handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                  }}
                  darkMode={darkMode}
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
              <div>
                <Radio
                  options={columnOptions.selectOptions}
                  value={cellValue}
                  readOnly={!column.isEditable}
                  onChange={(value) => {
                    handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                  }}
                />
              </div>
            );
          }
          case 'toggle': {
            return (
              <div>
                <Toggle
                  value={cellValue}
                  readOnly={!column.isEditable}
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
              <div>
                <Datepicker
                  timeZoneValue={column.timeZoneValue}
                  timeZoneDisplay={column.timeZoneDisplay}
                  dateDisplayFormat={column.dateFormat}
                  isTimeChecked={column.isTimeChecked}
                  value={cellValue}
                  readOnly={column.isEditable}
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
