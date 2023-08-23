import React, { useEffect, useState } from 'react';
import { useTable, useBlockLayout } from 'react-table';
import _ from 'lodash';
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
  Tooltip,
  Typography,
} from '@mui/material';
import { AddCircleOutline, CloseOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  return (
    <Dialog
      open={openAddRow}
      onClose={hideAddNewRowPopup}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      container={document.getElementsByClassName('card jet-table')[0]}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="h5"
          color="primary"
        >
          {t('widget.Table.addRow', 'Add new row')}
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
            <TableHead sx={{ backgroundColor: '#E7E7E7' }}>
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
        <Tooltip title={t('widget.Table.addAnotherRow', 'Add another row')}>
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
        </Tooltip>
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
          {t('globals.save', 'Save')}
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
          {t('widget.Table.discard', 'Discard')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
