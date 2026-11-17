import React, { useState } from 'react';
import { Menu, PanelLeftOpen, Plus, Table } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { ClosableTabs } from '@/components/ui/Rocket/ClosableTabs/ClosableTabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Rocket/Popover/Popover';
import { SCHEMA_ENV_TOOLTIP } from '../constants';
import CreateTableDrawer from '../Drawers/CreateTableDrawer';
import { useTooljetDatabaseContext, type TjdbTable } from '../TooljetDatabaseContext';
import { OpenTabsList, TAB_STRIP_POPOVER_CLASS, TablePicker } from './TabStripPopovers';

export interface TableTabStripProps {
  /** While the tables panel is hidden, the strip carries the button that brings it back. */
  panelCollapsed: boolean;
  onExpandPanel: () => void;
}

function Divider() {
  return (
    <div aria-hidden className="tw-flex tw-shrink-0 tw-items-center tw-px-1">
      <div className="tw-h-5 tw-w-px tw-bg-border-weak" />
    </div>
  );
}

// The open tables as tabs, above the grid: [expand panel] [tabs] | [open or create] ... [open tabs menu].
export function TableTabStrip({ panelCollapsed, onExpandPanel }: TableTabStripProps) {
  const {
    tables,
    openTabIds,
    selectedTable,
    openTable,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    canEditTjdb,
    canEditSchema,
    tablesLimitReached,
  } = useTooljetDatabaseContext();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tabsMenuOpen, setTabsMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const known = tables as TjdbTable[];
  const openTables = openTabIds
    .map((id) => known.find((table) => table.id === id))
    .filter((table): table is TjdbTable => table !== undefined);

  const pick = (close: () => void) => (table: TjdbTable) => {
    openTable(table);
    close();
  };

  return (
    <div
      className="tw-flex tw-h-12 tw-shrink-0 tw-items-center tw-gap-1 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-bg-page-weak tw-pl-2 tw-pr-4"
      data-cy="table-tab-strip"
    >
      {panelCollapsed && (
        <div className="tw-flex tw-shrink-0 tw-items-center tw-pr-2">
          <Button
            variant="ghost"
            size="medium"
            iconOnly
            aria-label="Expand tables panel"
            data-cy="expand-tables-panel"
            onClick={onExpandPanel}
          >
            <PanelLeftOpen />
          </Button>
        </div>
      )}
      <ClosableTabs
        aria-label="Open tables"
        tabs={openTables.map((table) => ({
          id: table.id,
          label: table.table_name,
          icon: <Table />,
          'data-cy': `${table.table_name}-tab`,
        }))}
        activeId={selectedTable.id ?? null}
        onSelect={(id) => {
          const table = openTables.find((candidate) => candidate.id === id);
          if (table) openTable(table);
        }}
        onClose={closeTab}
      />
      <Divider />
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="medium"
            iconOnly
            aria-label="Open or create a table"
            data-cy="open-or-create-table-button"
            className="tw-shrink-0 data-[state=open]:tw-bg-interactive-selected"
          >
            <Plus />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className={TAB_STRIP_POPOVER_CLASS}>
          <TablePicker
            tables={known}
            selectedId={selectedTable.id}
            onPick={pick(() => setPickerOpen(false))}
            createDisabled={!canEditSchema || tablesLimitReached}
            createTooltip={canEditTjdb && !canEditSchema ? SCHEMA_ENV_TOOLTIP : undefined}
            onCreate={() => {
              setPickerOpen(false);
              setCreateOpen(true);
            }}
          />
        </PopoverContent>
      </Popover>
      <div className="tw-min-w-0 tw-flex-1" />
      <Popover open={tabsMenuOpen} onOpenChange={setTabsMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="medium"
            iconOnly
            aria-label="Open tabs and tab actions"
            data-cy="open-tabs-menu-button"
            disabled={openTables.length === 0}
            className="tw-shrink-0 data-[state=open]:tw-bg-interactive-selected"
          >
            <Menu />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className={TAB_STRIP_POPOVER_CLASS}>
          <OpenTabsList
            tabs={openTables}
            activeId={selectedTable.id}
            onPick={pick(() => setTabsMenuOpen(false))}
            onCloseOthers={() => {
              if (selectedTable.id) closeOtherTabs(selectedTable.id);
              setTabsMenuOpen(false);
            }}
            onCloseAll={() => {
              closeAllTabs();
              setTabsMenuOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <CreateTableDrawer isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
