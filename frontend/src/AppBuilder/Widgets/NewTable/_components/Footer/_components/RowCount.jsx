import React, { memo } from 'react';
import useTableStore from '../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';

export const RowCount = memo(({ dataLength, id }) => {
  const enablePagination = useTableStore((state) => state.getTableProperties(id)?.enablePagination, shallow);
  const clientSidePagination = useTableStore((state) => state.getTableProperties(id)?.clientSidePagination, shallow);
  const serverSidePagination = useTableStore((state) => state.getTableProperties(id)?.serverSidePagination, shallow);
  const totalRecords = useTableStore((state) => state.getTableProperties(id)?.totalRecords, shallow);
  const showRecordCount = useTableStore((state) => state.getTableProperties(id)?.showRecordCount, shallow);

  // Tables saved before "Show record count" existed have no value: keep their old rule exactly
  if (showRecordCount === undefined) {
    return (
      <span
        data-cy={`footer-number-of-records`}
        className="font-weight-400"
        style={{ color: 'var(--cc-primary-text)' }}
      >
        {clientSidePagination && !serverSidePagination && `${dataLength} Records`}
        {serverSidePagination && totalRecords ? `${totalRecords} Records` : ''}
      </span>
    );
  }

  const serverSideCount = enablePagination && serverSidePagination;
  return (
    <span data-cy={`footer-number-of-records`} className="font-weight-400" style={{ color: 'var(--cc-primary-text)' }}>
      {showRecordCount && !serverSideCount && `${dataLength} Records`}
      {showRecordCount && serverSideCount && totalRecords ? `${totalRecords} Records` : ''}
    </span>
  );
});
