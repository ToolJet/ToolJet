import React, { useState } from 'react';
import cx from 'classnames';
import Table from '../Table';
import { Table as TableIcon } from 'lucide-react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/Rocket/Empty/Empty';
import { TablesPanel } from '../TablesPanel/TablesPanel';
import { TableTabStrip } from '../TablesPanel/TableTabStrip';
import CreateTableDrawer from '../Drawers/CreateTableDrawer';
import { useTooljetDatabaseContext } from '../TooljetDatabaseContext';
import Warning from '../Icons/warning.svg';
import WarningDark from '../Icons/warning-dark.svg';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { isEmpty } from 'lodash';
import Plus from '@/_ui/Icon/solidIcons/Plus';
import Skeleton from 'react-loading-skeleton';

const TooljetDatabasePage = ({ totalTables }) => {
  const { selectedTable, loadingState, canEditSchema } = useTooljetDatabaseContext();
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const emptyMessage = "You don't have any tables yet.";
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const emptyHeader = Array.from({ length: 5 }, (_, index) => index + 1);
  const emptyTableData = Array.from({ length: 10 }, (_, index) => index + 1);
  const EmptyState = () => {
    const [isCreateTableDrawerOpen, setIsCreateTableDrawerOpen] = useState(false);
    return (
      <>
        <div className="empty-table-container">
          <div>
            <div className={darkMode ? 'warning-icon-container-dark' : 'warning-icon-container'}>
              {darkMode ? <WarningDark /> : <Warning />}
            </div>
            <div className="text-h3" style={{ width: '400px', textAlign: 'center' }} data-cy="do-not-have-records-text">
              {emptyMessage}
              <p className="empty-table-description mb-2">Create a table to get started!</p>
            </div>
            <div className="tjdb-create-new-table">
              <ButtonSolid
                variant={`${darkMode ? 'zBlack' : 'tertiary'}`}
                disabled={!canEditSchema}
                onClick={() => setIsCreateTableDrawerOpen(!isCreateTableDrawerOpen)}
                size="sm"
                className="px-1 pe-3 ps-2 gap-0"
              >
                <Plus fill="#697177" style={{ height: '16px' }} />
                Create new table
              </ButtonSolid>
            </div>
          </div>
        </div>
        <CreateTableDrawer isOpen={isCreateTableDrawerOpen} onClose={() => setIsCreateTableDrawerOpen(false)} />
      </>
    );
  };

  const LoadingState = () => {
    return (
      <>
        <div className="table-responsive border-0 tj-db-table animation-fade tj-table-empty" style={{ height: 'auto' }}>
          {loadingState && (
            <table
              className={`table card-table loading-table table-vcenter text-nowrap datatable ${
                darkMode && 'dark-background'
              }`}
              style={{ position: 'relative' }}
            >
              <thead>
                <tr>
                  {emptyHeader.map((element, index) => (
                    <th key={index} width={index === 0 ? 66 : 230}>
                      <div className="d-flex align-items-center justify-content-between tjdb-loader-parent">
                        {index > 0 && <Skeleton count={1} height={20} className="tjdb-loader" />}

                        <div className="tjdb-loader-icon-parent">
                          <Skeleton count={1} height={20} className="tjdb-icon-loader" />
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {emptyTableData.map((element, rowIdex) => (
                  <tr
                    className={cx(`tjdb-table-row row-tj tjdb-empty-row`, {
                      'dark-bg': darkMode,
                    })}
                    key={rowIdex} // row Index
                  >
                    {emptyHeader.map((elem, i) => (
                      <td key={i} className={cx('table-cell')}></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="tw-flex tw-h-[calc(100vh-48px)]">
      {!isPanelCollapsed && <TablesPanel onCollapse={() => setIsPanelCollapsed(true)} />}
      <div
        className={cx('tw-min-w-0 tw-flex-1 animation-fade database-page-content-wrap vh-100')}
        style={{ '--tjdb-above-table': '48px' }}
      >
        <TableTabStrip panelCollapsed={isPanelCollapsed} onExpandPanel={() => setIsPanelCollapsed(false)} />
        {totalTables === 0 && !loadingState && <EmptyState />}
        {totalTables === 0 && loadingState && <LoadingState />}
        {totalTables > 0 && isEmpty(selectedTable) && (
          <Empty data-cy="no-table-open">
            <EmptyMedia variant="icon">
              <TableIcon />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No table open</EmptyTitle>
              <EmptyDescription>Pick a table from the panel, or use + to open or create one.</EmptyDescription>
            </EmptyHeader>
          </Empty>
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
