import React, { useState, useContext } from 'react';
import cx from 'classnames';
import Table from '../Table';
import CreateColumnDrawer from '../Drawers/CreateColumnDrawer';
import CreateRowDrawer from '../Drawers/CreateRowDrawer';
import EditRowDrawer from '../Drawers/EditRowDrawer';
import Filter from '../Filter';
import Sort from '../Sort';
import Sidebar from '../Sidebar';
import { TooljetDatabaseContext } from '../index';
import EmptyFoldersIllustration from '@assets/images/icons/no-queries-added.svg';
import ExportSchema from '../ExportSchema/ExportSchema';
import { appService } from '../../_services/app.service';

const TooljetDatabasePage = ({ totalTables }) => {
  const {
    columns,
    selectedTable,
    handleBuildSortQuery,
    handleBuildFilterQuery,
    resetFilterQuery,
    resetSortQuery,
    queryFilters,
    setQueryFilters,
    sortFilters,
    setSortFilters,
    organizationId
  } = useContext(TooljetDatabaseContext);

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [isCreateRowDrawerOpen, setIsCreateRowDrawerOpen] = useState(false);
  const [isEditRowDrawerOpen, setIsEditRowDrawerOpen] = useState(false);

  const EmptyState = () => {
    return (
      <div
        style={{
          transform: 'translateY(50%)',
        }}
        className="d-flex justify-content-center align-items-center flex-column mt-3"
      >
        <div className="mb-4">
          <EmptyFoldersIllustration />
        </div>
        <div className="text-center">
          <div className="text-h3">You don&apos;t have any tables yet.</div>
        </div>
        <div className="text-h5 text-secondary">Create a table to get started!</div>
      </div>
    );
  };

  const exportTable = () => {
    appService
      .exportResource({
        tooljet_database: [{ table_id: selectedTable.id }],
        organization_id: organizationId
      })
      .then((data) => {
        const tableName = selectedTable.table_name.replace(/\s+/g, '-').toLowerCase();
        const fileName = `${tableName}-export-${new Date().getTime()}`;
        // simulate link click download
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = fileName + '.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        closeModal();
      })
      .catch(() => {
        toast.error('Could not export table.', {
          position: 'top-center',
        });
        closeModal();
      });
  }

  return (
    <div className="row gx-0">
      <Sidebar />
      <div
        className={cx('col animation-fade', {
          'bg-light-gray': !darkMode,
        })}
      >
        {totalTables === 0 && <EmptyState />}

        {selectedTable && (
          <>
            <div className="database-table-header-wrapper">
              <div className="card border-0 px-3 py-2">
                <span className="text-h3 font-weight-500">{selectedTable.table_name}</span>
              </div>
              <div className="card border-0">
                <div className="card-body p-0 py-2">
                  <div className="row g-2 align-items-center">
                    <div className="col d-flex">
                      <CreateColumnDrawer />
                      {columns?.length > 0 && (
                        <>
                          <Filter
                            filters={queryFilters}
                            setFilters={setQueryFilters}
                            handleBuildFilterQuery={handleBuildFilterQuery}
                            resetFilterQuery={resetFilterQuery}
                          />
                          <Sort
                            filters={sortFilters}
                            setFilters={setSortFilters}
                            handleBuildSortQuery={handleBuildSortQuery}
                            resetSortQuery={resetSortQuery}
                          />
                          <ExportSchema onClick={exportTable} />
                          <CreateRowDrawer
                            isCreateRowDrawerOpen={isCreateRowDrawerOpen}
                            setIsCreateRowDrawerOpen={setIsCreateRowDrawerOpen}
                          />
                          <EditRowDrawer
                            isCreateRowDrawerOpen={isEditRowDrawerOpen}
                            setIsCreateRowDrawerOpen={setIsEditRowDrawerOpen}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={cx('col')}>
              <Table openCreateRowDrawer={() => setIsCreateRowDrawerOpen(true)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TooljetDatabasePage;
