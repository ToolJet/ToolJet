// ponytail: ported from the apps dashboard; dedupe once that lands on main
import React, { useMemo, useState } from 'react';
import { CircleAlert, Copy, Eye, EyeClosed, GripVertical, Pin, SquarePen } from 'lucide-react';
import {
  Button,
  Checkbox,
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
import Tooltip from '@/components/ui/Rocket/Tooltip';
import { cn } from '@/lib/utils';
import { copyConstantReference } from '../helpers/constantReference';
import { canReorderPins, orderRows } from '../helpers/pinOrder';
import ConstantsEmptyState from './ConstantsEmptyState';
import DeleteConstantsDialog from './DeleteConstantsDialog';
import { PinReorderProvider, useSortableRow } from './PinReorder';
import RowActionsMenu from './RowActionsMenu';

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

// Figma: the name is body/large in text/default; every other cell is body/default in text/placeholder.
const cellClass = (index) =>
  cn('tw-h-10 tw-px-0 tw-py-0 tw-truncate', index === 0 ? 'tw-pl-8' : 'tw-font-body-default tw-text-text-placeholder');

const noop = () => {};

// A zero-width leading cell holds the selection gutter, which hangs into the page's 70px left padding so the Name
// column keeps its position.
// Heights are set because Rocket's cell defaults (52px body, 40px header) are taller than the rows around them.
const GUTTER_CELL_CLASS = 'tw-relative tw-w-0 tw-p-0';
const BODY_GUTTER_CELL_CLASS = cn(GUTTER_CELL_CLASS, 'tw-h-10');
const HEADER_GUTTER_CELL_CLASS = cn(GUTTER_CELL_CLASS, 'tw-h-9');
const GUTTER_CLASS =
  'tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-w-[70px] tw-items-center tw-justify-end tw-gap-1 tw-pr-2';
// Opacity rather than display, so a hidden control stays reachable by keyboard.
const REVEAL_ON_HOVER_CLASS =
  'tw-opacity-0 focus-visible:tw-opacity-100 group-hover:tw-opacity-100 group-has-[[data-state=open]]:tw-opacity-100';
// The dragged row keeps its hover look and its handle while it is moving.
const REVEAL_WHILE_DRAGGING_CLASS = 'group-data-[dragging=true]:tw-opacity-100';
const PIN_DIVIDER_CLASS = '[&>td]:tw-border-0 [&>td]:tw-border-b [&>td]:tw-border-solid [&>td]:tw-border-border-weak';
// 2px accent line on one edge of the row under the drag, drawn as a pseudo-element so no row moves.
const DROP_LINE_CLASSES = {
  before:
    "before:tw-absolute before:tw-inset-x-0 before:tw--top-px before:tw-z-[2] before:tw-h-0.5 before:tw-bg-border-accent-strong before:tw-content-['']",
  after:
    "after:tw-absolute after:tw-inset-x-0 after:tw-bottom-0 after:tw-z-[2] after:tw-h-0.5 after:tw-bg-border-accent-strong after:tw-content-['']",
};

const isSelectable = (item) => item.source !== 'env';

function TableHeaderRow({ selectState, onToggleAll, hasSelection, showSelectAll }) {
  return (
    <TableHeader className="[&_th]:tw-border-b-0">
      <TableRow className="tw-group hover:tw-bg-transparent">
        <TableHead className={HEADER_GUTTER_CELL_CLASS}>
          {showSelectAll && (
            <div className={GUTTER_CLASS}>
              <span className="tw-flex tw-size-5 tw-items-center tw-justify-center">
                <Checkbox
                  checked={selectState.checked}
                  disabled={selectState.disabled}
                  onCheckedChange={onToggleAll}
                  aria-label="Select all"
                  className={cn(!hasSelection && REVEAL_ON_HOVER_CLASS)}
                />
              </span>
            </div>
          )}
        </TableHead>
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
      <TableCell className={BODY_GUTTER_CELL_CLASS} />
      {COLUMNS.map(({ key, skeleton }, index) => (
        <TableCell key={key} className={cellClass(index)}>
          <Skeleton className={cn('tw-h-3.5 tw-max-w-full tw-rounded', skeleton)} />
        </TableCell>
      ))}
    </TableRow>
  ));
}

// Revealed with the row's hover, focus or open menu; opacity rather than display keeps the buttons keyboard-reachable.
const REVEAL_ACTIONS_CLASS =
  'tw-opacity-0 group-hover:tw-opacity-100 group-focus-within:tw-opacity-100 group-has-[[data-state=open]]:tw-opacity-100';

