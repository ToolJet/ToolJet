import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import { MoreVertical, Play, SquarePen, AppWindow, PencilRuler, Copy, FolderInput, FileUp, Trash } from 'lucide-react';
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
    size: 200,
    cell: ({ row }) => (
      <div className="group-hover:tw-opacity-100 tw-opacity-0 has-[button[data-state=open]]:tw-opacity-100 tw-flex tw-items-center tw-justify-end tw-gap-2 tw-transition-opacity">
        <Button variant="ghost" size="medium" disabled={!canPlay(row)} onClick={() => actions.play?.(row.original)}>
          <Play className="tw-size-4 tw-text-icon-strong" />
          Launch
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
          <DropdownMenuContent align="end" className="tw-w-40">
            <DropdownMenuItem onClick={() => actions.rename?.(row.original)} disabled={!canEdit(row)}>
              <AppWindow className="tw-text-icon-strong" />
              Rename app
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.customizeIcon?.(row.original)} disabled={!canEdit(row)}>
              <PencilRuler className="tw-text-icon-strong" /> Customize icon
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.clone?.(row.original)} disabled={!canEdit(row)}>
              <Copy className="tw-text-icon-strong" /> Duplicate app
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.moveToFolder?.(row.original)} disabled={!canEdit(row)}>
              <FolderInput className="tw-text-icon-strong" /> Move to folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.export?.(row.original)} disabled={!canEdit(row)}>
              <FileUp className="tw-text-icon-strong" /> Export app
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
