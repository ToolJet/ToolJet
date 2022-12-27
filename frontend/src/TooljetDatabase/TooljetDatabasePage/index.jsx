import React, { useState, useContext } from 'react';
import cx from 'classnames';
import Table from '../Table';
import CreateColumnDrawer from '../Drawers/CreateColumnDrawer';
import CreateRowDrawer from '../Drawers/CreateRowDrawer';
import Filter from '../Filter';
import Sort from '../Sort';
import Sidebar from '../Sidebar';
import { TooljetDatabaseContext } from '../index';

const TooljetDatabasePage = () => {
  const { columns, selectedTable, handleBuildSortQuery, resetSortQuery } = useContext(TooljetDatabaseContext);

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [isCreateRowDrawerOpen, setIsCreateRowDrawerOpen] = useState(false);

  const [filters, setFilters] = useState({});
  const [sortFilters, setSortFilters] = useState({});

  return (
    <div className="row gx-0">
      <Sidebar />
      <div
        className={cx('col animation-fade', {
          'bg-gray': !darkMode,
        })}
      >
        {selectedTable && (
          <>
            <div className="card border-0">
              <div className="card-body p-0 py-2">
                <div className="row g-2 align-items-center">
                  <div className="col">
                    <CreateColumnDrawer />
                    {columns?.length > 0 && (
                      <>
                        <Filter filters={filters} setFilters={setFilters} />
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
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className={cx('col')}>
              <Table
                openCreateRowDrawer={() => setIsCreateRowDrawerOpen(true)}
                filters={filters}
                sortFilters={sortFilters}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TooljetDatabasePage;
