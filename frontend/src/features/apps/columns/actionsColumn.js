import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import { MoreVertical, Play, SquarePen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/Rocket/dropdown-menu';

export const createActionsColumn = (deps = {}) => {
  const { perms, actions = {}, canDelete } = deps;

  const canEdit = (row) => perms?.canEdit?.(row.original) ?? true;
  const canPlay = (row) => perms?.canPlay?.(row.original) ?? true;

  return {
    id: 'actions',
    cell: ({ row }) => (
      <div className="group-hover:tw-opacity-100 tw-opacity-0 has-[button[data-state=open]]:tw-opacity-100 tw-flex tw-items-center tw-justify-end tw-gap-2 tw-transition-opacity">
        <Button variant="ghost" size="medium" disabled={!canPlay(row)} onClick={() => actions.play?.(row.original)}>
          <Play className="tw-size-4 tw-text-icon-strong" />
          Play
        </Button>
        <Button variant="secondary" size="medium" disabled={!canEdit(row)} onClick={() => actions.edit?.(row.original)}>
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
            <DropdownMenuItem onClick={() => actions.edit?.(row.original)} disabled={!canEdit(row)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.clone?.(row.original)}>Make a copy</DropdownMenuItem>
            {actions.export && (
              <DropdownMenuItem onClick={() => actions.export?.(row.original)}>Export</DropdownMenuItem>
            )}
            <DropdownMenuItem>Favorite</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => actions.delete?.(row.original)}
              disabled={canDelete && !canDelete(row.original)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  };
};
