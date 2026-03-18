import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import { MoreVertical, Settings, PencilRuler, Copy, Shield, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/Rocket/dropdown-menu';

export const createDatasourcesActionsColumn = (deps = {}) => {
  const { perms, actions = {}, canDelete } = deps;

  const canEdit = (row) => perms?.canEdit?.(row.original) ?? true;

  return {
    id: 'actions',
    size: 200,
    cell: ({ row }) => (
      <div className="group-hover:tw-opacity-100 tw-opacity-0 has-[button[data-state=open]]:tw-opacity-100 tw-flex tw-items-center tw-justify-end tw-gap-2 tw-transition-opacity">
        <Button variant="secondary" size="medium" disabled={!canEdit(row)} onClick={() => actions.configure?.(row.original)}>
          <Settings className="tw-size-4 tw-text-icon-accent" />
          Configure
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
            <DropdownMenuItem onClick={() => actions.rename?.(row.original)} disabled={!canEdit(row)}>
              <PencilRuler className="tw-text-icon-strong" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.duplicate?.(row.original)} disabled={!canEdit(row)}>
              <Copy className="tw-text-icon-strong" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.managePermissions?.(row.original)} disabled={!canEdit(row)}>
              <Shield className="tw-text-icon-strong" />
              Permission
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
