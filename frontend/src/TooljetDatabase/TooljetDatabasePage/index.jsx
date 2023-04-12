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
  } = useContext(TooljetDatabaseContext);

  const [isCreateRowDrawerOpen, setIsCreateRowDrawerOpen] = useState(false);
  const [isEditRowDrawerOpen, setIsEditRowDrawerOpen] = useState(false);
  const [isCreateColumnDrawerOpen, setIsCreateColumnDrawerOpen] = useState(false);

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
          <div className="text-h3" data-cy="do-not-have-table-text">
            You don&apos;t have any tables yet.
          </div>
        </div>
        <div className="text-h5 text-secondary" data-cy="create-table-to-get-started-text">
          Create a table to get started!
        </div>
      </div>
    );
  };

  return (
    <div className="row gx-0">
      <Sidebar />
      <div className={cx('col animation-fade database-page-content-wrap')}>
        {totalTables === 0 && <EmptyState />}

        {selectedTable && (
          <>
            <div className="database-table-header-wrapper">
              <div className="card border-0">
                <div className="card-body  tj-db-operaions-header">
                  <div className="row align-items-center">
                    <div className="col">
                      <CreateColumnDrawer
                        isCreateColumnDrawerOpen={isCreateColumnDrawerOpen}
                        setIsCreateColumnDrawerOpen={setIsCreateColumnDrawerOpen}
                      />
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
              <Table
                openCreateRowDrawer={() => setIsCreateRowDrawerOpen(true)}
                openCreateColumnDrawer={() => setIsCreateColumnDrawerOpen(true)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TooljetDatabasePage;
