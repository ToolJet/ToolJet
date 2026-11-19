import React from 'react';
import { shallow } from 'zustand/shallow';
import { useTooljetDatabaseContext } from '../TooljetDatabaseContext';
import { useTjdbStore, useTjdbActions, selectView } from '../_stores/tjdbStore';
import { FooterView } from './FooterView';

const Footer = ({ dataLoading }: { dataLoading: boolean }) => {
  const { totalRecords } = useTooljetDatabaseContext();
  const { pageCount, pageSize } = useTjdbStore(
    (state: any) => ({ pageCount: selectView(state).pageCount, pageSize: selectView(state).pageSize }),
    shallow
  );
  const { setPageCount, setPageSize } = useTjdbActions();

  const totalPage = Math.ceil(totalRecords / pageSize);

  // Deleting the last rows of the last page leaves the page number past the end; step back to the new last page.
  // Filter, sort and size changes return to page 1 in the store, so a changed total alone must not.
  React.useEffect(() => {
    if (totalPage > 0 && pageCount > totalPage) setPageCount(totalPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPage]);

  // The rows query reads page and size from the store, so setting them is the whole page change.
  return (
    <FooterView
      page={pageCount}
      pageSize={pageSize}
      total={totalRecords}
      loading={dataLoading}
      onPageChange={setPageCount}
      onPageSizeChange={setPageSize}
    />
  );
};

export default Footer;
