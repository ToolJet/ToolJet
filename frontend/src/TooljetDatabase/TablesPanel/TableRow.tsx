import React from 'react';
import { Columns3, EllipsisVertical, FileDown, FileSpreadsheet, SquarePen, Table2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Rocket/Button/Button';
import DropdownMenu, { type DropdownMenuItem, type DropdownMenuSection } from '@/components/ui/Rocket/DropdownMenu';
import Tooltip from '@/components/ui/Rocket/Tooltip';
import { TruncatingText } from '@/components/ui/Rocket/TruncatingText/TruncatingText';
import { SCHEMA_ENV_TOOLTIP } from '../constants';
import type { TjdbTable } from '../TooljetDatabaseContext';
import { MigrationSyncDot } from './MigrationSyncDot';

export type TableRowAction = 'edit' | 'addColumn' | 'exportSchema' | 'exportCsv' | 'delete';

export interface TableRowProps {
  table: TjdbTable;
  selected: boolean;
  onSelect: (table: TjdbTable) => void;
  onAction: (action: TableRowAction, table: TjdbTable) => void;
  canEditTjdb: boolean;
  canEditSchema: boolean;
}

// Figma menu: 8px of padding round 32px rows, 180px wide. The group's 4px plus the content's 4px make the 8px.
const MENU_CLASSES = { content: 'tw-w-[196px] tw-py-1', group: 'tw-px-2 tw-py-1' };

export function TableRow({ table, selected, onSelect, onAction, canEditTjdb, canEditSchema }: TableRowProps) {
  const slug = String(table.table_name).toLowerCase().replace(/\s+/g, '-');
  // A schema action is blocked either for lack of the TJDB permission (no tooltip) or because the user is not on
  // Development (tooltip). Only the environment block explains itself.
  const blockedByEnvironment = canEditTjdb && !canEditSchema;

  const schemaItem = (item: Omit<DropdownMenuItem, 'disabled' | 'wrapper'>): DropdownMenuItem => ({
    ...item,
    disabled: !canEditSchema,
    // A disabled row swallows pointer events, so the tooltip sits on a wrapper.
    wrapper: blockedByEnvironment
      ? (element) => (
          <Tooltip content={SCHEMA_ENV_TOOLTIP}>
            <div>{element}</div>
          </Tooltip>
        )
      : undefined,
  });

  const sections: DropdownMenuSection[] = [
    {
      id: 'table',
      items: [
        schemaItem({
          id: 'edit',
          label: 'Edit table',
          icon: <SquarePen />,
          onSelect: () => onAction('edit', table),
          'data-cy': 'rename-table-option',
        }),
        schemaItem({
          id: 'addColumn',
          label: 'Add new column',
          icon: <Columns3 />,
          onSelect: () => onAction('addColumn', table),
          'data-cy': 'add-new-column-option',
        }),
        {
          id: 'exportSchema',
          label: 'Export schema',
          icon: <FileDown />,
          onSelect: () => onAction('exportSchema', table),
          'data-cy': 'export-schema-option',
        },
        {
          id: 'exportCsv',
          label: 'Export data as CSV',
          icon: <FileSpreadsheet />,
          onSelect: () => onAction('exportCsv', table),
          'data-cy': 'export-csv-option',
        },
      ],
    },
    {
      id: 'danger',
      items: [
        schemaItem({
          id: 'delete',
          label: 'Delete table',
          icon: <Trash2 />,
          destructive: true,
          onSelect: () => onAction('delete', table),
          'data-cy': 'delete-table-option',
        }),
      ],
    },
  ];

  return (
    // The whole row opens the table. The inner button is what keyboard and screen reader users reach.
    <div
      data-cy={`${slug}-table`}
      // The menu is portalled, but React still bubbles its clicks to this row. Only clicks inside the row open the table.
      onClick={(event) => event.currentTarget.contains(event.target as Node) && onSelect(table)}
      className={cn(
        'tw-group tw-flex tw-h-8 tw-shrink-0 tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-md tw-py-[7px] tw-pl-2',
        // The "…" takes 2px from the row's edge while it shows, and the label gives up that room (Figma list item).
        selected
          ? 'tw-bg-interactive-selected tw-pr-0.5'
          : 'tw-pr-2 hover:tw-bg-interactive-hover hover:tw-pr-0.5 focus-within:tw-pr-0.5 has-[[data-state=open]]:tw-pr-0.5'
      )}
    >
      <button
        type="button"
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'tw-flex tw-min-w-0 tw-flex-1 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-sm tw-border-0',
          'tw-bg-transparent tw-p-0 tw-text-left tw-font-body-default tw-text-text-default',
          'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline'
        )}
      >
        <Table2 aria-hidden className="tw-size-4 tw-shrink-0 tw-text-icon-default" />
        <TruncatingText text={table.table_name} data-cy={`${slug}-table-name`} />
      </button>
      <MigrationSyncDot sync={table.migration_sync} />
      <DropdownMenu
        side="bottom"
        align="start"
        classes={MENU_CLASSES}
        sections={sections}
        trigger={
          <Button
            variant="ghost"
            size="small"
            iconOnly
            aria-label={`${table.table_name} actions`}
            data-cy="table-kebab-icon"
            // Opening a menu must not open the table: the menu works on this row, whatever table is open.
            onClick={(event) => event.stopPropagation()}
            className={cn(
              'tw-shrink-0',
              // Not rendered (so no room reserved) until the row is hovered, focused or its menu is open.
              !selected &&
                'tw-hidden group-hover:tw-inline-flex group-focus-within:tw-inline-flex data-[state=open]:tw-inline-flex'
            )}
          >
            <EllipsisVertical />
          </Button>
        }
      />
    </div>
  );
}
