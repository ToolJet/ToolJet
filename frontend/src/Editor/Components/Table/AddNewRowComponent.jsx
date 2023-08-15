import React, { useEffect, useState } from 'react';
import { useTable, useBlockLayout } from 'react-table';
import _ from 'lodash';
import { Tooltip } from 'react-tooltip';
import config from 'config';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { AddCircleOutline, CloseOutlined } from '@mui/icons-material';

export function AddNewRowComponent({
  openAddRow,
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
  utilityForNestedNewRow,
}) {
  const getNewRowObject = () => {
    return allColumns.reduce((accumulator, column) => {
      const key = column.key ?? column.exportValue;
      if (column.id !== 'selection') accumulator[key] = '';
      return accumulator;
    }, {});
  };
  const newRow = getNewRowObject();
  const { newRowsChangeSet } = addNewRowsDetails;
  const rowsFromPrevOperationPresent = _.isEmpty(addNewRowsDetails.newRowsDataUpdates) ? false : true;
  const previousRowsData = rowsFromPrevOperationPresent
    ? Object.keys(addNewRowsDetails.newRowsDataUpdates).reduce((accumulator, row) => {
        accumulator[row] = addNewRowsDetails.newRowsDataUpdates[row];
        return accumulator;
      }, [])
    : null;
  const [newRowsState, setNewRowsState] = useState(rowsFromPrevOperationPresent ? previousRowsData : [newRow]);
  const newRowData = useTable(
    {
      columns,
      data: newRowsState,
      defaultColumn,
    },
    useBlockLayout
  );
  useEffect(() => {
    if (!rowsFromPrevOperationPresent) {
      const newRowDataUpdates = newRowsState.reduce((accumulator, row, index) => {
        const nestedData = utilityForNestedNewRow(row);
        accumulator[index] = nestedData;
        return accumulator;
      }, {});
      setExposedVariable('newRows', newRowsState).then(() => {
        mergeToAddNewRowsDetails({ newRowsDataUpdates: newRowDataUpdates });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = newRowData;

  return (
    <>
      {config.UI_LIB === 'mui' && (
        <Dialog
          open={openAddRow}
          onClose={hideAddNewRowPopup}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          container={document.getElementsByClassName('card jet-table')[0]}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="h5"
              color="primary"
            >
              Add new rows
            </Typography>
            <IconButton
              color="primary"
              onClick={hideAddNewRowPopup}
            >
              <CloseOutlined />
            </IconButton>
          </DialogTitle>
          <Divider color="#1a73e8" />
          <DialogContent>
            <TableContainer component={Paper}>
              <Table {...getTableProps()}>
                <TableHead>
                  {headerGroups.map((headerGroup, index) => {
                    return (
                      <TableRow
                        key={index}
                        {...headerGroup.getHeaderGroupProps()}
                      >
                        {headerGroup.headers.map((column, index) => {
                          return (
                            <TableCell
                              key={index}
                              {...column.getHeaderProps()}
                            >
                              <div>{column.render('Header').toUpperCase()}</div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableHead>
                <TableBody {...getTableBodyProps()}>
                  {rows.map((row, index) => {
                    prepareRow(row);
                    return (
                      <TableRow
                        key={index}
                        {...row.getRowProps()}
                      >
                        {row.cells.map((cell, index) => {
                          let cellProps = cell.getCellProps();
                          const isEditable = true;
                          return (
                            <TableCell
                              key={index}
                              {...cellProps}
                            >
                              {cell.render('Cell', { cell, isEditable, newRowsChangeSet })}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <IconButton
              onClick={() => {
                const rowData = _.cloneDeep(newRowsState);
                const index = rowData.length;
                let newRow = getNewRowObject();
                newRow = utilityForNestedNewRow(newRow);
                rowData.push(newRow);
                let newRowDataUpdates = addNewRowsDetails.newRowsDataUpdates;
                newRowDataUpdates[index] = newRow;
                let newRowAddedExposedVar = Object.keys(newRowDataUpdates).reduce((accumulator, row) => {
                  accumulator.push(newRowDataUpdates[row]);
                  return accumulator;
                }, []);
                setExposedVariable('newRows', newRowAddedExposedVar).then(() => {
                  mergeToAddNewRowsDetails({ newRowsDataUpdates: newRowDataUpdates });
                  setNewRowsState(rowData);
                });
              }}
              data-tooltip-id="tooltip-for-add-new-row"
              data-tooltip-content="Add another row"
            >
              <AddCircleOutline />
            </IconButton>
          </DialogContent>
          <DialogActions>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                onEvent('onNewRowsAdded', { component }).then(() => {
                  mergeToAddNewRowsDetails({
                    newRowsDataUpdates: {},
                    newRowsChangeSet: {},
                    addingNewRows: false,
                  });
                  setNewRowsState([]);
                });
              }}
            >
              Save
            </Button>
            <Button
              variant="contained"
              size="small"
              color="error"
              onClick={() => {
                setExposedVariable('newRows', []).then(() => {
                  mergeToAddNewRowsDetails({
                    newRowsDataUpdates: {},
                    newRowsChangeSet: {},
                    addingNewRows: false,
                  });
                  setNewRowsState([]);
                });
              }}
            >
              Discard
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {config.UI_LIB === 'tooljet' && (
        <div className="table-add-new-row card">
          <div className="card-header row">
            <div className="col">
              <h4
                data-cy={`header-filters`}
                className="font-weight-normal"
              >
                Add new rows
              </h4>
            </div>
            <div className="col-auto">
              <button
                data-cy={`button-close-filters`}
                onClick={hideAddNewRowPopup}
                className="btn btn-light btn-sm"
              >
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
                    <tr
                      className="tr"
                      key={index}
                      {...headerGroup.getHeaderGroupProps()}
                    >
                      {headerGroup.headers.map((column, index) => {
                        return (
                          <th
                            key={index}
                            {...column.getHeaderProps()}
                            className="th"
                          >
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
                    <tr
                      key={index}
                      className="table-row"
                      {...row.getRowProps()}
                    >
                      {row.cells.map((cell, index) => {
                        let cellProps = cell.getCellProps();
                        const isEditable = true;
                        return (
                          <td
                            key={index}
                            {...cellProps}
                            style={{ ...cellProps.style }}
                          >
                            <div
                              className={`td-container ${
                                cell.column.columnType === 'image' && 'jet-table-image-column'
                              } ${cell.column.columnType !== 'image' && 'w-100 h-100'}`}
                            >
                              {cell.render('Cell', { cell, isEditable, newRowsChangeSet })}
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
              className="btn btn-light btn-sm m-2"
              onClick={() => {
                const rowData = _.cloneDeep(newRowsState);
                const index = rowData.length;
                let newRow = getNewRowObject();
                newRow = utilityForNestedNewRow(newRow);
                rowData.push(newRow);
                let newRowDataUpdates = addNewRowsDetails.newRowsDataUpdates;
                newRowDataUpdates[index] = newRow;
                let newRowAddedExposedVar = Object.keys(newRowDataUpdates).reduce((accumulator, row) => {
                  accumulator.push(newRowDataUpdates[row]);
                  return accumulator;
                }, []);
                setExposedVariable('newRows', newRowAddedExposedVar).then(() => {
                  mergeToAddNewRowsDetails({ newRowsDataUpdates: newRowDataUpdates });
                  setNewRowsState(rowData);
                });
              }}
              data-tooltip-id="tooltip-for-add-new-row"
              data-tooltip-content="Add another row"
            >
              +
            </button>
            <Tooltip
              id="tooltip-for-add-new-row"
              className="tooltip"
            />
          </div>
          <div className="card-footer">
            <button
              className="btn btn-primary btn-sm mx-2"
              onClick={() => {
                onEvent('onNewRowsAdded', { component }).then(() => {
                  mergeToAddNewRowsDetails({
                    newRowsDataUpdates: {},
                    newRowsChangeSet: {},
                    addingNewRows: false,
                  });
                  setNewRowsState([]);
                });
              }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setExposedVariable('newRows', []).then(() => {
                  mergeToAddNewRowsDetails({
                    newRowsDataUpdates: {},
                    newRowsChangeSet: {},
                    addingNewRows: false,
                  });
                  setNewRowsState([]);
                });
              }}
              className="btn btn-light btn-sm"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </>
  );
}
