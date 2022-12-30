import React, { useState, useMemo } from 'react';
import Pagination from '@/_ui/Pagination';
import Skeleton from 'react-loading-skeleton';

const Footer = ({ darkMode, count, pageChanged, dataLoading, itemsPerPage = 9 }) => {
  const [pageCount, setPageCount] = useState(1);
  const totalPages = useMemo(() => {
    return Math.floor((count - 1) / itemsPerPage) + 1;
  }, [count, itemsPerPage]);

  const pageRange = `${(pageCount - 1) * itemsPerPage + 1} - ${
    pageCount * itemsPerPage > count ? count : pageCount * itemsPerPage
  }`;

  const handlePageCountChange = (value) => {
    setPageCount(value);
    pageChanged(value);
  };

  const gotoNextPage = (fromInput = false, value = null) => {
    if (fromInput && value) {
      return handlePageCountChange(value);
    }

    setPageCount((previous) => {
      const next = previous + 1;
      pageChanged(next);
      return next;
    });
  };

  const gotoPreviousPage = () => {
    setPageCount((previous) => {
      if (previous - 1 < 1) {
        pageChanged(previous);
        return previous;
      }
      pageChanged(previous - 1);
      return previous - 1;
    });
  };

  return (
    <div className="home-page-footer card-footer d-flex align-items-center jet-table-footer justify-content-center">
      <div className="table-footer row gx-0">
        <div className="col-5"></div>
        <div className="col d-flex align-items-center justify-content-end">
          <div className="col">
            <Pagination
              darkMode={darkMode}
              gotoNextPage={gotoNextPage}
              gotoPreviousPage={gotoPreviousPage}
              currentPage={pageCount}
              totalPage={totalPages}
              isDisabled={dataLoading}
            />
          </div>
          <div className="col-4 mx-2">
            {dataLoading ? (
              <Skeleton count={1} height={2} />
            ) : (
              <span className="animation-fade">
                {pageRange} of {count} apps
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
