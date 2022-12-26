import React, { useState, useContext, useRef } from 'react';
import cx from 'classnames';
import { toast } from 'react-hot-toast';
import { isEmpty } from 'lodash';
import Table from '../Table';
import CreateColumnDrawer from '../Drawers/CreateColumnDrawer';
import CreateRowDrawer from '../Drawers/CreateRowDrawer';
import Filter from '../Filter';
import Sort from '../Sort';
import Sidebar from '../Sidebar';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';
import PostgrestQueryBuilder from '@/_helpers/postgrestQueryBuilder';

const TooljetDatabasePage = () => {
  const { organizationId, columns, selectedTable, setSelectedTableData } = useContext(TooljetDatabaseContext);
  const postgrestQueryBuilder = useRef({
    filterQuery: new PostgrestQueryBuilder(),
    sortQuery: new PostgrestQueryBuilder(),
  });

  const handleBuildFilterQuery = (filters) => {
    postgrestQueryBuilder.current.filterQuery = new PostgrestQueryBuilder();

    Object.keys(filters).map((key) => {
      if (!isEmpty(filters[key])) {
        const { column, operator, value } = filters[key];
        if (!isEmpty(column) && !isEmpty(operator) && !isEmpty(value)) {
          postgrestQueryBuilder.current.filterQuery[operator](column, value);
        }
      }
    });

    updateSelectedTableData();
  };

  const handleBuildSortQuery = (filters) => {
    postgrestQueryBuilder.current.sortQuery = new PostgrestQueryBuilder();

    Object.keys(filters).map((key) => {
      if (!isEmpty(filters[key])) {
        const { column, order } = filters[key];
        if (!isEmpty(column) && !isEmpty(order)) {
          postgrestQueryBuilder.current.sortQuery.order(column, order);
        }
      }
    });

    updateSelectedTableData();
  };

  const updateSelectedTableData = async () => {
    const query =
      postgrestQueryBuilder.current.filterQuery.url.toString() +
      '&' +
      postgrestQueryBuilder.current.sortQuery.url.toString();

    const { data, error } = await tooljetDatabaseService.findOne(organizationId, selectedTable, query);

    if (error) {
      toast.error(error?.message ?? 'Something went wrong');
      return;
    }

    if (Array.isArray(data)) {
      setSelectedTableData(data);
    }
  };

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [isCreateRowDrawerOpen, setIsCreateRowDrawerOpen] = useState(false);

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
                        <Filter onClose={handleBuildFilterQuery} />
                        <Sort onClose={handleBuildSortQuery} />
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
              <Table openCreateRowDrawer={() => setIsCreateRowDrawerOpen(true)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TooljetDatabasePage;
