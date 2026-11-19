import React, { useState } from 'react';
import cx from 'classnames';
import Table from '../Table';
import { Plus as PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { EmptyAndNoResultsState } from '@/components/ui/Rocket/EmptyAndNoResultsState/EmptyAndNoResultsState';
import { Spinner } from '@/components/ui/Rocket/Spinner/Spinner';
import { TablesPanel } from '../TablesPanel/TablesPanel';
import { TableTabStrip } from '../TablesPanel/TableTabStrip';
import { TablePickerPopover } from '../TablesPanel/TablePickerPopover';
import CreateTableDrawer from '../Drawers/CreateTableDrawer';
import { useTooljetDatabaseContext } from '../TooljetDatabaseContext';
import { isEmpty } from 'lodash';

// The page header (48px) and tab strip (48px) sit above; the state is centred in what is left.
const CENTERED_BELOW_STRIP = 'tw-flex tw-h-[calc(100vh-96px)] tw-items-center tw-justify-center';

// No tables in the workspace yet.
const NoTablesState = ({ canEditSchema }) => {
  const [isCreateTableDrawerOpen, setIsCreateTableDrawerOpen] = useState(false);
  return (
    <>
      <div className={CENTERED_BELOW_STRIP}>
        <EmptyAndNoResultsState
          variant="no-table-open"
          title="You don't have any tables yet."
          description="Create a table to get started!"
          action={
            <Button
              variant="secondary"
              size="medium"
              leadingVisual={<PlusIcon />}
              disabled={!canEditSchema}
              onClick={() => setIsCreateTableDrawerOpen(true)}
              data-cy="create-new-table-button"
            >
              Create new table
            </Button>
          }
          data-cy="do-not-have-records-text"
        />
      </div>
      <CreateTableDrawer isOpen={isCreateTableDrawerOpen} onClose={() => setIsCreateTableDrawerOpen(false)} />
    </>
  );
};

const TooljetDatabasePage = ({ totalTables }) => {
  const { selectedTable, loadingState, canEditSchema } = useTooljetDatabaseContext();
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  return (
    <div className="tw-flex tw-h-[calc(100vh-48px)]">
      {!isPanelCollapsed && <TablesPanel onCollapse={() => setIsPanelCollapsed(true)} />}
      <div
        className={cx('tw-min-w-0 tw-flex-1 animation-fade database-page-content-wrap vh-100')}
        style={{ '--tjdb-above-table': '48px' }}
      >
        <TableTabStrip panelCollapsed={isPanelCollapsed} onExpandPanel={() => setIsPanelCollapsed(false)} />
        {totalTables === 0 && !loadingState && <NoTablesState canEditSchema={canEditSchema} />}
        {totalTables === 0 && loadingState && (
          <div className={CENTERED_BELOW_STRIP} data-cy="tables-loading">
            <Spinner size="large" />
          </div>
        )}
        {totalTables > 0 && isEmpty(selectedTable) && (
          <div className={CENTERED_BELOW_STRIP} data-cy="no-table-open">
            <EmptyAndNoResultsState
              variant="no-table-open"
              action={
                <TablePickerPopover
                  trigger={
                    <Button
                      variant="secondary"
                      size="medium"
                      leadingVisual={<PlusIcon />}
                      data-cy="open-a-table-button"
                    >
                      Open a table
                    </Button>
                  }
                />
              }
            />
          </div>
        )}
        {!isEmpty(selectedTable) && (
          <div className={cx('col')}>
            <Table />
          </div>
        )}
      </div>
    </div>
  );
};

export default TooljetDatabasePage;