// Secrets are always masked and have no eye, so the spacer keeps their text in line with the Globals column.
function ValueCell({ item }) {
  const [revealed, setRevealed] = useState(false);
  const isSecret = item.type === 'Secret';
  const text = !revealed ? SECRET_MASK : (item.value ?? EMPTY_CELL);

  return (
    <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2.5">
      {isSecret ? (
        <span aria-hidden className="tw-size-7 tw-shrink-0" />
      ) : (
        <Button
          variant="ghost"
          iconOnly
          size="medium"
          className="tw-shrink-0"
          aria-label={`${revealed ? 'Hide' : 'Show'} value of ${item.name}`}
          aria-pressed={revealed}
          onClick={() => setRevealed((current) => !current)}
        >
          {revealed ? (
            <Eye size={14} className="tw-text-icon-default" />
          ) : (
            <EyeClosed size={14} className="tw-text-icon-default" />
          )}
        </Button>
      )}
      {/* The title would otherwise leak a masked value. */}
      <span title={revealed ? text : undefined} className="tw-truncate tw-font-body-default tw-text-text-placeholder">
        {text}
      </span>
    </div>
  );
}

// `onEdit` loads the constant and opens the page's edit modal; the button is busy until it settles.
function RowActions({ item, variant, isPinned, onEdit, onTogglePin, onDelete }) {
  const [loadingEdit, setLoadingEdit] = useState(false);
  const isEnv = item.source === 'env';

  const edit = async () => {
    setLoadingEdit(true);
    try {
      await onEdit(item);
    } finally {
      setLoadingEdit(false);
    }
  };

  return (
    <div className={cn('tw-flex tw-shrink-0 tw-items-center tw-gap-[7px]', REVEAL_ACTIONS_CLASS)}>
      <Tooltip content={isEnv ? 'Defined in .env. Edit it there.' : undefined} isTooltipForInteractiveDisabledElement>
        <Button
          variant="outline"
          size="medium"
          className="tw-border-border-accent-weak"
          leadingVisual={<SquarePen size={14} />}
          aria-label={`Edit ${item.name}`}
          disabled={isEnv}
          loading={loadingEdit}
          onClick={edit}
        >
          Edit
        </Button>
      </Tooltip>
      <Button
        variant="outline"
        size="medium"
        iconOnly
        aria-label={`Copy reference to ${item.name}`}
        onClick={() => copyConstantReference(item)}
      >
        <Copy size={14} className="tw-text-icon-strong" />
      </Button>
      <RowActionsMenu item={item} variant={variant} isPinned={isPinned} onTogglePin={onTogglePin} onDelete={onDelete} />
    </div>
  );
}

