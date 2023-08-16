import React, { useState, useEffect } from 'react';

import config from 'config';
import { Box, IconButton, Typography } from '@mui/material';
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
} from '@mui/icons-material';

export const Pagination = function Pagination({
  onPageIndexChanged,
  serverSide,
  autoGotoPage,
  autoCanNextPage,
  autoPageCount,
  autoPageOptions,
  lastActivePageIndex,
  pageIndex,
  setPageIndex,
  enablePrevButton,
  enableNextButton,
}) {
  const [pageCount, setPageCount] = useState(autoPageCount);

  useEffect(() => {
    setPageCount(autoPageCount);
  }, [autoPageCount]);

  useEffect(() => {
    if (serverSide && lastActivePageIndex > 0) {
      setPageCount(lastActivePageIndex);
    } else if (serverSide || lastActivePageIndex === 0) {
      setPageIndex(1);
    } else {
      gotoPage(lastActivePageIndex + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSide, lastActivePageIndex]);

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
    <>
      {config.UI_LIB === 'tooljet' && (
        <div className="pagination justify-content-start">
          {!serverSide && (
            <button
              data-cy={`pagination-button-to-first`}
              className={`btn btn-sm btn-light mx-2 ${pageIndex === 1 ? 'cursor-not-allowed' : ''}`}
              onClick={() => gotoPage(1)}
              disabled={pageIndex === 1}
            >
              {'<<'}
            </button>
          )}
          <button
            data-cy={`pagination-button-to-previous`}
            className={`btn btn-sm btn-light ${pageIndex === 1 ? 'cursor-not-allowed' : ''}`}
            onClick={() => goToPreviousPage()}
            disabled={pageIndex === 1 || !enablePrevButton}
          >
            {'<'}
          </button>{' '}
          <small
            className="p-1 mx-2"
            data-cy={`page-index-details`}
          >
            {serverSide && <strong>{pageIndex}</strong>}
            {!serverSide && (
              <strong>
                {pageIndex} of {autoPageOptions.length || 1}
              </strong>
            )}
          </small>
          <button
            data-cy={`pagination-button-to-next`}
            className={`btn btn-light btn-sm ${!autoCanNextPage && !serverSide ? 'cursor-not-allowed' : ''}`}
            onClick={() => goToNextPage()}
            disabled={(!autoCanNextPage && !serverSide) || !enableNextButton}
          >
            {'>'}
          </button>{' '}
          {!serverSide && (
            <button
              data-cy={`pagination-button-to-last`}
              className={`btn btn-light btn-sm mx-2 ${!autoCanNextPage && !serverSide ? 'cursor-not-allowed' : ''}`}
              onClick={() => gotoPage(pageCount)}
              disabled={!autoCanNextPage && !serverSide}
            >
              {'>>'}
            </button>
          )}
        </div>
      )}
      {config.UI_LIB === 'mui' && (
        <Box
          display="flex"
          justifyContent="flex-start"
          alignItems="center"
        >
          {!serverSide && (
            <IconButton
              data-cy={`pagination-button-to-first`}
              onClick={() => gotoPage(1)}
              disabled={pageIndex === 1}
            >
              <KeyboardDoubleArrowLeft />
            </IconButton>
          )}
          <IconButton
            data-cy={`pagination-button-to-previous`}
            onClick={() => goToPreviousPage()}
            disabled={pageIndex === 1 || !enablePrevButton}
          >
            <KeyboardArrowLeft />
          </IconButton>{' '}
          <Typography
            data-cy={`page-index-details`}
            variant="body1"
          >
            {serverSide && { pageIndex }}
            {!serverSide && (
              <>
                {pageIndex} of {autoPageOptions.length || 1}
              </>
            )}
          </Typography>
          <IconButton
            data-cy={`pagination-button-to-next`}
            onClick={() => goToNextPage()}
            disabled={(!autoCanNextPage && !serverSide) || !enableNextButton}
          >
            <KeyboardArrowRight />
          </IconButton>
          {!serverSide && (
            <IconButton
              data-cy={`pagination-button-to-last`}
              className={`btn btn-light btn-sm mx-2 ${!autoCanNextPage && !serverSide ? 'cursor-not-allowed' : ''}`}
              onClick={() => gotoPage(pageCount)}
              disabled={!autoCanNextPage && !serverSide}
            >
              <KeyboardDoubleArrowRight />
            </IconButton>
          )}
        </Box>
      )}
    </>
  );
};
