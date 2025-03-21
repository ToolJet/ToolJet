import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { Tooltip } from 'react-tooltip';
import cx from 'classnames';
import useTableStore from '../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
import generateColumnsData from '../../../_utils/generateColumnsData';

export function AddNewRow({ id, hideAddNewRowPopup, darkMode, allColumns, fireEvent, setExposedVariables }) {
  const columnProperties = useTableStore((state) => state.getColumnProperties(id), shallow);
  const addNewRowDetails = useTableStore((state) => state.getAllAddNewRowDetails(id), shallow);
  const updateAddNewRowDetails = useTableStore((state) => state.updateAddNewRowDetails, shallow);
  const clearAddNewRowDetails = useTableStore((state) => state.clearAddNewRowDetails, shallow);

  const addNewRowDetailsLength = addNewRowDetails.size;

  const newEmptyRow = useMemo(() => {
    return allColumns.reduce((accumulator, column) => {
      const key = column.columnDef.accessorKey;
      if (column.id !== 'selection') accumulator[key] = '';
      return accumulator;
    }, {});
  }, [allColumns]);

  useEffect(() => {
    function discardNewlyAddedRows() {
      clearAddNewRowDetails(id);
      hideAddNewRowPopup();
    }
    setExposedVariables({ discardNewlyAddedRows });
  }, [clearAddNewRowDetails, setExposedVariables, id, hideAddNewRowPopup]);

  useEffect(() => {
    if (addNewRowDetailsLength === 0) {
      updateAddNewRowDetails(id, addNewRowDetailsLength, newEmptyRow);
    }
  }, [addNewRowDetailsLength, id, newEmptyRow, updateAddNewRowDetails]);

  const handleCellValueChange = useCallback(
    (index, name, value, row) => {
      const rowDetails = addNewRowDetails.get(index) ?? row;
      updateAddNewRowDetails(id, index, { ...rowDetails, [name]: value });
    },
    [addNewRowDetails, id, updateAddNewRowDetails]
  );

  const addRowTableRef = useRef();

  const columns = useMemo(
    () =>
      [
        ...generateColumnsData({
          columnProperties: columnProperties.map((column) => ({
            ...column,
            isEditable: true,
          })),
          columnSizes: {},
          defaultColumn: { width: 150 },
          tableData: addNewRowDetailsLength > 0 ? [...addNewRowDetails.values()] : [newEmptyRow],
          id,
          darkMode,
          fireEvent: () => {},
          tableRef: addRowTableRef,
          handleCellValueChange,
          searchText: '',
          columnForAddNewRow: true,
        }).filter(Boolean),
      ].filter(Boolean),
    [id, columnProperties, darkMode, handleCellValueChange, newEmptyRow, addNewRowDetails, addNewRowDetailsLength]
  );

  const table = useReactTable({
    data: [...addNewRowDetails.values()],
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const addNewRow = () => {
    updateAddNewRowDetails(id, addNewRowDetailsLength, newEmptyRow);
  };

  return (
    <div className={`table-add-new-row card ${darkMode && 'dark-theme'}`}>
      <div className="card-header row">
        <div className="col">
          <h4 data-cy={`header-filters`} className="font-weight-500 tj-text-lg">
            Add new rows
          </h4>
        </div>
        <div className="col-auto">
          <button data-cy={`button-close-filters`} onClick={hideAddNewRowPopup} className="btn btn-light btn-sm">
            x
          </button>
        </div>
      </div>
      <div className="table-responsive jet-data-table" ref={addRowTableRef}>
        <table className={`table table-vcenter table-nowrap ${darkMode && 'dark-theme table-dark'}`}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="tr" style={{ display: 'flex' }}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="th" style={{ width: header.column.getSize() }}>
                    <div className="d-flex custom-gap-4 align-items-center thead-editable-icon-header-text-wrapper">
                      <div>
                        <SolidIcon
                          name="editable"
                          width="16px"
                          height="16px"
                          fill={darkMode ? '#4C5155' : '#C1C8CD'}
                          vievBox="0 0 16 16"
                        />
                      </div>
                      <div className="tj-text-xsm header-text">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} style={{ display: 'flex' }} className="table-row">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cx(`table-text-align-${cell.column.columnDef.meta?.horizontalAlignment} td`, {
                      'has-actions':
                        cell.column.columnDef.meta?.position === 'right' ||
                        cell.column.columnDef.meta?.position === 'left',
                      'has-left-actions': cell.column.columnDef.meta?.position === 'left',
                      'has-right-actions': cell.column.columnDef.meta?.position === 'right',
                      'has-text': cell.column.columnDef.meta?.columnType === 'text',
                      'has-dropdown': cell.column.columnDef.meta?.columnType === 'dropdown',
                      'has-multiselect': cell.column.columnDef.meta?.columnType === 'multiselect',
                      'has-datepicker': cell.column.columnDef.meta?.columnType === 'datepicker',
                      'align-items-center flex-column': cell.column.columnDef.meta?.columnType === 'selector',
                      'selector-column':
                        cell.column.columnDef.meta?.columnType === 'selector' && cell.column.id === 'selection',
                      'has-select': ['select', 'newMultiSelect'].includes(cell.column.columnDef.meta?.columnType),
                      isEditable: true,
                    })}
                    style={{ width: cell.column.getSize() }}
                  >
                    <div
                      className={`td-container ${
                        cell.column.columnDef.meta?.columnType === 'image' && 'jet-table-image-column'
                      } ${cell.column.columnDef.meta?.columnType !== 'image' && 'w-100 h-100'}`}
                    >
                      {flexRender(cell.column.columnDef.cell, {
                        ...cell.getContext(),
                        isEditable: true,
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="btn btn-light btn-sm m-2"
          onClick={addNewRow}
          data-tooltip-id="tooltip-for-add-row"
          data-tooltip-content="Add another row"
        >
          +
        </button>
        <Tooltip id="tooltip-for-add-row" className="tooltip" />
      </div>
      <div className="card-footer d-flex custom-gap-4">
        <ButtonSolid
          variant="primary"
          className="tj-text-xsm"
          onClick={async () => {
            await fireEvent('onNewRowsAdded');
            hideAddNewRowPopup();
            clearAddNewRowDetails(id);
          }}
          size="sm"
          customStyles={{ padding: '10px 20px' }}
        >
          <span>Save</span>
        </ButtonSolid>
        <ButtonSolid
          variant="tertiary"
          className="tj-text-xsm"
          onClick={() => {
            hideAddNewRowPopup();
            clearAddNewRowDetails(id);
          }}
          size="sm"
          customStyles={{ padding: '10px 20px' }}
        >
          <span>Discard</span>
        </ButtonSolid>
      </div>
    </div>
  );
}
