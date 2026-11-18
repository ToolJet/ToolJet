import React, { useState, type ReactElement } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Rocket/Popover/Popover';
import { SCHEMA_ENV_TOOLTIP } from '../constants';
import CreateTableDrawer from '../Drawers/CreateTableDrawer';
import { useTooljetDatabaseContext, type TjdbTable } from '../TooljetDatabaseContext';
import { TAB_STRIP_POPOVER_CLASS, TablePicker } from './TabStripPopovers';

export interface TablePickerPopoverProps {
  /** The button that opens the picker. It takes the open state through `data-state`. */
  trigger: ReactElement;
}

// Open an existing table, or create one: the picker popover and the create-table drawer it leads to. Shared by the
// tab strip's plus button and the "Open a table" button of the empty page.
export function TablePickerPopover({ trigger }: TablePickerPopoverProps) {
  const { tables, selectedTable, openTable, canEditTjdb, canEditSchema, tablesLimitReached } =
    useTooljetDatabaseContext();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent align="start" className={TAB_STRIP_POPOVER_CLASS}>
          <TablePicker
            tables={tables as TjdbTable[]}
            selectedId={selectedTable.id}
            onPick={(table) => {
              openTable(table);
              setPickerOpen(false);
            }}
            createDisabled={!canEditSchema || tablesLimitReached}
            createTooltip={canEditTjdb && !canEditSchema ? SCHEMA_ENV_TOOLTIP : undefined}
            onCreate={() => {
              setPickerOpen(false);
              setCreateOpen(true);
            }}
          />
        </PopoverContent>
      </Popover>
      <CreateTableDrawer isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
