import React from 'react';
import moment from 'moment';

import TruncatedText from '@/components/ui/Rocket/Tooltip/TruncatedText';
import ItemNameCell from './ItemNameCell';
import { RowMenuButton } from './RowHoverActions';

// "1 hour ago" / "Yesterday" / "3 days ago" / "2 weeks ago", then an absolute date after a month.
function formatLastModified(isoDate) {
  const date = moment(isoDate);
  const calendarDaysAgo = moment().startOf('day').diff(date.clone().startOf('day'), 'days');
  if (calendarDaysAgo === 1) return 'Yesterday';
  if (calendarDaysAgo < 30) return moment.duration(date.diff(moment())).humanize(true, { h: 24, d: 7, w: 4 });
  return date.format('MMM D, YYYY');
}

// Info columns keep a fixed width, so overflowing values truncate and show the full text in a tooltip.
const renderTruncatedText = (text) => (
  <TruncatedText as="span" className="tw-block" content={text}>
    {text}
  </TruncatedText>
);

// `meta.width` is a CSS grid track shared by header and rows so columns stay aligned.
// `meta.sortField` matches the sort value prefix (e.g. `modified` in `modified_desc`) to show the header sort icon.
export const columns = [
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    meta: { width: 'minmax(0, 1fr)', sortField: 'name' },
    // Folder child tables pass `meta.depth: 1`; the root table has no meta.
    cell: ({ row, table }) => <ItemNameCell row={row} depth={table.options.meta?.depth ?? 0} />,
  },
  {
    id: 'lastModified',
    header: 'Last modified',
    accessorKey: 'updated_at',
    meta: { width: '160px', sortField: 'modified' },
    cell: ({ getValue }) => renderTruncatedText(formatLastModified(getValue())),
  },
  {
    id: 'modifiedBy',
    header: 'Modified by',
    accessorFn: (item) => item.modified_by?.name,
    meta: { width: '160px' },
    cell: ({ getValue }) => renderTruncatedText(getValue()),
  },
  {
    id: 'owner',
    header: 'Owner',
    accessorFn: (item) => item.owner?.name,
    meta: { width: '160px' },
    cell: ({ getValue }) => renderTruncatedText(getValue()),
  },
  {
    id: 'releasedVersion',
    header: 'Released version',
    // Folders have no version, so they stay blank instead of showing the unreleased dash.
    accessorFn: (item) => (item.kind === 'app' ? (item.released_version?.name ?? '-') : ''),
    meta: { width: '160px' },
    cell: ({ getValue }) => renderTruncatedText(getValue()),
  },
  {
    id: 'actions',
    header: () => <span className="tw-sr-only">Actions</span>,
    meta: { width: '28px' },
    cell: ({ row }) => <RowMenuButton itemName={row.original.name} />,
  },
];

// Kind-prefixed because folder and app ids come from different tables and may collide.
export const getRowId = (item) => `${item.kind}:${item.id}`;

export const GRID_TEMPLATE_COLUMNS = columns.map((column) => column.meta.width).join(' ');
