import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreVertical, Play, Smile, SquarePen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

// Factory to build columns with optional dependencies (permissions, formatters, handlers)
// deps: { perms?, formatDate?, onPlay?, onEdit? }
export const appsColumns = (deps = {}) => {
  const { perms, formatDate, onPlay, onEdit } = deps;

  const canEdit = perms?.canEdit ?? true;
  const canPlay = perms?.canPlay ?? true;
  const fmtDate = formatDate ?? ((d) => new Date(d).toLocaleDateString());

  return [
    {
      id: 'select',
      colSpan: 1,
      size: 40,
      minSize: 40,
      maxSize: 40,
      header: ({ table }) => (
        <div className="tw-flex tw-items-center tw-justify-center tw-size-10">
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="tw-flex tw-items-center tw-justify-center tw-size-10 tw-relative">
          <div className="tw-opacity-100 group-hover:tw-opacity-0 group-data-[state=selected]:tw-opacity-0 tw-transition-opacity tw-absolute">
            <Smile className="tw-size-4 tw-text-muted-foreground" />
          </div>
          <div className="tw-opacity-0 group-hover:tw-opacity-100 group-data-[state=selected]:tw-opacity-100 tw-transition-opacity tw-z-10">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        return <TableCellViewer item={row.original} className="!tw-h-10" />;
      },
      enableHiding: false,
    },
    {
      accessorKey: 'lastEdited',
      header: () => <div className="tw-w-full tw-text-right">Last edited</div>,
      cell: ({ row }) => {
        return <div className="tw-text-right tw-text-sm tw-text-muted-foreground">{fmtDate(row.original.lastEdited)}</div>;
      },
    },
    {
      accessorKey: 'editedBy',
      header: () => <div className="tw-w-full tw-text-right">Edited by</div>,
      cell: ({ row }) => {
        return <div className="tw-text-right tw-text-sm tw-text-muted-foreground">{row.original.editedBy}</div>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="group-hover:tw-opacity-100 tw-opacity-0 has-[button[data-state=open]]:tw-opacity-100 tw-flex tw-items-center tw-justify-end tw-gap-2 tw-transition-opacity">
          <Button variant="ghost" size="medium" disabled={!canPlay} onClick={() => onPlay?.(row.original)}>
            <Play className="tw-size-4 tw-text-icon-strong" />
            Play
          </Button>
          <Button variant="secondary" size="medium" disabled={!canEdit} onClick={() => onEdit?.(row.original)}>
            <SquarePen className="tw-size-4 tw-text-icon-accent" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:tw-bg-muted tw-text-muted-foreground tw-flex tw-size-6"
                size="medium"
                iconOnly
              >
                <MoreVertical className="tw-text-icon-strong" />
                <span className="tw-sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="tw-w-32">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Make a copy</DropdownMenuItem>
              <DropdownMenuItem>Favorite</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
};

export default appsColumns;


