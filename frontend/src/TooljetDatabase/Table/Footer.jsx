import React from 'react';
import Select from '@/_ui/Select';
import Pagination from '@/_ui/Pagination';
import Skeleton from 'react-loading-skeleton';
import { useTooljetDatabaseContext } from '../TooljetDatabaseContext';
import LeftNav from '../Icons/LeftNav.svg';
import RightNav from '../Icons/RightNav.svg';
import Enter from '../Icons/Enter.svg';
import { shallow } from 'zustand/shallow';
import { useTjdbStore, useTjdbActions } from '../_stores/tjdbStore';

const Footer = ({ darkMode, dataLoading, tableDataLength }) => {
  const selectOptions = [
    { label: '50 records', value: 50 },
    { label: '100 records', value: 100 },
    { label: '200 records', value: 200 },
    { label: '500 records', value: 500 },
    { label: '1000 records', value: 1000 },
  ];

  const { totalRecords } = useTooljetDatabaseContext();
  const { pageCount, pageSize } = useTjdbStore(
    (state) => ({ pageCount: state.pageCount, pageSize: state.pageSize }),
    shallow
  );
  const { setPageCount, setPageSize } = useTjdbActions();

  const totalPage = Math.ceil(totalRecords / pageSize);
  const pageRange = `${(pageCount - 1) * pageSize + 1} - ${
    pageCount * pageSize > totalRecords ? totalRecords : pageCount * pageSize
  }`;

  // The rows query reads page and size from the store, so setting them is the whole page change.
  const handleSelectChange = (value) => {
    setPageSize(value);
  };

  const handlePageCountChange = (value) => {
    setPageCount(value);
  };

  const gotoNextPage = (fromInput = false, value = null) => {
    if (fromInput && value) {
      return handlePageCountChange(value);
    }

    setPageCount((previous) => {
      return previous + 1;
    });
  };

  const gotoPreviousPage = () => {
    setPageCount((previous) => {
      if (previous - 1 < 1) {
        return previous;
      }
      return previous - 1;
    });
  };

  // Deleting the last rows of the last page leaves the page number past the end; step back to the new last page.
  // Filter, sort and size changes return to page 1 in the store, so a changed total alone must not.
  React.useEffect(() => {
    if (totalPage > 0 && pageCount > totalPage) setPageCount(totalPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPage]);

  return (
    <div className="toojet-db-table-footer card-footer d-flex align-items-center jet-table-footer justify-content-center col-12">
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
