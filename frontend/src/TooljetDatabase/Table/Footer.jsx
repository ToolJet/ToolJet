import React, { useState, useContext } from 'react';
import { Button } from '@/_ui/LeftSidebar';
import Select from '@/_ui/Select';
import Pagination from '@/_ui/Pagination';
import Skeleton from 'react-loading-skeleton';
import { TooljetDatabaseContext } from '../index';
import { authenticationService } from '@/_services';
import { posthog } from 'posthog-js';

const Footer = ({ darkMode, openCreateRowDrawer, dataLoading, tableDataLength }) => {
  const selectOptions = [
    { label: '50 records', value: 50 },
    { label: '100 records', value: 100 },
    { label: '200 records', value: 200 },
    { label: '500 records', value: 500 },
    { label: '1000 records', value: 1000 },
  ];

  const { selectedTable, totalRecords, buildPaginationQuery } = useContext(TooljetDatabaseContext);

  const [pageCount, setPageCount] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const totalPage = Math.ceil(totalRecords / pageSize);
  const pageRange = `${(pageCount - 1) * pageSize + 1} - ${
    pageCount * pageSize > totalRecords ? totalRecords : pageCount * pageSize
  }`;

  const handleSelectChange = (value) => {
    setPageSize(value);
    setPageCount(1);
    buildPaginationQuery(value, 0);
  };

  const handlePageCountChange = (value) => {
    setPageCount(value);
    const limit = pageSize;
    const offset = value === 1 ? 0 : (value - 1) * pageSize;
    buildPaginationQuery(limit, offset);
  };

  const gotoNextPage = (fromInput = false, value = null) => {
    if (fromInput && value) {
      return handlePageCountChange(value);
    }

    setPageCount((previous) => {
      return previous + 1;
    });

    const limit = pageSize;
    const offset = pageCount * pageSize;

    buildPaginationQuery(limit, offset);
  };

  const gotoPreviousPage = () => {
    setPageCount((previous) => {
      if (previous - 1 < 1) {
        return previous;
      }
      return previous - 1;
    });

    const limit = pageSize;
    const offset = (pageCount - 2) * pageSize;

    buildPaginationQuery(limit, offset);
  };

  const reset = () => {
    setPageCount(1);
    setPageSize(50);
  };

  React.useEffect(() => {
    reset();
  }, [totalRecords, selectedTable]);

  return (
    <div className="toojet-db-table-footer card-footer d-flex align-items-center jet-table-footer justify-content-center">
      <div className="table-footer row gx-0" data-cy="table-footer-section">
        <div className="col-5" data-cy="add-new-row-button">
          <Button
            disabled={dataLoading}
            onClick={() => {
              posthog.capture('click_add_new_row', {
                workspace_id:
                  authenticationService?.currentUserValue?.organization_id ||
                  authenticationService?.currentSessionValue?.current_organization_id,
                datasource: 'tooljet_db',
              });
              openCreateRowDrawer();
            }}
            darkMode={darkMode}
            size="sm"
            styles={{ width: '118px', fontSize: '12px', fontWeight: 700, borderColor: darkMode && 'transparent' }}
          >
            <Button.Content title={'Add new row'} iconSrc={'assets/images/icons/add-row.svg'} direction="left" />
          </Button>
        </div>
        {tableDataLength > 0 && (
          <div className="col d-flex align-items-center justify-content-end">
            <div className="col">
              <Pagination
                darkMode={darkMode}
                gotoNextPage={gotoNextPage}
                gotoPreviousPage={gotoPreviousPage}
                currentPage={pageCount}
                totalPage={totalPage}
                isDisabled={dataLoading}
              />
            </div>
            <div className="col mx-2 records-dropdown-field" data-cy="records-dropdown-field">
              <Select
                isLoading={dataLoading}
                options={selectOptions}
                value={selectOptions.find((option) => option.value === pageSize)}
                search={false}
                onChange={(value) => handleSelectChange(value)}
                placeholder={'Select page'}
                useMenuPortal={false}
                menuPlacement="top"
              />
            </div>
            <div className="col-4 mx-2" data-cy="total-records-section">
              {dataLoading ? (
                <Skeleton count={1} height={3} className="mt-3" />
              ) : (
                <span className="animation-fade" data-cy={`${pageRange}-of-${totalRecords}-records-text}`}>
                  {pageRange} of {totalRecords} Records
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Footer;
