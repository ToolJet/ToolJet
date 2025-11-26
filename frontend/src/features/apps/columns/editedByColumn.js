import React from 'react';

export const createEditedByColumn = () => {
  return {
    accessorKey: 'editedBy',
    header: () => <div className="tw-w-full tw-text-right">Edited by</div>,
    cell: ({ row }) => {
      return <div className="tw-text-right tw-text-sm tw-text-muted-foreground">{row.original.editedBy}</div>;
    },
  };
};
