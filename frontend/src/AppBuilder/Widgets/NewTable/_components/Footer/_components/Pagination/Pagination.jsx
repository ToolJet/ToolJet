import React from 'react';
import useTableStore from '../../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
import { Pager } from '@/AppBuilder/Shared/Pager/Pager';

export const Pagination = function Pagination({
  id,
  pageIndex = 1,
  tableWidth,
  table,
  pageCount,
  paginationBtnClicked,
  darkMode,
  height,
}) {
  const serverSidePagination = useTableStore((state) => state.getTableProperties(id)?.serverSidePagination, shallow);
  const enablePrevButton = useTableStore((state) => state.getTableProperties(id)?.enablePrevButton, shallow);
  const enableNextButton = useTableStore((state) => state.getTableProperties(id)?.enableNextButton, shallow);
  const serverSideRowsPerPage = useTableStore((state) => state.getTableProperties(id)?.serverSideRowsPerPage, shallow);
  const totalRecords = useTableStore((state) => state.getTableProperties(id)?.totalRecords, shallow);

  const parsedServerSideRowsPerPage = Number(serverSideRowsPerPage);
  const parsedTotalRecords = Number(totalRecords);
  const knowTotalPages = serverSidePagination && parsedServerSideRowsPerPage > 0 && parsedTotalRecords > 0;
  const effectivePageCount = knowTotalPages
    ? Math.ceil(parsedTotalRecords / parsedServerSideRowsPerPage)
    : serverSidePagination
      ? 0
      : pageCount;

  const canGoToNextPage = serverSidePagination ? enableNextButton : table.getCanNextPage();
  const canGoToPreviousPage = serverSidePagination ? enablePrevButton : table.getCanPreviousPage();

  // Server side without a known page count shows only the current page.
  const showCurrentPageOnly = (serverSidePagination && !knowTotalPages) || tableWidth <= 460;
  const showFirstLast =
    serverSidePagination && !knowTotalPages
      ? false
      : (tableWidth <= 460 && effectivePageCount > 1) || effectivePageCount > 3;

  return (
    <Pager
      id={id}
      page={pageIndex}
      pageCount={effectivePageCount}
      maxPageButtons={showCurrentPageOnly ? 1 : 3}
      showFirstLast={showFirstLast}
      showPageList={showFirstLast}
      canPrevious={canGoToPreviousPage}
      canNext={canGoToNextPage}
      canFirst={!(pageIndex === 1 || (serverSidePagination && !enablePrevButton))}
      canLast={!(pageIndex === effectivePageCount || (serverSidePagination && !enableNextButton))}
      onPrevious={() => {
        paginationBtnClicked.current = true;
        table.previousPage();
      }}
      onNext={() => {
        paginationBtnClicked.current = true;
        table.nextPage();
      }}
      onGoToPage={(targetPage) => {
        paginationBtnClicked.current = true;
        table.setPageIndex(targetPage - 1);
      }}
      darkMode={darkMode}
      height={height}
    />
  );
};
