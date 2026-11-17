import React, { useState } from 'react';
import { PanelLeftClose, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { SearchInput } from '@/components/ui/Rocket/SearchInput/SearchInput';
import { Skeleton } from '@/components/ui/Rocket/Skeleton/Skeleton';
import {
  SidePanel,
  SidePanelBody,
  SidePanelHeader,
  SidePanelSection,
} from '@/components/ui/Rocket/SidePanel/SidePanel';
import Tooltip from '@/components/ui/Rocket/Tooltip';
import { authenticationService } from '@/_services/authentication.service';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
import { SCHEMA_ENV_TOOLTIP } from '../constants';
import CreateTableDrawer from '../Drawers/CreateTableDrawer';
import { useTooljetDatabaseContext } from '../TooljetDatabaseContext';
import { TableRow } from './TableRow';
import { useTableActions } from './TableActionsHost';
import { useTables } from './useTables';

export interface TablesPanelProps {
  /** Hides the panel. Showing it again is the page's job. */
  onCollapse: () => void;
}

// The left panel of the database page: lists the workspace's tables, searches them, creates one, and carries each
// table's row menu.
export function TablesPanel({ onCollapse }: TablesPanelProps) {
  const { selectedTable, openTable, canEditTjdb, canEditSchema, tablesLimitReached } = useTooljetDatabaseContext();
  const { tables, loading, refetch } = useTables();
  // After a delete the open tabs drop the deleted table on their own.
  const { run, host } = useTableActions({ refetchTables: refetch });
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const needle = query.trim().toLowerCase();
  const visible = needle ? tables.filter((table) => table.table_name.toLowerCase().includes(needle)) : tables;
  // Only an environment block explains itself; a missing permission is a different reason.
  const createTooltip = canEditTjdb && !canEditSchema ? SCHEMA_ENV_TOOLTIP : undefined;

  const handleCreate = () => {
    // `currentUserValue` is a getter the service's inferred type does not list.
    const { currentUserValue } = authenticationService as { currentUserValue?: { organization_id?: string } };
    posthogHelper?.captureEvent('click_add_tooljet_table_button', {
      workspace_id:
        currentUserValue?.organization_id || authenticationService?.currentSessionValue?.current_organization_id,
      datasource: 'tooljet_db',
    });
    setCreateOpen(true);
  };

  return (
    <SidePanel aria-label="Tables" data-cy="all-table-column">
      <SidePanelHeader
        title="Database"
        actions={
          <>
            <Tooltip content={createTooltip} isTooltipForInteractiveDisabledElement>
              <Button
                variant="ghost"
                size="medium"
                iconOnly
                aria-label="Create new table"
                data-cy="add-table-button"
                disabled={!canEditSchema || tablesLimitReached}
                onClick={handleCreate}
              >
                <Plus />
              </Button>
            </Tooltip>
            <Button
              variant="ghost"
              size="medium"
              iconOnly
              aria-label="Collapse tables panel"
              data-cy="collapse-tables-panel"
              onClick={onCollapse}
            >
              <PanelLeftClose />
            </Button>
          </>
        }
      />
      <SidePanelSection label="All tables" count={visible.length} data-cy="all-tables-subheader" />
      <div className="tw-px-3">
        <SearchInput
          aria-label="Search tables"
          placeholder="Search tables"
          value={query}
          onValueChange={setQuery}
          data-cy="tables-search-bar"
        />
      </div>
      <SidePanelBody>
        {loading && tables.length === 0 && (
          <>
            <Skeleton className="tw-h-8 tw-w-full" />
            <Skeleton className="tw-h-8 tw-w-full" />
            <Skeleton className="tw-h-8 tw-w-full" />
          </>
        )}
        {visible.map((table) => (
          <TableRow
            key={table.id}
            table={table}
            selected={table.id === selectedTable.id}
            onSelect={openTable}
            onAction={run}
            canEditTjdb={canEditTjdb}
            canEditSchema={canEditSchema}
          />
        ))}
        {needle && visible.length === 0 && (
          <p className="tw-m-0 tw-px-2 tw-py-1.5 tw-font-body-default tw-text-text-placeholder">
            {`No tables match "${query.trim()}"`}
          </p>
        )}
      </SidePanelBody>
      <CreateTableDrawer isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      {host}
    </SidePanel>
  );
}
