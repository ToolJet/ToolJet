import React from 'react';

export const createLastEditedColumn = (deps = {}) => {
  const { formatDate } = deps;
  const fmtDate = formatDate ?? ((d) => new Date(d).toLocaleDateString());

  return {
    accessorKey: 'lastEdited',
    header: () => <div className="tw-w-full tw-text-right">Last edited</div>,
    size: 256,
    cell: ({ row }) => {
      return (
        <div className="tw-text-right tw-text-sm tw-text-muted-foreground">{fmtDate(row.original.lastEdited)}</div>
      );
    },
  };
};
