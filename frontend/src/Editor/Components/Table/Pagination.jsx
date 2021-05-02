import React, { useState, useEffect } from 'react';

export const Pagination = function Pagination({
  onPageIndexChanged,
  serverSide,
  autoGotoPage,
  autoCanNextPage,
  autoPageCount
}) {
  const [pageIndex, setPageIndex] = useState(1);
  const [pageCount, setPageCount] = useState(autoPageCount);

  useEffect(() => {
    setPageCount(autoPageCount);
  }, [autoPageCount]);

  function gotoPage(page) {
    setPageIndex(page);
    onPageIndexChanged(page);
    if (!serverSide) {
      autoGotoPage(page - 1);
    }
  }

  function goToNextPage() {
    gotoPage(pageIndex + 1);
  }

  function goToPreviousPage() {
    gotoPage(pageIndex - 1);
  }

  return (
        <div className="pagination">
            {!serverSide
                && <button className="btn btn-sm btn-light mx-2" onClick={() => gotoPage(1)}>
                {'<<'}
                </button>
            }
            <button
                className="btn btn-light btn-sm"
                onClick={() => goToPreviousPage()}
                disabled={pageIndex === 1}
            >
              {'<'}
            </button>{' '}
            <small className="p-1 mx-2">
              <strong>
                {pageIndex}
              </strong>
            </small>
            <button
                className="btn btn-light btn-sm"
                onClick={() => goToNextPage()}
                disabled={!autoCanNextPage}
            >
              {'>'}
            </button>{' '}

            {!serverSide
                && <button
                className="btn btn-light btn-sm mx-2"
                onClick={() => gotoPage(pageCount)}
                >
                {'>>'}
                </button>
            }
        </div>
  );
};
