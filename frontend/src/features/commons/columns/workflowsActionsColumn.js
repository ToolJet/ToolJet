import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import { MoreVertical, Play, Edit, Copy, PencilRuler, History, Settings, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/Rocket/dropdown-menu';

export const createWorkflowsActionsColumn = (deps = {}) => {
  const { perms, actions = {}, canDelete } = deps;

  const canEdit = (row) => perms?.canEdit?.(row.original) ?? true;
  const canRun = (row) => {
    const status = row.original?.status || row.status;
    return status === 'active' && canEdit(row);
  };

  return {
    id: 'actions',
    size: 200,
    cell: ({ row }) => (
      <div className="group-hover:tw-opacity-100 tw-opacity-0 has-[button[data-state=open]]:tw-opacity-100 tw-flex tw-items-center tw-justify-end tw-gap-2 tw-transition-opacity">
        <Button variant="secondary" size="medium" disabled={!canRun(row)} onClick={() => actions.run?.(row.original)}>
          <Play className="tw-size-4 tw-text-icon-accent" />
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
          <DropdownMenuContent align="end" className="tw-w-48">
            <DropdownMenuItem onClick={() => actions.edit?.(row.original)} disabled={!canEdit(row)}>
              <Edit className="tw-text-icon-strong" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.duplicate?.(row.original)} disabled={!canEdit(row)}>
              <Copy className="tw-text-icon-strong" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.rename?.(row.original)} disabled={!canEdit(row)}>
              <PencilRuler className="tw-text-icon-strong" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => actions.viewHistory?.(row.original)} disabled={!canEdit(row)}>
              <History className="tw-text-icon-strong" />
              View History
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.settings?.(row.original)} disabled={!canEdit(row)}>
              <Settings className="tw-text-icon-strong" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => actions.delete?.(row.original)}
              disabled={canDelete && !canDelete(row.original)}
            >
              <Trash className="tw-text-icon-strong" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  };
};
