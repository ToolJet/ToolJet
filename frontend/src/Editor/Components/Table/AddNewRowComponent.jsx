import React, { useEffect, useState } from 'react';
import { useTable, useBlockLayout } from 'react-table';
import _ from 'lodash';

export function AddNewRowComponent({
  hideAddNewRowPopup,
  tableType,
  darkMode,
  mergeToAddNewRowsDetails,
  onEvent,
  component,
  setExposedVariable,
  allColumns,
  defaultColumn,
  columns,
  addNewRowsDetails,
}) {
  const getNewRowObject = () =>
    allColumns.reduce((accumulator, column) => {
      const key = column.key ?? column.exportValue;
      accumulator[key] = '';
      return accumulator;
    }, {});
  const newRow = getNewRowObject();
  const existingAddedNewRows = _.isEmpty(addNewRowsDetails.newRowsDataUpdates)
    ? { status: false, data: null }
    : {
        status: true,
        data: Object.keys(addNewRowsDetails.newRowsDataUpdates).reduce((accumulator, row) => {
          accumulator[row] = addNewRowsDetails.newRowsDataUpdates[row];
          return accumulator;
        }, []),
      };
  const [newRowsState, setNewRowsState] = useState(existingAddedNewRows.status ? existingAddedNewRows.data : [newRow]);
  const newRowData = useTable(
    {
      columns,
      data: newRowsState,
      defaultColumn,
    },
    useBlockLayout
  );
  useEffect(() => {
    if (!existingAddedNewRows.status) {
      const newRowDataUpdates = newRowsState.reduce((accumulator, row, index) => {
        accumulator[index] = newRowsState[index];
        return accumulator;
      }, {});
      setExposedVariable('newRowsAdded', newRowsState).then(() => {
        mergeToAddNewRowsDetails({ newRowsDataUpdates: newRowDataUpdates });
      });
    }
  }, []);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = newRowData;

  return (
    <div className="table-add-new-row card">
      <div className="card-header row">
        <div className="col">
          <h4 data-cy={`header-filters`} className="font-weight-normal">
            Add new rows
          </h4>
        </div>
        <div className="col-auto">
          <button data-cy={`button-close-filters`} onClick={hideAddNewRowPopup} className="btn btn-light btn-sm">
            x
          </button>
        </div>
      </div>
      <div className="table-responsive jet-data-table">
        <table
          {...getTableProps()}
          className={`table table-vcenter table-nowrap ${tableType} ${darkMode && 'table-dark'}`}
        >
          <thead>
            {headerGroups.map((headerGroup, index) => {
              return (
                <tr className="tr" key={index} {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column, index) => {
                    return (
                      <th key={index} {...column.getHeaderProps()} className="th">
                        <div>{column.render('Header')}</div>
                      </th>
                    );
                  })}
                </tr>
              );
            })}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row, index) => {
              prepareRow(row);
              return (
                <tr key={index} className="table-row" {...row.getRowProps()}>
                  {row.cells.map((cell, index) => {
                    let cellProps = cell.getCellProps();
                    const isEditable = true;
                    return (
                      <td key={index} {...cellProps} style={{ ...cellProps.style }}>
                        <div
                          className={`td-container ${cell.column.columnType === 'image' && 'jet-table-image-column'} ${
                            cell.column.columnType !== 'image' && 'w-100 h-100'
                          }`}
                        >
                          {cell.render('Cell', { cell, isEditable })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <button
          className="btn btn-primary btn-sm my-2"
          onClick={() => {
            const rowData = _.cloneDeep(newRowsState);
            const index = rowData.length;
            const newRow = getNewRowObject();
            rowData.push(newRow);
            let newRowDataUpdates = addNewRowsDetails.newRowsDataUpdates;
            newRowDataUpdates[index] = newRow;
            let newRowAddedExposedVar = Object.keys(newRowDataUpdates).reduce((accumulator, row) => {
              accumulator.push(newRowDataUpdates[row]);
              return accumulator;
            }, []);
            setExposedVariable('newRowsAdded', newRowAddedExposedVar).then(() => {
              mergeToAddNewRowsDetails({ newRowsDataUpdates: newRowDataUpdates });
              setNewRowsState(rowData);
            });
          }}
        >
          + add another row
        </button>
      </div>
      <div className="card-footer">
        <button
          className="btn btn-primary btn-sm mx-2"
          onClick={() => {
            onEvent('onNewRowsAdded', { component }).then(() => {
              setExposedVariable('newRowsAdded', []).then(() => {
                mergeToAddNewRowsDetails({ newRowsDataUpdates: {}, newRowsChangeSet: {}, addingNewRows: false });
                setNewRowsState([]);
              });
            });
          }}
        >
          Finish adding rows
        </button>
        <button
          onClick={() => {
            setExposedVariable('newRowsAdded', []).then(() => {
              mergeToAddNewRowsDetails({ newRowsDataUpdates: {}, newRowsChangeSet: {}, addingNewRows: false });
              setNewRowsState([]);
            });
          }}
          className="btn btn-light btn-sm"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
