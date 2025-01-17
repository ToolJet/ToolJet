import React from 'react';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Loader from '../Loader';
import useTableStore from '../../_stores/tableStore';
import { flexRender } from '@tanstack/react-table';

export const TableHeader = ({ id, table }) => {
  const { getLoadingState } = useTableStore();
  const loadingState = getLoadingState(id);

  if (loadingState) {
    return (
      <div className="w-100">
        <Loader />
      </div>
    );
  }

  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id} className="tr">
          {headerGroup.headers.map((header) => {
            const isResizing = header.column.getIsResizing();
            const isSorted = header.column.getIsSorted();

            return (
              <th
                key={header.id}
                className={cx('th tj-text-xsm font-weight-400', {
                  'resizing-column': isResizing,
                  'has-actions': header.column.columnDef.header === 'Actions',
                  'selector-header': header.column.columnDef.type === 'selector',
                })}
                style={{
                  width: header.getSize(),
                }}
              >
                <div
                  className={cx('d-flex justify-content-between custom-gap-12', {
                    'd-flex justify-content-center w-100': header.column.columnDef.type === 'selector',
                  })}
                  onClick={header.column.getCanSort() ? () => header.column.toggleSorting() : undefined}
                  style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                >
                  <div className="header-text">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </div>
                  {isSorted && (
                    <div>
                      <SolidIcon name={isSorted === 'desc' ? 'arrowdown' : 'arrowup'} width="16" height="16" />
                    </div>
                  )}
                </div>
                {header.column.getCanResize() && (
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={cx('resizer', { isResizing })}
                  />
                )}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
};
