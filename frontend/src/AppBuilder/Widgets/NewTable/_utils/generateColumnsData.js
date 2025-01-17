import React from 'react';
import _ from 'lodash';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { determineJustifyContentValue } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';
import {
  SelectColumn,
  MultiSelectColumn,
  TagsColumn,
  RadioColumn,
  ToggleColumn,
  DatepickerColumn,
  LinkColumn,
  BooleanColumn,
  StringColumn,
  NumberColumn,
  //   CustomSelectColumn,
  ImageColumn,
} from '../_components/DataTypes';

export default function generateColumnsData({
  columnProperties,
  columnSizes,
  defaultColumn = { width: 150 },
  changeSet,
  tableData,
  id,
  darkMode,
  fireEvent,
  tableRef,
  handleCellValueChange,
  validateDates,
  currentState,
  tableColumnEvents,
}) {
  const getResolvedValue = useStore.getState().getResolvedValue;
  if (!columnProperties) return [];

  return columnProperties
    .map((column) => {
      if (!column) return null;

      const columnSize = columnSizes[column?.id] || columnSizes[column?.name] || column.columnSize;
      const columnType = column?.columnType;

      // Process column options for select types
      let columnOptions = {};
      if (['dropdown', 'multiselect', 'badge', 'badges', 'radio', 'image'].includes(columnType)) {
        const values = getResolvedValue(column.values) || [];
        const labels = getResolvedValue(column.labels) || [];

        columnOptions.selectOptions = labels.map((label, index) => ({
          name: label,
          value: values[index],
        }));
      }

      // Handle select and multiselect options
      let useDynamicOptions = false;
      if (columnType === 'select' || columnType === 'newMultiSelect') {
        useDynamicOptions = getResolvedValue(column?.useDynamicOptions);
        if (useDynamicOptions) {
          const dynamicOptions = getResolvedValue(column?.dynamicOptions || []);
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

      const columnDef = {
        id: column.id || uuidv4(),
        accessorKey: column.key || column.name,
        header: getResolvedValue(column.name) ?? '',
        enableSorting: true,
        enableResizing: true,
        enableHiding: true,
        enableColumnFilter: true,
        size: columnSize || defaultColumn.width,
        minSize: 30,
        show: column?.columnVisibility ?? true,
        meta: {
          columnType,
          isEditable: column.isEditable,
          textColor: column.textColor,
          cellBackgroundColor: column.cellBackgroundColor,
          horizontalAlignment: column?.horizontalAlignment ?? 'left',
          transformation: column.transformation,
          validation: column.validation,
          columnVisibility: column.columnVisibility,
          ...column,
        },

        cell: ({ cell, row }) => {
          const cellValue = changeSet?.[row.index]?.[column.key || column.name] ?? cell.getValue();
          const rowData = tableData?.[row.index];

          const cellStyles = {
            color: getResolvedValue(column.textColor, { cellValue, rowData }) ?? '',
            backgroundColor: getResolvedValue(column.cellBackgroundColor, { cellValue, rowData }) ?? '',
            justifyContent: determineJustifyContentValue(column?.horizontalAlignment),
          };

          const CellWrapper = ({ children }) => (
            <div className="d-flex align-items-center h-100 w-100" style={cellStyles}>
              {children}
            </div>
          );

          switch (columnType) {
            case 'string':
            case undefined:
            case 'default':
              return (
                <StringColumn
                  isEditable={column.isEditable}
                  darkMode={darkMode}
                  handleCellValueChange={handleCellValueChange}
                  cellTextColor={getResolvedValue(column.textColor, { cellValue, rowData })}
                  horizontalAlignment={column?.horizontalAlignment}
                  cellValue={cellValue}
                  column={column}
                  currentState={currentState}
                  containerWidth={columnSize}
                  cell={cell}
                  row={row}
                />
              );

            case 'number':
              return <CellWrapper>{Number(cellValue)}</CellWrapper>;

            case 'boolean':
              return (
                <div className="h-100 d-flex align-items-center">
                  <BooleanColumn
                    value={!!cellValue}
                    isEditable={column.isEditable}
                    onChange={(value) =>
                      handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original)
                    }
                    toggleOnBg={column?.toggleOnBg}
                    toggleOffBg={column?.toggleOffBg}
                  />
                </div>
              );

            // case 'dropdown':
            // case 'select':
            //   return (
            //     <CustomSelect
            //       options={columnOptions.selectOptions}
            //       value={cellValue}
            //       onChange={(value) => handleCellValueChange(row.index, column.key || column.name, value, row.original)}
            //       readOnly={!column.isEditable}
            //     />
            //   );

            // case 'multiselect':
            // case 'newMultiSelect':
            //   return (
            //     <CustomDropdown
            //       options={columnOptions.selectOptions}
            //       value={cellValue}
            //       onChange={(value) => handleCellValueChange(row.index, column.key || column.name, value, row.original)}
            //       readOnly={!column.isEditable}
            //       darkMode={darkMode}
            //     />
            //   );

            case 'badge':
            case 'badges':
              return <TagsColumn tags={Array.isArray(cellValue) ? cellValue : [cellValue]} darkMode={darkMode} />;

            case 'radio':
              return (
                <RadioColumn
                  options={columnOptions.selectOptions}
                  value={cellValue}
                  readOnly={!column.isEditable}
                  onChange={(value) => handleCellValueChange(row.index, column.key || column.name, value, row.original)}
                  containerWidth={columnSize}
                />
              );

            case 'toggle':
              return (
                <ToggleColumn
                  value={cellValue}
                  readOnly={!column.isEditable}
                  activeColor={column.activeColor}
                  onChange={(value) => {
                    handleCellValueChange(row.index, column.key || column.name, value, row.original);
                    fireEvent('OnTableToggleCellChanged', {
                      column: column,
                      rowId: row.id,
                      row: row.original,
                      tableColumnEvents,
                    });
                  }}
                />
              );

            case 'datepicker':
              return (
                <DatepickerColumn
                  timeZoneValue={column.timeZoneValue}
                  timeZoneDisplay={column.timeZoneDisplay}
                  dateDisplayFormat={column.dateFormat}
                  isTimeChecked={getResolvedValue(column?.isTimeChecked, { cellValue, rowData }) ?? false}
                  value={cellValue}
                  readOnly={!column.isEditable}
                  parseDateFormat={column.parseDateFormat}
                  onChange={(value) => handleCellValueChange(row.index, column.key || column.name, value, row.original)}
                  tableRef={tableRef}
                  isDateSelectionEnabled={
                    getResolvedValue(column?.isDateSelectionEnabled, { cellValue, rowData }) ?? true
                  }
                  isTwentyFourHrFormatEnabled={
                    getResolvedValue(column?.isTwentyFourHrFormatEnabled, { cellValue, rowData }) ?? false
                  }
                  darkMode={darkMode}
                />
              );

            case 'link': {
              const linkTarget =
                getResolvedValue(column?.linkTarget ?? '{{true}}', {
                  cellValue,
                  rowData,
                }) ?? '';
              const displayText =
                getResolvedValue(column?.displayText ?? '{{}}', {
                  cellValue,
                  rowData,
                }) ?? '';
              const linkColor =
                getResolvedValue(column?.linkColor ?? '#1B1F24', {
                  cellValue,
                  rowData,
                }) ?? '';
              const underlineColor =
                getResolvedValue(column.underlineColor ?? '', {
                  cellValue,
                  rowData,
                }) ?? '';

              return (
                <div className="h-100 d-flex align-items-center">
                  <LinkColumn
                    cellValue={cellValue}
                    linkTarget={linkTarget}
                    linkColor={linkColor}
                    underlineColor={underlineColor}
                    underline={column.underline}
                    displayText={displayText}
                    darkMode={darkMode}
                  />
                </div>
              );
            }

            case 'image': {
              const computeImageHeight = column?.height ? `${column?.height}px` : '100%';
              return (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                  <ImageColumn
                    cellValue={cellValue}
                    width={column?.width}
                    height={computeImageHeight}
                    borderRadius={column?.borderRadius}
                    objectFit={column?.objectFit}
                  />
                </div>
              );
            }

            default:
              return cellValue || '';
          }
        },
      };

      // Add sorting configuration for specific column types
      if (columnType === 'number') {
        columnDef.sortingFn = (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId);
          const b = rowB.getValue(columnId);
          return a < b ? -1 : a > b ? 1 : 0;
        };
      } else if (columnType === 'date' || columnType === 'datetime') {
        columnDef.sortingFn = (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId);
          const b = rowB.getValue(columnId);

          if (!a) return 1;
          if (!b) return -1;

          const dateA = moment(a);
          const dateB = moment(b);
          return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
        };
      }

      return columnDef;
    })
    .filter(Boolean);
}
