import React from 'react';
import { Button, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Pager } from '@/AppBuilder/Widgets/Ui2/_shared/Pager';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { MUTED } from './TableCells';
import type { Entry, FireOption, Paged } from './types';

interface TableFooterProps {
  properties: Resolved;
  isLoading: boolean;
  isDisabled: boolean;
  pendingEdits: number;
  discard: (options?: FireOption) => void;
  fireEvent: WidgetProps['fireEvent'];
  bulk: boolean;
  selected: Set<string>;
  serverPaging: boolean;
  processed: Entry[];
  paged: Paged;
  goTo: (target: unknown) => void;
}

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
}: TableFooterProps) => (
  <>
    {pendingEdits > 0 && properties.showBulkUpdateActions !== false ? (
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-rounded-ui2-md tw-border tw-border-dashed tw-px-3 tw-py-2">
        <span className={cn('tw-text-ui2-sm', MUTED)}>
          {pendingEdits} {pendingEdits === 1 ? 'row' : 'rows'} changed
        </span>
        <div className="tw-flex tw-gap-2">
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
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
        <span className={cn('tw-text-xs tw-tabular-nums', MUTED)}>
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
