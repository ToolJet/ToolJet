import React from 'react';
import { CircleAlert } from 'lucide-react';
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Rocket';
import { cn } from '@/lib/utils';
import ConstantsEmptyState from './ConstantsEmptyState';

const SKELETON_ROW_COUNT = 8;
const SECRET_MASK = '********';
const EMPTY_CELL = '-';

const SOURCE_LABELS = { workspace: 'Workspace', env: 'Environment' };

// Source takes the remaining width; the rest are fixed. `skeleton` is the loading bar width for the column.
const COLUMNS = [
  { key: 'name', label: 'Name', width: 'tw-w-[365px]', skeleton: 'tw-w-[280px]' },
  { key: 'value', label: 'Value', width: 'tw-w-[224px]', skeleton: 'tw-w-[120px]' },
  { key: 'lastModified', label: 'Last modified', width: 'tw-w-[160px]', skeleton: 'tw-w-24' },
  { key: 'modifiedBy', label: 'Modified by', width: 'tw-w-[160px]', skeleton: 'tw-w-20' },
  { key: 'owner', label: 'Owner', width: 'tw-w-[160px]', skeleton: 'tw-w-24' },
  { key: 'source', label: 'Source', width: '', skeleton: 'tw-w-20' },
];

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : EMPTY_CELL;

const cellClass = (index) => cn('tw-h-10 tw-px-0 tw-py-0 tw-truncate', index === 0 && 'tw-pl-8');

function TableHeaderRow() {
  return (
    <TableHeader className="[&_th]:tw-border-b-0">
      <TableRow className="hover:tw-bg-transparent">
        {COLUMNS.map(({ key, label, width }, index) => (
          <TableHead
            key={key}
            className={cn(
              'tw-h-9 tw-bg-background-surface-layer-02 tw-px-0 tw-font-title-default tw-text-text-default',
              index === 0 && 'tw-rounded-l-md tw-pl-8',
              index === COLUMNS.length - 1 && 'tw-rounded-r-md',
              width
            )}
          >
            {label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

function SkeletonRows() {
  return Array.from({ length: SKELETON_ROW_COUNT }, (_, row) => (
    <TableRow key={row} data-testid="constants-skeleton-row" className="hover:tw-bg-transparent">
      {COLUMNS.map(({ key, skeleton }, index) => (
        <TableCell key={key} className={cellClass(index)}>
          <Skeleton className={cn('tw-h-3.5 tw-max-w-full tw-rounded', skeleton)} />
        </TableCell>
      ))}
    </TableRow>
  ));
}

function ConstantRow({ item }) {
  const value = item.type === 'Secret' ? SECRET_MASK : (item.value ?? EMPTY_CELL);
  const cells = [
    item.name,
    value,
    formatDate(item.last_modified_at),
    item.modified_by?.name ?? EMPTY_CELL,
    item.owner?.name ?? EMPTY_CELL,
    SOURCE_LABELS[item.source] ?? EMPTY_CELL,
  ];
  return (
    <TableRow>
      {cells.map((content, index) => (
        <TableCell key={COLUMNS[index].key} className={cellClass(index)} title={String(content)}>
          {content}
        </TableCell>
      ))}
    </TableRow>
  );
}

function ErrorState({ onRetry }) {
  return (
    <Empty size="small" className="tw-px-4 tw-py-10">
      <EmptyMedia variant="icon" className="tw-mb-0">
        <CircleAlert className="tw-size-5" />
      </EmptyMedia>
      <EmptyHeader className="tw-max-w-none tw-gap-0.5">
        <EmptyTitle>Couldn&apos;t load constants</EmptyTitle>
        <EmptyDescription>Something went wrong while fetching the list.</EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent className="tw-mt-1">
          <Button variant="outline" size="medium" className="tw-border-border-accent-weak" onClick={onRetry}>
            Try again
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

// Presentational: the caller owns fetching and passes the list store's `status` and `items`.
// `idle` (before the first fetch) renders as loading so the empty state never flashes.
export default function ConstantsTable({ items, status, variant, searchKey, onCreate, onRetry }) {
  if (status === 'error') return <ErrorState onRetry={onRetry} />;

  const isLoading = status === 'idle' || status === 'loading';
  if (!isLoading && items.length === 0) {
    return (
      <ConstantsEmptyState
        variant={searchKey ? 'search' : variant === 'Secret' ? 'secret' : 'global'}
        query={searchKey}
        onCreate={onCreate}
      />
    );
  }

  return (
    <Table aria-busy={isLoading} className="tw-table-fixed">
      <TableHeaderRow />
      <TableBody>
        {isLoading ? <SkeletonRows /> : items.map((item) => <ConstantRow key={item.id} item={item} />)}
      </TableBody>
    </Table>
  );
}
