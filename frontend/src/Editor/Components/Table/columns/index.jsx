import React from 'react';
import _ from 'lodash';
import SelectSearch from 'react-select-search';
import { resolveReferences, validateWidget, determineJustifyContentValue, validateDates } from '@/_helpers/utils';
import { CustomDropdown } from '../CustomDropdown';
import { Tags } from '../Tags';
import { Radio } from '../Radio';
import { Toggle } from '../Toggle';
import { Datepicker } from '../Datepicker';
import { Link } from '../Link';
import moment from 'moment';
import { Boolean } from '../Boolean';
import { CustomSelect } from '../CustomSelect';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Text from '../Text';
import String from '../String';

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
  tableColumnEvents,
  cellSize,
  maxRowHeightValue,
}) {
  return columnProperties.map((column) => {
    if (!column) return;
    const columnSize = columnSizes[column?.id] || columnSizes[column?.name] || column.columnSize;

    const columnType = column?.columnType;
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
    if (columnType === 'select' || columnType === 'newMultiSelect') {
      columnOptions.selectOptions = [];
      const useDynamicOptions = resolveReferences(column?.useDynamicOptions, currentState);
      if (useDynamicOptions) {
        const dynamicOptions = resolveReferences(column?.dynamicOptions || [], currentState);
        columnOptions.selectOptions = Array.isArray(dynamicOptions) ? dynamicOptions : [];
      } else {
        const options = column?.options ?? [];
        columnOptions.selectOptions =
          options?.map((option) => ({
            label: option.label,
            value: option.value,
          })) ?? [];
      }
    }
    if (columnType === 'datepicker') {
      column.isTimeChecked = column.isTimeChecked ? column.isTimeChecked : false;
      column.dateFormat = column.dateFormat ? column.dateFormat : 'DD/MM/YYYY';
      column.parseDateFormat = column.parseDateFormat ?? column.dateFormat; //backwards compatibility
      column.isDateSelectionEnabled = column.isDateSelectionEnabled ?? true;

      sortType = (firstDate, secondDate) => {
        const columnKey = column.key || column.name;
        // Return -1 if second date is higher, 1 if first date is higher
        if (secondDate?.original[columnKey] === '') {
          return 1;
        } else if (firstDate?.original[columnKey] === '') {
          return -1;
        }

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
      horizontalAlignment: column?.horizontalAlignment ?? 'left',
      Cell: function ({
        cell,
        isEditable,
        newRowsChangeSet = null,
        horizontalAlignment,
        cellTextColor = '',
        contentWrap = true,
        autoHeight = true,
        isMaxRowHeightAuto,
      }) {
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
        cellValue = cellValue === undefined ? '' : cellValue;
        switch (columnType) {
          case 'string':
          case undefined:
          case 'default': {
            const cellTextColor = resolveReferences(column.textColor, currentState, '', { cellValue, rowData });
            return (
              <String
                isEditable={isEditable}
                darkMode={darkMode}
                handleCellValueChange={handleCellValueChange}
                cellTextColor={cellTextColor}
                horizontalAlignment={horizontalAlignment}
                cellValue={cellValue}
                column={column}
                currentState={currentState}
                containerWidth={width}
                cell={cell}
                isMaxRowHeightAuto={isMaxRowHeightAuto}
                cellSize={cellSize}
                maxRowHeightValue={maxRowHeightValue}
              />
            );

            // if (isEditable) {
            //   const validationData = validateWidget({
            //     validationObject: {
            //       regex: {
            //         value: column.regex,
            //       },
            //       minLength: {
            //         value: column.minLength,
            //       },
            //       maxLength: {
            //         value: column.maxLength,
            //       },
            //       customRule: {
            //         value: column.customRule,
            //       },
            //     },
            //     widgetValue: cellValue,
            //     currentState,
            //     customResolveObjects: { cellValue },
            //   });

            //   const { isValid, validationError } = validationData;
            //   const cellStyles = {
            //     color: textColor ?? 'inherit',
            //   };

            //   return (
            //     <div className="h-100 d-flex flex-column justify-content-center position-relative">
            //       <div
            //         rows="1"
            //         contentEditable={true}
            //         className={`${!isValid ? 'is-invalid' : ''} h-100 text-container long-text-input ${darkMode ? ' textarea-dark-theme' : ''
            //           }`}
            //         style={{
            //           ...cellStyles,
            //           maxWidth: width,
            //           outline: 'none',
            //           border: 'none',
            //           background: 'inherit',
            //         }}
            //         readOnly={!isEditable}
            //         onBlur={(e) => {
            //           if (cellValue !== e.target.textContent) {
            //             handleCellValueChange(
            //               cell.row.index,
            //               column.key || column.name,
            //               e.target.textContent,
            //               cell.row.original
            //             );
            //           }
            //         }}
            //         onKeyDown={(e) => {
            //           if (e.key === 'Enter') {
            //             if (cellValue !== e.target.textContent) {
            //               handleCellValueChange(
            //                 cell.row.index,
            //                 column.key || column.name,
            //                 e.target.textContent,
            //                 cell.row.original
            //               );
            //             }
            //           }
            //         }}
            //         onFocus={(e) => e.stopPropagation()}
            //       >
            //         {cellValue}
            //       </div>
            //       <div className={isValid ? '' : 'invalid-feedback'}>{validationError}</div>
            //     </div>
            //   );
            // }
            // return (
            //   <div
            //     className={`d-flex align-items-center h-100 w-100 justify-content-${determineJustifyContentValue(
            //       horizontalAlignment
            //     )}`}
            //     style={cellStyles}
            //   >
            //     {String(cellValue)}
            //   </div>
            // );
          }
          case 'number': {
            const textColor = resolveReferences(column.textColor, currentState, '', { cellValue, rowData });

            const cellStyles = {
              color: textColor ?? '',
              overflow: 'hidden',
            };
            if (isEditable) {
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
                currentState,
                customResolveObjects: { cellValue },
              });

              const { isValid, validationError } = validationData;
              const cellStyles = {
                color: textColor ?? '',
              };

              const handleIncrement = (e) => {
                e.preventDefault(); // Prevent the default button behavior (form submission, page reload)

                const newValue = (cellValue || 0) + 1;
                if (!isNaN(newValue)) {
                  handleCellValueChange(cell.row.index, column.key || column.name, Number(newValue), cell.row.original);
                }
              };

              const handleDecrement = (e) => {
                e.preventDefault();
                const newValue = (cellValue || 0) - 1;
                if (!isNaN(newValue)) {
                  handleCellValueChange(cell.row.index, column.key || column.name, Number(newValue), cell.row.original);
                }
              };

              const allowedDecimalPlaces = column?.decimalPlaces ?? null;
              const removingExcessDecimalPlaces = (cellValue, allowedDecimalPlaces) => {
                allowedDecimalPlaces = resolveReferences(allowedDecimalPlaces, currentState);
                if (cellValue?.toString()?.includes('.')) {
                  const splittedCellValue = cellValue?.toString()?.split('.');
                  const decimalPlacesUnderLimit = splittedCellValue[1]
                    .split('')
                    .splice(0, allowedDecimalPlaces)
                    .join('');
                  cellValue = Number(`${splittedCellValue[0]}.${decimalPlacesUnderLimit}`);
                }
                return cellValue;
              };
              cellValue = allowedDecimalPlaces
                ? removingExcessDecimalPlaces(cellValue, allowedDecimalPlaces)
                : cellValue;

              return (
                <div className="h-100 d-flex flex-column justify-content-center position-relative">
                  <input
                    type="number"
                    style={{
                      ...cellStyles,
                      outline: 'none',
                      border: 'none',
                      background: 'inherit',
                      paddingRight: '20px',
                    }}
                    id={`table-input-${column.id}-${cell.row.id}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (e.target.defaultValue !== e.target.value) {
                          const value = allowedDecimalPlaces
                            ? removingExcessDecimalPlaces(e.target.value, allowedDecimalPlaces)
                            : e.target.value;
                          handleCellValueChange(
                            cell.row.index,
                            column.key || column.name,
                            Number(value),
                            cell.row.original
                          );
                        }
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.defaultValue !== e.target.value) {
                        const value = allowedDecimalPlaces
                          ? removingExcessDecimalPlaces(e.target.value, allowedDecimalPlaces)
                          : e.target.value;
                        handleCellValueChange(
                          cell.row.index,
                          column.key || column.name,
                          Number(value),
                          cell.row.original
                        );
                      }
                    }}
                    onFocus={(e) => e.stopPropagation()}
                    className={`table-column-type-input-element input-number h-100 ${!isValid ? 'is-invalid' : ''}`}
                    defaultValue={cellValue}
                  />
                  <div className="arror-container">
                    <div onClick={(e) => handleIncrement(e)}>
                      <SolidIcon
                        width={'16px'}
                        style={{
                          top: '1px',
                          right: '1px',
                          zIndex: 3,
                        }}
                        className="numberinput-up-arrow-table "
                        name="uparrow"
                        fill={'var(--icons-default)'}
                      ></SolidIcon>
                    </div>
                    <div onClick={(e) => handleDecrement(e)}>
                      <SolidIcon
                        style={{
                          right: '1px',
                          bottom: '1px',
                          zIndex: 3,
                        }}
                        width={'16px'}
                        className="numberinput-down-arrow-table"
                        name="downarrow"
                        fill={'var(--icons-default)'}
                      ></SolidIcon>
                    </div>
                  </div>
                  <div className={isValid ? '' : 'invalid-feedback  text-truncate'}>{validationError}</div>
                </div>
              );
            }
            return (
              <div
                className={`d-flex align-items-center h-100 w-100 justify-content-${determineJustifyContentValue(
                  horizontalAlignment
                )}`}
                style={cellStyles}
              >
                {cellValue}
              </div>
            );
          }
          case 'text':
            return (
              // <div className="h-100 d-flex flex-column justify-content-center position-relative">
              <Text
                isEditable={isEditable}
                darkMode={darkMode}
                handleCellValueChange={handleCellValueChange}
                cellTextColor={cellTextColor}
                horizontalAlignment={horizontalAlignment}
                cellValue={cellValue}
                column={column}
                currentState={currentState}
                containerWidth={width}
                cell={cell}
                isMaxRowHeightAuto={isMaxRowHeightAuto}
                cellSize={cellSize}
                maxRowHeightValue={maxRowHeightValue}
              />
              // </div>
            );
          case 'dropdown':
          case 'select':
          case 'newMultiSelect': {
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
              <div
                className="h-100 d-flex align-items-center flex-column justify-content-center"
                styles={{ flex: '1 1 0' }}
              >
                {columnType === 'dropdown' && (
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
                )}
                {['newMultiSelect', 'select'].includes(columnType) && (
                  <CustomSelect
                    options={columnOptions.selectOptions}
                    value={cellValue}
                    search={true}
                    onChange={(value) => {
                      handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                    }}
                    fuzzySearch
                    placeholder={t('globals.select', 'Select') + '...'}
                    disabled={!isEditable}
                    className="select-search table-select-search"
                    darkMode={darkMode}
                    defaultOptionsList={column?.defaultOptionsList || []}
                    textColor={column?.textColor || 'var(--slate12)'}
                    isMulti={columnType === 'newMultiSelect' ? true : false}
                    containerWidth={width}
                    optionsLoadingState={
                      resolveReferences(column?.useDynamicOptions, currentState) &&
                      resolveReferences(column?.optionsLoadingState, currentState)
                        ? true
                        : false
                    }
                    horizontalAlignment={determineJustifyContentValue(horizontalAlignment)}
                    isEditable={isEditable}
                    isMaxRowHeightAuto={contentWrap && isMaxRowHeightAuto}
                  />
                )}
                <div className={` ${isValid ? 'd-none' : 'invalid-feedback d-block'}`}>{validationError}</div>
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
              <div
                className={`h-100 w-100 d-flex align-items-center justify-content-${determineJustifyContentValue(
                  horizontalAlignment
                )}`}
              >
                <CustomDropdown
                  options={columnOptions.selectOptions}
                  value={cellValue}
                  multiple={columnType === 'badges'}
                  onChange={(value) => {
                    handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                  }}
                  darkMode={darkMode}
                  isEditable={isEditable}
                  width={width}
                  contentWrap={contentWrap}
                  autoHeight={autoHeight}
                />
              </div>
            );
          }
          case 'tags': {
            return (
              <Tags
                value={cellValue}
                onChange={(value) => {
                  handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                }}
                readOnly={!isEditable}
                containerWidth={width}
              />
            );
          }
          case 'image': {
            const computeImageHeight = column?.height ? `${column?.height}px` : '100%';
            return (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                {cellValue && (
                  <img
                    src={cellValue}
                    style={{
                      pointerEvents: 'auto',
                      width: `${column?.width}px`,
                      height: computeImageHeight,
                      borderRadius: `${column?.borderRadius}%`,
                      objectFit: `${column?.objectFit}`,
                    }}
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
                  containerWidth={width}
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
                          tableColumnEvents,
                        });
                      }
                    );
                  }}
                />
              </div>
            );
          }
          case 'datepicker': {
            const textColor = resolveReferences(column.textColor, currentState, '', { cellValue, rowData });
            const isTimeChecked = resolveReferences(column?.isTimeChecked, currentState);
            const isTwentyFourHrFormatEnabled = resolveReferences(column?.isTwentyFourHrFormatEnabled, currentState);
            const disabledDates = resolveReferences(column?.disabledDates, currentState);
            const parseInUnixTimestamp = resolveReferences(column?.parseInUnixTimestamp, currentState);
            const isDateSelectionEnabled = resolveReferences(column?.isDateSelectionEnabled, currentState);
            const cellStyles = {
              color: textColor ?? '',
            };
            const validationData = validateDates({
              validationObject: {
                minDate: {
                  value: isDateSelectionEnabled ? column.minDate : undefined,
                },
                maxDate: {
                  value: isDateSelectionEnabled ? column.maxDate : undefined,
                },
                minTime: {
                  value: isTimeChecked ? column.minTime : undefined,
                },
                maxTime: {
                  value: isTimeChecked ? column.maxTime : undefined,
                },
                parseDateFormat: {
                  value: column.parseDateFormat,
                },
                isTwentyFourHrFormatEnabled: {
                  value: isTwentyFourHrFormatEnabled,
                },
                isDateSelectionEnabled: {
                  value: isDateSelectionEnabled,
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
              <div className="h-100 d-flex flex-column justify-content-center">
                <Datepicker
                  timeZoneValue={column.timeZoneValue}
                  timeZoneDisplay={column.timeZoneDisplay}
                  dateDisplayFormat={column.dateFormat}
                  isTimeChecked={isTimeChecked}
                  value={cellValue}
                  readOnly={!isEditable}
                  parseDateFormat={column.parseDateFormat}
                  onChange={(value) => {
                    handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                  }}
                  tableRef={tableRef}
                  isDateSelectionEnabled={isDateSelectionEnabled}
                  isTwentyFourHrFormatEnabled={isTwentyFourHrFormatEnabled}
                  timeFormat={column.timeFormat}
                  parseTimeFormat={column.parseTimeFormat}
                  parseInUnixTimestamp={parseInUnixTimestamp}
                  unixTimeStamp={column.unixTimestamp}
                  disabledDates={disabledDates}
                  unixTimestamp={column.unixTimestamp}
                  cellStyles={cellStyles}
                  darkMode={darkMode}
                />
                {isEditable && (
                  <div className={isValid ? '' : 'invalid-feedback d-block  text-truncate'}>{validationError}</div>
                )}
              </div>
            );
          }
          case 'link': {
            const linkTarget = resolveReferences(column?.linkTarget ?? '{{true}}', currentState);
            column = {
              ...column,
              linkColor: column?.linkColor ?? '#1B1F24',
              underlineColor: column?.underlineColor ?? '#4368E3',
            };
            return (
              <div className="h-100 d-flex align-items-center">
                <Link
                  cellValue={cellValue}
                  linkTarget={linkTarget}
                  linkColor={column.linkColor}
                  underlineColor={column.underlineColor}
                  underline={column.underline}
                  displayText={column.displayText}
                  darkMode={darkMode}
                />
              </div>
            );
          }
          case 'boolean': {
            return (
              <div className="h-100 d-flex align-items-center">
                <Boolean
                  value={!!cellValue}
                  isEditable={isEditable}
                  onChange={(value) =>
                    handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original)
                  }
                  toggleOnBg={column?.toggleOnBg}
                  toggleOffBg={column?.toggleOffBg}
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