function ConstantRow({
  item,
  variant,
  isPinned,
  isLastPinned,
  isSelected,
  hasSelection,
  onSelectedChange,
  onEdit,
  onTogglePin,
  onDelete,
}) {
  const { rowRef, dragHandle, isDragging, dropSide } = useSortableRow(item.id, isPinned);
  const cells = [
    item.name,
    // Rendered by ValueCell, which owns the mask.
    null,
    formatDate(item.last_modified_at),
    item.modified_by?.name ?? EMPTY_CELL,
    item.owner?.name ?? EMPTY_CELL,
    SOURCE_LABELS[item.source] ?? EMPTY_CELL,
  ];

  return (
    // A plain <tr> with TableRow's hover styling: Rocket's TableRow drops `ref` (React 18, shadcn row is not a
    // forwardRef), and drag and drop needs the row element.
    <tr
      ref={rowRef}
      data-row-id={item.id}
      data-dragging={isDragging || undefined}
      data-drop-side={dropSide}
      data-pin-divider={isLastPinned || undefined}
      className={cn(
        'tw-group tw-relative tw-transition-colors hover:tw-bg-interactive-hover has-[[data-state=open]]:tw-bg-interactive-hover data-[dragging=true]:tw-bg-interactive-hover',
        isLastPinned && PIN_DIVIDER_CLASS,
        dropSide && DROP_LINE_CLASSES[dropSide]
      )}
    >
      <TableCell className={BODY_GUTTER_CELL_CLASS}>
        <div className={GUTTER_CLASS}>
          {dragHandle && (
            <button
              type="button"
              ref={dragHandle.ref}
              {...dragHandle.attributes}
              {...dragHandle.listeners}
              aria-label={`Reorder ${item.name}`}
              className={cn(
                'tw-flex tw-size-5 tw-cursor-grab tw-items-center tw-justify-center tw-rounded tw-border-0 tw-bg-transparent tw-p-0',
                REVEAL_ON_HOVER_CLASS,
                REVEAL_WHILE_DRAGGING_CLASS,
                'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline'
              )}
            >
              <GripVertical size={12} className="tw-text-icon-default" />
            </button>
          )}
          <span className="tw-flex tw-size-5 tw-items-center tw-justify-center">
            <Checkbox
              checked={isSelected}
              disabled={!isSelectable(item)}
              onCheckedChange={(checked) => onSelectedChange(checked === true)}
              aria-label={`Select ${item.name}`}
              className={cn(!hasSelection && REVEAL_ON_HOVER_CLASS)}
            />
          </span>
        </div>
      </TableCell>
      {cells.map((content, index) => {
        const { key } = COLUMNS[index];
        if (key === 'name') {
          return (
            <TableCell key={key} className={cn(cellClass(index), 'tw-rounded-l-[10px]')}>
              <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-pr-2">
                <span title={content} className="tw-min-w-0 tw-truncate tw-font-body-large tw-text-text-default">
                  {content}
                </span>
                {isPinned && (
                  <span role="img" aria-label="Pinned" className="tw-flex tw-shrink-0">
                    <Pin aria-hidden size={12} className="tw-text-icon-weak" />
                  </span>
                )}
                <RowActions
                  item={item}
                  variant={variant}
                  isPinned={isPinned}
                  onEdit={onEdit}
                  onTogglePin={onTogglePin}
                  onDelete={onDelete}
                />
              </div>
            </TableCell>
          );
        }
        if (key === 'value') {
          return (
            <TableCell key={key} className={cellClass(index)}>
              <ValueCell item={item} />
            </TableCell>
          );
        }
        return (
          <TableCell key={key} className={cellClass(index)} title={String(content)}>
            {content}
          </TableCell>
        );
      })}
    </tr>
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

function ConstantsGrid({
  items,
  isLoading,
  variant,
  searchKey,
  isSourceFiltered,
  pinnedIds,
  rowSelection,
  onSelectionChange,
  onPin,
  onUnpin,
  onMovePin,
  onEdit,
  onDelete,
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Pinned rows lead, then the rest in server order. Only the loaded page is ordered; a pin on another page waits
  // until its row is loaded.
  const { rows, pinnedCount } = useMemo(() => orderRows(items, pinnedIds), [items, pinnedIds]);
  const pinnedRows = useMemo(
    () => rows.slice(0, pinnedCount).map(({ id, name }) => ({ id, name })),
    [rows, pinnedCount]
  );
  const canReorder = canReorderPins({ searchKey, isSourceFiltered, pinnedRowCount: pinnedCount });

  const selectable = rows.filter(isSelectable);
  const selectedCount = selectable.filter((item) => rowSelection[item.id]).length;
  const hasSelection = Object.values(rowSelection).some(Boolean);
  const selectState = {
    checked: selectedCount === 0 ? false : selectedCount === selectable.length ? true : 'indeterminate',
    disabled: selectable.length === 0,
  };

  const toggleAll = (checked) =>
    onSelectionChange(checked === true ? Object.fromEntries(selectable.map((item) => [item.id, true])) : {});

  const toggleRow = (id, checked) => {
    const next = { ...rowSelection };
    if (checked) next[id] = true;
    else delete next[id];
    onSelectionChange(next);
  };

  return (
    // Rocket's table wrapper clips horizontally, which would cut off the selection gutter hanging into the page padding.
    <div className="[&_[data-slot=table-container]]:tw-overflow-visible">
      <PinReorderProvider pinnedRows={pinnedRows} isEnabled={canReorder} onMove={onMovePin}>
        <Table aria-busy={isLoading} className="tw-table-fixed">
          <TableHeaderRow
            selectState={selectState}
            onToggleAll={toggleAll}
            hasSelection={hasSelection}
            showSelectAll={!isLoading}
          />
          <TableBody>
            {isLoading ? (
              <SkeletonRows />
            ) : (
              rows.map((item, index) => {
                const isPinned = index < pinnedCount;
                return (
                  <ConstantRow
                    key={item.id}
                    item={item}
                    variant={variant}
                    isPinned={isPinned}
                    // A divider only separates pinned rows from the rows that follow them.
                    isLastPinned={isPinned && index === pinnedCount - 1 && pinnedCount < rows.length}
                    isSelected={Boolean(rowSelection[item.id])}
                    hasSelection={hasSelection}
                    onSelectedChange={(checked) => toggleRow(item.id, checked)}
                    onEdit={onEdit}
                    onTogglePin={() => (isPinned ? onUnpin([item.id]) : onPin([item.id]))}
                    onDelete={() => setDeleteTarget(item)}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </PinReorderProvider>
      {deleteTarget && (
        <DeleteConstantsDialog
          open
          constants={[deleteTarget.name]}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onConfirm={() => onDelete([deleteTarget.id])}
        />
      )}
    </div>
  );
}

// Presentational: the caller owns fetching and passes the list store's `status` and `items`, plus the selection and
// pin state with the handlers that change it. `idle` (before the first fetch) renders as loading so the empty state
// never flashes.
export default function ConstantsTable({
  items,
  status,
  variant,
  searchKey,
  isSourceFiltered = false,
  pinnedIds = [],
  rowSelection = {},
  onSelectionChange = noop,
  onPin = noop,
  onUnpin = noop,
  onMovePin = noop,
  onEdit = noop,
  onDelete = noop,
  onCreate,
  onRetry,
}) {
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
    <ConstantsGrid
      items={items}
      isLoading={isLoading}
      variant={variant}
      searchKey={searchKey}
      isSourceFiltered={isSourceFiltered}
      pinnedIds={pinnedIds}
      rowSelection={rowSelection}
      onSelectionChange={onSelectionChange}
      onPin={onPin}
      onUnpin={onUnpin}
      onMovePin={onMovePin}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
