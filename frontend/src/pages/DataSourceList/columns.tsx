import React from 'react';
import moment from 'moment';

import type { DataTableColumn } from '@/pages/components/DataTable/types';
import type { DataSourceListItem } from '@/_services/types/globalDatasource.types';
import DataSourceNameCell from './DataSourceNameCell';

// "1 hour ago" / "Yesterday" / "3 days ago" / "2 weeks ago", then an absolute date after a month.
export function formatLastModified(isoDate: string): string {
  const date = moment(isoDate);
  const calendarDaysAgo = moment().startOf('day').diff(date.clone().startOf('day'), 'days');
  if (calendarDaysAgo === 1) return 'Yesterday';
  if (calendarDaysAgo < 30) return moment.duration(date.diff(moment())).humanize(true, { h: 24, d: 7, w: 4 });
  return date.format('MMM D, YYYY');
}

export const dataSourceColumns: DataTableColumn<DataSourceListItem>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    // Matches the apps list: below 328px the Name column stops shrinking and the table scrolls sideways.
    meta: { width: 'minmax(328px, 464px)', docked: true },
    // Only folder child tables pass `meta.depth: 1`.
    cell: ({ row, table }) => (
      <DataSourceNameCell row={row} depth={(table.options.meta as { depth?: number } | undefined)?.depth ?? 0} />
    ),
  },
  {
    id: 'lastModified',
    header: 'Last modified',
    accessorKey: 'last_modified_at',
    meta: { width: '160px' },
    cell: ({ getValue }) => formatLastModified(getValue<string>()),
  },
  {
    id: 'modifiedBy',
    header: 'Modified by',
    accessorFn: (item) => item.modified_by?.name ?? '',
    meta: { width: '160px' },
    cell: ({ getValue }) => getValue<string>(),
  },
  {
    id: 'owner',
    header: 'Owner',
    accessorFn: (item) => item.owner?.name ?? '',
    meta: { width: '160px' },
    cell: ({ getValue }) => getValue<string>(),
  },
];

// Kind-prefixed because folder and data source ids may come from different tables.
export const getDataSourceRowId = (item: DataSourceListItem): string => `${item.kind}:${item.id}`;
