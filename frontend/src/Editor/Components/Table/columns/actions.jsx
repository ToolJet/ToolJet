import React from 'react';
import { resolveReferences } from '@/_helpers/utils';

const generateActionsData = ({ actions, columnSizes, defaultColumn, fireEvent, setExposedVariables, currentState }) => {
  const leftActions = () => actions.filter((action) => action.position === 'left');
  const rightActions = () => actions.filter((action) => [undefined, 'right'].includes(action.position));

  const leftActionsCellData =
    leftActions().length > 0
      ? [
          {
            id: 'leftActions',
            Header: 'Actions',
            accessor: 'edit',
            width: columnSizes.leftActions || defaultColumn.width,
            Cell: (cell) => {
              return leftActions().map((action) => (
                <button
                  key={action.name}
                  className="btn btn-sm m-1 btn-light"
                  style={{
                    background: action.backgroundColor,
                    color: action.textColor,
                    borderRadius: action.actionButtonRadius,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExposedVariables({
                      selectedRowId: cell.row.id,
                      selectedRow: cell.row.original,
                    }).then(() => {
                      fireEvent('onTableActionButtonClicked', {
                        data: cell.row.original,
                        rowId: cell.row.id,
                        action,
                      });
                    });
                  }}
                  disabled={resolveReferences(action?.disableActionButton ?? false, currentState)}
                >
                  {action.buttonText}
                </button>
              ));
            },
          },
        ]
      : [];

  const rightActionsCellData =
    rightActions().length > 0
      ? [
          {
            id: 'rightActions',
            Header: 'Actions',
            accessor: 'edit',
            width: columnSizes.rightActions || defaultColumn.width,
            Cell: (cell) => {
              return rightActions().map((action) => (
                <button
                  key={action.name}
                  className="btn btn-sm m-1 btn-light"
                  style={{
                    background: action.backgroundColor,
                    color: action.textColor,
                    borderRadius: action.actionButtonRadius,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExposedVariables({
                      selectedRowId: cell.row.id,
                      selectedRow: cell.row.original,
                    }).then(() => {
                      fireEvent('onTableActionButtonClicked', {
                        data: cell.row.original,
                        rowId: cell.row.id,
                        action,
                      });
                    });
                  }}
                  disabled={resolveReferences(action?.disableActionButton ?? false, currentState)}
                >
                  {action.buttonText}
                </button>
              ));
            },
          },
        ]
      : [];

  return [leftActionsCellData, rightActionsCellData];
};

export default generateActionsData;
