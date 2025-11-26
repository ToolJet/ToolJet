import React from 'react';
import { Button } from '@/components/ui/Button/Button';

function TableCellViewer({ item }) {
  return (
    <Button
      variant="link"
      className="tw-text-foreground tw-w-fit tw-px-0 tw-text-left tw-py-0 tw-h-6 tw-text-lg tw-font-normal"
    >
      {item.name}
    </Button>
  );
}

export const createNameColumn = () => {
  return {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} className="!tw-h-10" />;
    },
    enableHiding: false,
  };
};
