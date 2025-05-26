import React from 'react';
import _ from 'lodash';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import useStore from '@/AppBuilder/_stores/store';
import {
  StringColumn,
  NumberColumn,
  BooleanColumn,
  TagsColumn,
  RadioColumn,
  ToggleColumn,
  DatepickerColumn,
  LinkColumn,
  // SelectColumn,
  // MultiSelectColumn,
  ImageColumn,
  CustomSelectColumn,
  CustomDropdownColumn,
  TextColumn,
  JsonColumn,
  MarkdownColumn,
} from '../_components/DataTypes';
import useTableStore from '../_stores/tableStore';

import SelectSearch from 'react-select-search';

export default function generateColumnsData({
  columnProperties,
  columnSizes,
  defaultColumn = { width: 150 },
  tableData,
  id,
  darkMode,
  fireEvent,
  tableRef,
  handleCellValueChange,
  validateDates,
  searchText,
  columnForAddNewRow = false,
}) {
  const getResolvedValue = useStore.getState().getResolvedValue;
  const getEditedRowFromIndex = useTableStore.getState().getEditedRowFromIndex;
  const getAddNewRowDetailFromIndex = useTableStore.getState().getAddNewRowDetailFromIndex;
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
              optionColor: option.optionColor,
              labelColor: option.labelColor,
            })) ?? [];
        }
      }

      const isEditable = getResolvedValue(column.isEditable);
      const isVisible = getResolvedValue(column.columnVisibility) ?? true;
      const autoAssignColors = getResolvedValue(column.autoAssignColors) ?? false;

      if (!isVisible) return null;

      const columnDef = {
        id: column.id || uuidv4(),
        accessorKey: column.key || column.name,
        header: getResolvedValue(column.name) ?? '',
        enableSorting: true,
        enableResizing: true,
        enableHiding: true,
        enableColumnFilter: true,
        filterFn: 'applyFilters',
        size: columnSize || defaultColumn.width,
        minSize: 60,
        show: isVisible,
        meta: {
          columnType,
          isEditable: isEditable,
          textColor: column.textColor,
          cellBackgroundColor: column.cellBackgroundColor,
          horizontalAlignment: column?.horizontalAlignment ?? 'left',
          transformation: column.transformation,
          validation: column.validation,
          columnVisibility: isVisible,
          ...column,
        },

        cell: ({ cell, row }) => {
          const changeSet = columnForAddNewRow
            ? getAddNewRowDetailFromIndex(id, row.index)
            : getEditedRowFromIndex(id, row.index);

          let cellValue = changeSet ? changeSet[cell.column.columnDef?.meta?.name] ?? cell.getValue() : cell.getValue();
          cellValue = cellValue === undefined || cellValue === null ? '' : cellValue;
          const rowData = tableData?.[row.index];

          switch (columnType) {
            case 'string':
            case undefined:
            case 'default':
              return (
                <StringColumn
                  isEditable={isEditable}
                  darkMode={darkMode}
                  handleCellValueChange={handleCellValueChange}
                  textColor={getResolvedValue(column.textColor, { cellValue, rowData })}
                  horizontalAlignment={column?.horizontalAlignment}
                  cellValue={cellValue}
                  column={column}
                  containerWidth={columnSize}
                  cell={cell}
                  row={row}
                  id={id}
                  searchText={searchText}
                />
              );

            case 'text':
              return (
                <TextColumn
                  isEditable={isEditable}
                  darkMode={darkMode}
                  handleCellValueChange={handleCellValueChange}
                  textColor={getResolvedValue(column.textColor, { cellValue, rowData })}
                  horizontalAlignment={column?.horizontalAlignment}
                  cellValue={cellValue}
                  column={column}
                  containerWidth={columnSize}
                  cell={cell}
                  row={row}
                  id={id}
                  searchText={searchText}
                />
              );

            case 'number':
              return (
                <NumberColumn
                  isEditable={isEditable}
                  handleCellValueChange={handleCellValueChange}
                  textColor={getResolvedValue(column.textColor, { cellValue, rowData })}
                  horizontalAlignment={column?.horizontalAlignment}
                  cellValue={cellValue}
                  column={column}
                  containerWidth={columnSize}
                  cell={cell}
                  row={row}
                  id={id}
                  searchText={searchText}
                />
              );

            case 'boolean':
              return (
                <BooleanColumn
                  value={!!cellValue}
                  isEditable={isEditable}
                  onChange={(value) =>
                    handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original)
                  }
                  toggleOnBg={column?.toggleOnBg}
                  toggleOffBg={column?.toggleOffBg}
                />
              );

            case 'tags':
              return <TagsColumn tags={Array.isArray(cellValue) ? cellValue : [cellValue]} darkMode={darkMode} />;

            case 'dropdown':
            case 'multiselect':
              return (
                <SelectSearch
                  options={columnOptions.selectOptions}
                  value={cellValue}
                  onChange={(value) => handleCellValueChange(row.index, column.key || column.name, value, row.original)}
                  readOnly={!isEditable}
                  darkMode={darkMode}
                  containerWidth={columnSize}
                  isEditable={isEditable}
                  multiple={columnType === 'multiselect'}
                />
              );

            case 'select':
            case 'newMultiSelect':
              return (
                <CustomSelectColumn
                  options={columnOptions.selectOptions}
                  value={cellValue}
                  onChange={(value) => handleCellValueChange(row.index, column.key || column.name, value, row.original)}
                  disabled={!isEditable}
                  darkMode={darkMode}
                  containerWidth={columnSize}
                  defaultOptionsList={column?.defaultOptionsList || []}
                  optionsLoadingState={
                    getResolvedValue(column?.useDynamicOptions) && getResolvedValue(column?.optionsLoadingState)
                      ? true
                      : false
                  }
                  autoAssignColors={autoAssignColors}
                  isEditable={isEditable}
                  isMulti={columnType === 'newMultiSelect'}
                  className="select-search table-select-search"
                  column={column}
                  isNewRow={columnForAddNewRow}
                  horizontalAlignment={column?.horizontalAlignment}
                  textColor={getResolvedValue(column.textColor, { cellValue, rowData })}
                  id={id}
                />
              );

            case 'badge':
            case 'badges':
              return (
                <CustomDropdownColumn
                  options={columnOptions.selectOptions}
                  value={cellValue}
                  onChange={(value) => handleCellValueChange(row.index, column.key || column.name, value, row.original)}
                  readOnly={!isEditable}
                  darkMode={darkMode}
                  multiple={columnType === 'badges'}
                  width={columnSize}
                  isEditable={isEditable}
                />
              );

            case 'radio':
              return (
                <RadioColumn
                  options={columnOptions.selectOptions}
                  value={cellValue}
                  readOnly={!isEditable}
                  onChange={(value) => handleCellValueChange(row.index, column.key || column.name, value, row.original)}
                  containerWidth={columnSize}
                />
              );

            case 'toggle':
              return (
                <ToggleColumn
                  id={id}
                  value={cellValue}
                  readOnly={!isEditable}
                  activeColor={column.activeColor}
                  onChange={(value, tableColumnEvents) => {
                    handleCellValueChange(row.index, column.key || column.name, value, row.original);
                    fireEvent('OnTableToggleCellChanged', {
                      column: column,
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
                  readOnly={!isEditable}
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
                  textColor={getResolvedValue(column.textColor, { cellValue, rowData })}
                  id={id}
                />
              );

            case 'link':
              return (
                <LinkColumn
                  cellValue={cellValue}
                  linkTarget={getResolvedValue(column?.linkTarget, { cellValue, rowData })}
                  textColor={getResolvedValue(column?.linkColor ?? '#1B1F24', { cellValue, rowData })}
                  underlineColor={getResolvedValue(column?.underlineColor, { cellValue, rowData })}
                  underline={column.underline}
                  displayText={getResolvedValue(column?.displayText, { cellValue, rowData })}
                  darkMode={darkMode}
                  id={id}
                />
              );

            case 'image':
              return (
                <ImageColumn
                  cellValue={cellValue}
                  width={column?.width}
                  height={column?.height ? `${column?.height}px` : '100%'}
                  borderRadius={column?.borderRadius}
                  objectFit={column?.objectFit}
                />
              );

            case 'json':
              return (
                <JsonColumn
                  isEditable={isEditable}
                  jsonIndentation={getResolvedValue(column?.jsonIndentation, { cellValue, rowData })}
                  darkMode={darkMode}
                  handleCellValueChange={handleCellValueChange}
                  textColor={getResolvedValue(column.textColor, { cellValue, rowData })}
                  horizontalAlignment={column?.horizontalAlignment}
                  cellValue={cellValue}
                  column={column}
                  containerWidth={columnSize}
                  id={id}
                />
              );

            case 'markdown': {
              return (
                <MarkdownColumn
                  isEditable={isEditable}
                  darkMode={darkMode}
                  handleCellValueChange={handleCellValueChange}
                  horizontalAlignment={column?.horizontalAlignment}
                  textColor={getResolvedValue(column.textColor, { cellValue, rowData })}
                  cellValue={cellValue}
                  column={column}
                  containerWidth={columnSize}
                  cell={cell}
                  id={id}
                />
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
