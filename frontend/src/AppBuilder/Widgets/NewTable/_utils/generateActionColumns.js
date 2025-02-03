import React from 'react';
import { ActionButtons } from '../_components/ActionButtons/ActionButtons';

export const generateActionColumns = ({ actions, fireEvent, setExposedVariables, tableActionEvents }) => {
  const leftActions = actions?.filter((action) => action.position === 'left') || [];
  const rightActions = actions?.filter((action) => [undefined, 'right'].includes(action.position)) || [];

  const createActionColumn = (position) => ({
    id: `${position}Actions`,
    accessorKey: 'actions',
    meta: { columnType: 'action', position, skipFilter: true, skipAddNewRow: true },
    size: 150,
    header: 'Actions',
    cell: ({ row }) => (
      <ActionButtons
        actions={position === 'left' ? leftActions : rightActions}
        row={row}
        fireEvent={fireEvent}
        setExposedVariables={setExposedVariables}
        tableActionEvents={tableActionEvents}
      />
    ),
  });

  const columns = [];
  if (leftActions.length > 0) columns.push(createActionColumn('left'));
  if (rightActions.length > 0) columns.push(createActionColumn('right'));

  return columns;
};
