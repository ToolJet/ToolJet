import React, { useState, useContext, useRef } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import { isEmpty } from 'lodash';
import CreateTableForm from '../Forms/TableForm';
import CreateRowForm from '../Forms/RowForm';
import CreateColumnForm from '../Forms/ColumnForm';
import Search from './Search';
import Filter from './Filter';
import Sort from './Sort';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';
import PostgrestQueryBuilder from '@/_helpers/postgrestQueryBuilder';

const PageHeader = () => {
  const { organizationId, columns, selectedTable, setSelectedTable, setSelectedTableData, setTables, setColumns } =
    useContext(TooljetDatabaseContext);
  const [isCreateTableDrawerOpen, setIsCreateTableDrawerOpen] = useState(false);
  const [isCreateColumnDrawerOpen, setIsCreateColumnDrawerOpen] = useState(false);
  const [isCreateRowDrawerOpen, setIsCreateRowDrawerOpen] = useState(false);
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

  return (
    <>
      <div className="row gx-0 align-items-center animation-fade">
        <div className="col-3 p-3 border-end border-bottom bg-gray">
          <button
            className="btn btn-primary active w-100"
            type="button"
            onClick={() => setIsCreateTableDrawerOpen(!isCreateTableDrawerOpen)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.66699 2.66659C4.49018 2.66659 4.32061 2.73682 4.19559 2.86185C4.07056 2.98687 4.00033 3.15644 4.00033 3.33325V12.6666C4.00033 12.8434 4.07056 13.013 4.19559 13.138C4.32061 13.263 4.49018 13.3333 4.66699 13.3333H11.3337C11.5105 13.3333 11.68 13.263 11.8051 13.138C11.9301 13.013 12.0003 12.8434 12.0003 12.6666V5.99992H10.0003C9.6467 5.99992 9.30756 5.85944 9.05752 5.60939C8.80747 5.35935 8.66699 5.02021 8.66699 4.66659V2.66659H4.66699ZM10.0003 3.60939L11.0575 4.66659H10.0003V3.60939ZM3.25278 1.91904C3.62785 1.54397 4.13656 1.33325 4.66699 1.33325H9.33366C9.51047 1.33325 9.68004 1.40349 9.80506 1.52851L13.1384 4.86185C13.2634 4.98687 13.3337 5.15644 13.3337 5.33325V12.6666C13.3337 13.197 13.1229 13.7057 12.7479 14.0808C12.3728 14.4559 11.8641 14.6666 11.3337 14.6666H4.66699C4.13656 14.6666 3.62785 14.4559 3.25278 14.0808C2.87771 13.7057 2.66699 13.197 2.66699 12.6666V3.33325C2.66699 2.80282 2.87771 2.29411 3.25278 1.91904ZM8.00033 6.66659C8.36852 6.66659 8.66699 6.96506 8.66699 7.33325V8.66659H10.0003C10.3685 8.66659 10.667 8.96506 10.667 9.33325C10.667 9.70144 10.3685 9.99992 10.0003 9.99992H8.66699V11.3333C8.66699 11.7014 8.36852 11.9999 8.00033 11.9999C7.63214 11.9999 7.33366 11.7014 7.33366 11.3333V9.99992H6.00033C5.63214 9.99992 5.33366 9.70144 5.33366 9.33325C5.33366 8.96506 5.63214 8.66659 6.00033 8.66659H7.33366V7.33325C7.33366 6.96506 7.63214 6.66659 8.00033 6.66659Z"
                fill="#FDFDFE"
              />
            </svg>
            &nbsp;&nbsp;Add table
          </button>
          <Search />
        </div>
        <div className="col-9">
          {selectedTable && (
            <div className="card border-0">
              <div className="card-body">
                <div className="row g-2 align-items-center">
                  <div className="col">
                    <button
                      onClick={() => setIsCreateColumnDrawerOpen(!isCreateColumnDrawerOpen)}
                      className="btn border-0 m-2"
                    >
                      <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M1.05654 0.550681C1.30659 0.300633 1.64573 0.160156 1.99935 0.160156H4.66602C5.01964 0.160156 5.35878 0.300633 5.60882 0.550681C5.85887 0.800729 5.99935 1.13987 5.99935 1.49349V10.8268C5.99935 11.1804 5.85887 11.5196 5.60882 11.7696C5.35877 12.0197 5.01964 12.1602 4.66602 12.1602H1.99935C1.64573 12.1602 1.30659 12.0197 1.05654 11.7696C0.806491 11.5196 0.666016 11.1804 0.666016 10.8268V1.49349C0.666016 1.13987 0.806492 0.800729 1.05654 0.550681ZM4.66602 1.49349L1.99935 1.49349L1.99935 10.8268H4.66602V1.49349ZM9.33268 4.16016C9.70087 4.16016 9.99935 4.45863 9.99935 4.82682V5.49349H10.666C11.0342 5.49349 11.3327 5.79197 11.3327 6.16016C11.3327 6.52835 11.0342 6.82682 10.666 6.82682H9.99935V7.49349C9.99935 7.86168 9.70087 8.16016 9.33268 8.16016C8.96449 8.16016 8.66602 7.86168 8.66602 7.49349V6.82682H7.99935C7.63116 6.82682 7.33268 6.52835 7.33268 6.16016C7.33268 5.79197 7.63116 5.49349 7.99935 5.49349H8.66602V4.82682C8.66602 4.45863 8.96449 4.16016 9.33268 4.16016Z"
                          fill="#889096"
                        />
                      </svg>
                      &nbsp;&nbsp;Add new column
                    </button>
                    {columns?.length > 0 && (
                      <>
                        <Filter onClose={handleBuildFilterQuery} />
                        <Sort onClose={handleBuildSortQuery} />
                        <button
                          onClick={() => setIsCreateRowDrawerOpen(!isCreateRowDrawerOpen)}
                          className="btn border-0 m-2"
                          style={{ backgroundColor: '#F0F4FF', color: '#F0F4FF', fontWeight: 500, fontSize: 12 }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M0.390524 1.21767C0.640573 0.967625 0.979711 0.827148 1.33333 0.827148H10.6667C11.0203 0.827148 11.3594 0.967624 11.6095 1.21767C11.8595 1.46772 12 1.80686 12 2.16048V4.82715C12 5.18077 11.8595 5.51991 11.6095 5.76996C11.3594 6.02001 11.0203 6.16048 10.6667 6.16048H1.33333C0.979711 6.16048 0.640573 6.02001 0.390524 5.76996C0.140476 5.51991 0 5.18077 0 4.82715V2.16048C0 1.80686 0.140476 1.46772 0.390524 1.21767ZM10.6667 2.16048H1.33333L1.33333 4.82715H10.6667V2.16048ZM6 7.49381C6.36819 7.49381 6.66667 7.79229 6.66667 8.16048V8.82715H7.33333C7.70152 8.82715 8 9.12562 8 9.49381C8 9.862 7.70152 10.1605 7.33333 10.1605H6.66667V10.8271C6.66667 11.1953 6.36819 11.4938 6 11.4938C5.63181 11.4938 5.33333 11.1953 5.33333 10.8271V10.1605H4.66667C4.29848 10.1605 4 9.862 4 9.49381C4 9.12562 4.29848 8.82715 4.66667 8.82715H5.33333V8.16048C5.33333 7.79229 5.63181 7.49381 6 7.49381Z"
                              fill="#3E63DD"
                            />
                          </svg>
                          &nbsp;&nbsp;<span className="color-primary">Add new row</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Drawer isOpen={isCreateTableDrawerOpen} onClose={() => setIsCreateTableDrawerOpen(false)} position="right">
        <CreateTableForm
          onCreate={(tableName) => {
            tooljetDatabaseService.findAll(organizationId).then(({ data = [], error }) => {
              if (error) {
                toast.error(error?.message ?? 'Failed to fetch tables');
                return;
              }

              if (Array.isArray(data?.result) && data.result.length > 0) {
                setTables(data.result || []);
                setSelectedTable(tableName);
              }
            });
            setIsCreateTableDrawerOpen(false);
          }}
          onClose={() => setIsCreateTableDrawerOpen(false)}
        />
      </Drawer>
      <Drawer isOpen={isCreateColumnDrawerOpen} onClose={() => setIsCreateColumnDrawerOpen(false)} position="right">
        <CreateColumnForm
          onCreate={() => {
            tooljetDatabaseService.viewTable(organizationId, selectedTable).then(({ data = [], error }) => {
              if (error) {
                toast.error(error?.message ?? `Error fetching columns for table "${selectedTable}"`);
                return;
              }

              if (data?.result?.length > 0) {
                setColumns(
                  data?.result.map(({ column_name, data_type, keytype, ...rest }) => ({
                    Header: column_name,
                    accessor: column_name,
                    dataType: data_type,
                    isPrimaryKey: keytype?.toLowerCase() === 'primary key',
                    ...rest,
                  }))
                );
              }
            });
            setIsCreateColumnDrawerOpen(false);
          }}
          onClose={() => setIsCreateColumnDrawerOpen(false)}
        />
      </Drawer>
      <Drawer isOpen={isCreateRowDrawerOpen} onClose={() => setIsCreateRowDrawerOpen(false)} position="right">
        <CreateRowForm
          onCreate={() => {
            tooljetDatabaseService.findOne(organizationId, selectedTable).then(({ data = [], error }) => {
              if (error) {
                toast.error(error?.message ?? `Failed to fetch table "${selectedTable}"`);
                return;
              }

              if (Array.isArray(data) && data?.length > 0) {
                setSelectedTableData(data);
              }
            });
            setIsCreateRowDrawerOpen(false);
          }}
          onClose={() => setIsCreateRowDrawerOpen(false)}
        />
      </Drawer>
    </>
  );
};

export default PageHeader;
