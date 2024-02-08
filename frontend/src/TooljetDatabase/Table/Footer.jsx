import React, { useContext } from 'react';
import Select from '@/_ui/Select';
import Pagination from '@/_ui/Pagination';
import Skeleton from 'react-loading-skeleton';
import { TooljetDatabaseContext } from '../index';
import LeftNav from '../Icons/LeftNav.svg';
import RightNav from '../Icons/RightNav.svg';
import Enter from '../Icons/Enter.svg';

const Footer = ({ darkMode, dataLoading, tableDataLength, collapseSidebar }) => {
  const selectOptions = [
    { label: '50 records', value: 50 },
    { label: '100 records', value: 100 },
    { label: '200 records', value: 200 },
    { label: '500 records', value: 500 },
    { label: '1000 records', value: 1000 },
  ];

  const { selectedTable, totalRecords, buildPaginationQuery, setPageCount, pageCount, setPageSize, pageSize } =
    useContext(TooljetDatabaseContext);

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
    setPageCount(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalRecords]);

  React.useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable]);

  return (
    <div
      className={`${
        collapseSidebar ? 'toojet-db-table-footer-collapse' : 'toojet-db-table-footer'
      } card-footer d-flex align-items-center jet-table-footer justify-content-center col-12`}
    >
      {tableDataLength > 0 && (
        <div
          className="table-footer d-flex align-items-center justify-content-between gx-0"
          data-cy="table-footer-section"
        >
          <div className="keyPress-actions h-100 d-flex align-items-center">
            <div className="navigate-keyActions">
              <div className="leftNav-parent-container">
                <LeftNav style={{ verticalAlign: 'baseline' }} width={8} height={8} />
              </div>
              <div className="rightNav-parent-container">
                <RightNav style={{ verticalAlign: 'baseline' }} width={8} height={8} />
              </div>
              <div className="navigate-title fs-10">Navigate</div>
            </div>
            <div className="enter-keyActions">
              <div className="editEnter-parent-container">
                <Enter style={{ verticalAlign: 'baseline' }} width={8} height={8} />
              </div>
              <div className="navigate-title fs-10">Enter to edit</div>
            </div>
          </div>
          <div className="fs-12">
            <Pagination
              darkMode={darkMode}
              gotoNextPage={gotoNextPage}
              gotoPreviousPage={gotoPreviousPage}
              currentPage={pageCount}
              totalPage={totalPage}
              isDisabled={dataLoading}
            />
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <div className="mx-2" data-cy="total-records-section">
              {dataLoading ? (
                <Skeleton count={1} height={3} className="mt-3" />
              ) : (
                <span className="animation-fade fs-12" data-cy={`${pageRange}-of-${totalRecords}-records-text}`}>
                  {pageRange} of {totalRecords} Records
                </span>
              )}
            </div>
            <div className="mx-2 records-dropdown-field fs-12" data-cy="records-dropdown-field">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Footer;
