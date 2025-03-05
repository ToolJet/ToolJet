import React from 'react';
import { ActionButtons } from '../_components/ActionButtons/ActionButtons';

export const generateActionColumns = ({ actions, fireEvent, setExposedVariables, id }) => {
  const leftActions = actions?.filter((action) => action.position === 'left') || [];
  const rightActions = actions?.filter((action) => [undefined, 'right'].includes(action.position)) || [];

  const createActionColumn = (position) => ({
    id: `${position}Actions`,
    accessorKey: 'actions',
    enableResizing: false,
    meta: { columnType: 'action', position, skipFilter: true },
    size: 90,
    header: 'Actions',
    cell: ({ row, cell }) => (
      <ActionButtons
        actions={position === 'left' ? leftActions : rightActions}
        row={row}
        cell={cell}
        fireEvent={fireEvent}
        setExposedVariables={setExposedVariables}
        id={id}
      />
    ),
  });

  const columns = [];
  if (leftActions.length > 0) columns.push(createActionColumn('left'));
  if (rightActions.length > 0) columns.push(createActionColumn('right'));

  return columns;
};
