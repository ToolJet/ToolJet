import React, { memo } from 'react';
import useTableStore from '../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';

export const RowCount = memo(({ dataLength, id }) => {
  const clientSidePagination = useTableStore((state) => state.getTableProperties(id)?.clientSidePagination, shallow);
  const serverSidePagination = useTableStore((state) => state.getTableProperties(id)?.serverSidePagination, shallow);
  const totalRecords = useTableStore((state) => state.getTableProperties(id)?.totalRecords, shallow);

  return (
    <span data-cy={`footer-number-of-records`} className="font-weight-500" style={{ color: 'var(--text-placeholder)' }}>
      {clientSidePagination && !serverSidePagination && `${dataLength} Records`}
      {serverSidePagination && totalRecords ? `${totalRecords} Records` : ''}
    </span>
  );
});
