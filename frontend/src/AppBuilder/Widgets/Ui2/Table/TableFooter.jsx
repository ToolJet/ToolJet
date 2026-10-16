import React from 'react';
import { Button, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Pager } from '@/AppBuilder/Widgets/Ui2/_shared/Pager';
import { MUTED } from './TableCells';

export const TableFooter = ({
  properties,
  isLoading,
  isDisabled,
  pendingEdits,
  discard,
  fireEvent,
  bulk,
  selected,
  serverPaging,
  processed,
  paged,
  goTo,
}) => (
  <>
    {pendingEdits > 0 && properties.showBulkUpdateActions !== false ? (
      <div className="flex items-center justify-between gap-2 rounded-md border border-dashed px-3 py-2">
        <span className={cn('text-sm', MUTED)}>
          {pendingEdits} {pendingEdits === 1 ? 'row' : 'rows'} changed
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => discard()} disabled={isDisabled}>
            Discard
          </Button>
          <Button size="sm" onClick={() => fireEvent('onBulkUpdate')} disabled={isDisabled}>
            Save changes
          </Button>
        </div>
      </div>
    ) : null}

    {(properties.showRowCount !== false || properties.enablePagination !== false) && !isLoading ? (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cn('text-xs tabular-nums', MUTED)}>
          {properties.showRowCount === false
            ? ''
            : bulk && selected.size
            ? `${selected.size} of ${
                serverPaging ? Number(properties.totalRecords) || processed.length : processed.length
              } selected`
            : `${
                serverPaging && Number(properties.totalRecords) ? Number(properties.totalRecords) : processed.length
              } ${
                (serverPaging && Number(properties.totalRecords)
                  ? Number(properties.totalRecords)
                  : processed.length) === 1
                  ? 'row'
                  : 'rows'
              }`}
        </span>
        {properties.enablePagination !== false &&
        (paged.pageCount === null || paged.pageCount > 1 || paged.page > 1) ? (
          <Pager
            page={paged.page}
            pageCount={paged.pageCount}
            hasPrevious={paged.hasPrevious}
            hasNext={paged.hasNext}
            disabled={isDisabled}
            onPage={(p) => goTo(p)}
          />
        ) : null}
      </div>
    ) : null}
  </>
);
