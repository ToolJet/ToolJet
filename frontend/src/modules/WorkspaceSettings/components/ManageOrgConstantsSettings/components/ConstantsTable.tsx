// ponytail: ported from the apps dashboard; dedupe once that lands on main
import React, { Fragment, useMemo, useRef, useState } from 'react';
import type { OnChangeFn, RowSelectionState } from '@tanstack/react-table';
import { CircleAlert, Copy, Eye, EyeClosed, GripVertical, Info, Pin, SquarePen } from 'lucide-react';
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
import TruncatedText from '@/components/ui/Rocket/Tooltip/TruncatedText';
import { cn } from '@/lib/utils';
import moment from 'moment';
import type { ConstantListItem, ConstantSource } from '@/_services/types/organizationConstantsV2.types';
import type { ConstantsListStatus } from '@/_stores/types/constantsListStore';
import {
  ENV_CONSTANT_TOOLTIP,
  ENV_CONSTANT_TOOLTIP_CLASSES,
  SECRET_VALUE_TOOLTIP,
  SECRET_MASK,
} from '../helpers/constants';
import { ConstantTypes, type ConstantType } from '../helpers/constantType';
import { copyConstantReference } from '../helpers/constantReference';
import { highlightMatch } from '../helpers/highlightMatch';
import { canReorderPins, orderRows } from '../helpers/pinOrder';
import ConstantsEmptyState from './ConstantsEmptyState';
import DeleteConstantsDialog from './DeleteConstantsDialog';
import { PinDropIndicator, PinReorderProvider, useSortableRow } from './PinReorder';
import RowActionsMenu from './RowActionsMenu';

const SKELETON_ROW_COUNT = 8;
const EMPTY_CELL = '-';

const SOURCE_LABELS: Record<ConstantSource, string> = { workspace: 'Workspace', env: '.env' };

// Source takes the remaining width; the rest are fixed. `skeleton` is the loading bar width for the column.
const COLUMNS: { key: string; label: string; width: string; skeleton: string }[] = [
  { key: 'name', label: 'Name', width: 'tw-w-[365px]', skeleton: 'tw-w-[280px]' },
  { key: 'value', label: 'Value', width: 'tw-w-[224px]', skeleton: 'tw-w-[120px]' },
  { key: 'lastModified', label: 'Last modified', width: 'tw-w-[160px]', skeleton: 'tw-w-24' },
  { key: 'modifiedBy', label: 'Modified by', width: 'tw-w-[160px]', skeleton: 'tw-w-20' },
  { key: 'owner', label: 'Owner', width: 'tw-w-[160px]', skeleton: 'tw-w-24' },
  { key: 'source', label: 'Source', width: '', skeleton: 'tw-w-20' },
];

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : EMPTY_CELL;

// Figma shows "2 days ago"; the exact date is the cell's tooltip.
const formatRelative = (value: string | null) => (value ? moment(value).fromNow() : EMPTY_CELL);

// Figma: the name is body/large in text/default; every other cell is body/default in text/placeholder.
const cellClass = (index: number) =>
  cn('tw-h-10 tw-px-0 tw-py-0 tw-truncate', index === 0 ? 'tw-pl-8' : 'tw-font-body-default tw-text-text-placeholder');

const noop = () => {};
const noopAsync = async () => {};

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

// Figma: a 12px band between the pinned rows and the rest, with a straight 1px line across the content width.
// It is its own row. As a border on the last pinned row, the line would follow that row's rounded corner.
function PinDivider() {
  return (
    <tr aria-hidden="true" data-testid="pin-divider">
      <td colSpan={COLUMNS.length + 1} className="tw-h-3 tw-p-0 tw-align-middle">
        <div data-testid="pin-divider-line" className="tw-h-px tw-bg-border-weak" />
      </td>
    </tr>
  );
}

type SelectState = { checked: boolean | 'indeterminate'; disabled: boolean };

interface TableHeaderRowProps {
  selectState: SelectState;
  onToggleAll: (checked: boolean | 'indeterminate') => void;
  hasSelection: boolean;
  showSelectAll: boolean;
}

function TableHeaderRow({ selectState, onToggleAll, hasSelection, showSelectAll }: TableHeaderRowProps) {
  return (
    <TableHeader className="tw-sticky tw-top-0 tw-z-10 tw-bg-background-surface-layer-01 [&_th]:tw-border-b-0">
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
  return (
    <>
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, row) => (
        <TableRow key={row} data-testid="constants-skeleton-row" className="hover:tw-bg-transparent">
          <TableCell className={BODY_GUTTER_CELL_CLASS} />
          {COLUMNS.map(({ key, skeleton }, index) => (
            <TableCell key={key} className={cellClass(index)}>
              <Skeleton className={cn('tw-h-3.5 tw-max-w-full tw-rounded', skeleton)} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// Revealed with the row's hover, focus or open menu; opacity rather than display keeps the buttons keyboard-reachable.
const REVEAL_ACTIONS_CLASS =
  'tw-opacity-0 group-hover:tw-opacity-100 group-focus-within:tw-opacity-100 group-has-[[data-state=open]]:tw-opacity-100';

// One icon button for both directions (Figma: filled when pinned, outline when not; hover and pressed fills are the
// interactive-hover and interactive-selected tokens). A pinned row always shows it; the
// others reveal it with the row's hover or focus.
function PinToggle({ name, isPinned, onToggle }: { name: string; isPinned: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={`${isPinned ? 'Unpin' : 'Pin'} ${name}`}
      onClick={onToggle}
      className={cn(
        'tw-flex tw-size-5 tw-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded tw-border-0 tw-bg-transparent tw-p-0',
        'hover:tw-bg-interactive-hover active:tw-bg-interactive-selected',
        'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline',
        !isPinned && REVEAL_ACTIONS_CLASS
      )}
    >
      <Pin
        aria-hidden
        size={12}
        fill={isPinned ? 'currentColor' : 'none'}
        className={isPinned ? 'tw-text-icon-default' : 'tw-text-icon-weak'}
      />
    </button>
  );
}

// Secrets are always masked and have no eye, so their value starts at the column edge.
function ValueCell({ item, environmentName }: { item: ConstantListItem; environmentName: string }) {
  const [revealed, setRevealed] = useState(false);
  const isSecret = item.type === ConstantTypes.Secret;
  const text = !revealed ? SECRET_MASK : (item.value ?? EMPTY_CELL);

  // Every constant is listed in every environment; one with nothing set here says so.
  if (item.has_value === false) {
    return (
      <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2.5">
        <span className="tw-flex tw-size-7 tw-shrink-0 tw-items-center tw-justify-center">
          <Info aria-hidden size={14} className="tw-text-icon-strong" />
        </span>
        <span className="tw-truncate tw-font-body-default tw-text-text-placeholder">
          No value in {environmentName || 'this environment'}
        </span>
      </div>
    );
  }

  // An .env Secret has no value in ToolJet, so a mask would imply one.
  if (isSecret && item.source === 'env') {
    return (
      <div className="tw-flex tw-min-w-0 tw-items-center">
        <Tooltip content={SECRET_VALUE_TOOLTIP} arrow classes={ENV_CONSTANT_TOOLTIP_CLASSES}>
          <span className="tw-inline-flex tw-items-center tw-gap-1 tw-whitespace-nowrap tw-rounded-full tw-bg-background-warning-weak tw-px-2 tw-py-0.5 tw-font-title-small tw-text-text-warning">
            <Info size={12} className="tw-shrink-0 tw-text-icon-warning" />
            Not stored in ToolJet
          </span>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2.5">
      {!isSecret && (
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
            <Eye size={14} className="tw-text-icon-strong" />
          ) : (
            <EyeClosed size={14} className="tw-text-icon-strong" />
          )}
        </Button>
      )}
      {/* The title would otherwise leak a masked value. */}
      <Tooltip content={isSecret ? SECRET_VALUE_TOOLTIP : undefined} arrow classes={ENV_CONSTANT_TOOLTIP_CLASSES}>
        <span title={revealed ? text : undefined} className="tw-truncate tw-font-body-default tw-text-text-placeholder">
          {text}
        </span>
      </Tooltip>
    </div>
  );
}

// `onEdit` loads the constant and opens the page's edit modal; the button is busy until it settles.
interface RowActionsProps {
  item: ConstantListItem;
  variant: ConstantType;
  onEdit: (item: ConstantListItem) => Promise<unknown> | void;
  onDelete: (opener: HTMLElement | null) => void;
}

function RowActions({ item, variant, onEdit, onDelete }: RowActionsProps) {
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
      <Tooltip
        content={isEnv ? ENV_CONSTANT_TOOLTIP : undefined}
        arrow
        classes={ENV_CONSTANT_TOOLTIP_CLASSES}
        isTooltipForInteractiveDisabledElement
      >
        <Button
          variant="secondary"
          size="medium"
          className="tw-text-text-default"
          leadingVisual={<SquarePen size={14} className="tw-text-icon-brand" />}
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
      <RowActionsMenu item={item} variant={variant} onDelete={onDelete} />
    </div>
  );
}

interface ConstantRowProps extends RowActionsProps {
  searchKey: string;
  environmentName: string;
  isPinned: boolean;
  onTogglePin: () => void;
  isSelected: boolean;
  hasSelection: boolean;
  onSelectedChange: (selected: boolean) => void;
}

function ConstantRow({
  item,
  variant,
  searchKey,
  environmentName,
  isPinned,
  isSelected,
  hasSelection,
  onSelectedChange,
  onEdit,
  onTogglePin,
  onDelete,
}: ConstantRowProps) {
  const { rowRef, dragHandle, isDragging } = useSortableRow(item.id, isPinned);
  const cells = [
    item.name,
    // Rendered by ValueCell, which owns the mask.
    null,
    formatRelative(item.last_modified_at),
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
      className={cn(
        'tw-group tw-relative tw-transition-colors hover:tw-bg-interactive-hover has-[[data-state=open]]:tw-bg-interactive-hover data-[dragging=true]:tw-bg-interactive-hover'
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
            <TableCell key={key} className={cn(cellClass(index), 'tw-rounded-l-large')}>
              <div className="tw-flex tw-min-w-0 tw-items-center">
                {/* Figma: the name block is at least 192px (after the cell's 8px inset) with 28px of space before the
                    actions, so for a short name Edit sits 224px from the row's content edge. */}
                <div className="tw-flex tw-min-w-48 tw-items-center tw-gap-2 tw-pr-7">
                  <TruncatedText
                    as="span"
                    content={content}
                    className="tw-min-w-0 tw-font-body-large tw-text-text-default"
                  >
                    {highlightMatch(content, searchKey).map((part, partIndex) =>
                      part.match ? (
                        <mark key={partIndex} className="tw-rounded-sm tw-bg-background-warning-weak tw-text-inherit">
                          {part.text}
                        </mark>
                      ) : (
                        part.text
                      )
                    )}
                  </TruncatedText>
                  <PinToggle name={item.name} isPinned={isPinned} onToggle={onTogglePin} />
                </div>
                <RowActions item={item} variant={variant} onEdit={onEdit} onDelete={onDelete} />
              </div>
            </TableCell>
          );
        }
        if (key === 'value') {
          return (
            <TableCell key={key} className={cellClass(index)}>
              <ValueCell item={item} environmentName={environmentName} />
            </TableCell>
          );
        }
        // People's names have no length limit, so they get the Rocket tooltip when they truncate.
        if (key === 'modifiedBy' || key === 'owner') {
          return (
            <TableCell key={key} className={cellClass(index)}>
              <TruncatedText as="span" content={content} className="tw-block">
                {content}
              </TruncatedText>
            </TableCell>
          );
        }
        return (
          <TableCell
            key={key}
            className={cellClass(index)}
            title={key === 'lastModified' ? formatDate(item.last_modified_at) : String(content)}
          >
            {content}
          </TableCell>
        );
      })}
    </tr>
  );
}

function ErrorState({ onRetry }: { onRetry?: () => void }) {
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

interface ConstantsTableProps {
  items: ConstantListItem[];
  status: ConstantsListStatus;
  /** The tab: which type of constant the list shows. */
  variant: ConstantType;
  searchKey: string;
  /** The viewed environment, for the "No value in …" text. */
  environmentName?: string;
  isSourceFiltered?: boolean;
  pinnedIds?: string[];
  rowSelection?: RowSelectionState;
  onSelectionChange?: OnChangeFn<RowSelectionState>;
  onPin?: (ids: string[]) => void;
  onUnpin?: (ids: string[]) => void;
  onMovePin?: (id: string, toIndex: number) => void;
  onEdit?: (item: ConstantListItem) => Promise<unknown> | void;
  onDelete?: (ids: string[]) => Promise<unknown>;
  onCreate?: () => void;
  onRetry?: () => void;
}

type ConstantsGridProps = Required<
  Pick<
    ConstantsTableProps,
    | 'items'
    | 'variant'
    | 'searchKey'
    | 'environmentName'
    | 'isSourceFiltered'
    | 'pinnedIds'
    | 'rowSelection'
    | 'onSelectionChange'
    | 'onPin'
    | 'onUnpin'
    | 'onMovePin'
    | 'onEdit'
    | 'onDelete'
  >
> & { isLoading: boolean };

function ConstantsGrid({
  items,
  isLoading,
  variant,
  searchKey,
  environmentName,
  isSourceFiltered,
  pinnedIds,
  rowSelection,
  onSelectionChange,
  onPin,
  onUnpin,
  onMovePin,
  onEdit,
  onDelete,
}: ConstantsGridProps) {
  const [deleteTarget, setDeleteTarget] = useState<ConstantListItem | null>(null);
  // The row menu closes before the dialog does, so the menu button is handed over to take focus back.
  const deleteOpener = useRef<HTMLElement | null>(null);

  // Pinned rows lead, then the rest in server order. Only the loaded page is ordered; a pin on another page waits
  // until its row is loaded.
  const { rows, pinnedCount } = useMemo(() => orderRows(items, pinnedIds), [items, pinnedIds]);
  const pinnedRows = useMemo(
    () => rows.slice(0, pinnedCount).map(({ id, name }) => ({ id, name })),
    [rows, pinnedCount]
  );
  const canReorder = canReorderPins({ searchKey, isSourceFiltered, pinnedRowCount: pinnedCount });
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCount = rows.filter((item) => rowSelection[item.id]).length;
  const hasSelection = Object.values(rowSelection).some(Boolean);
  const selectState: SelectState = {
    checked: selectedCount === 0 ? false : selectedCount === rows.length ? true : 'indeterminate',
    disabled: rows.length === 0,
  };

  const toggleAll = (checked: boolean | 'indeterminate') =>
    onSelectionChange(checked === true ? Object.fromEntries(rows.map((item) => [item.id, true])) : {});

  const toggleRow = (id: string, checked: boolean) => {
    const next = { ...rowSelection };
    if (checked) next[id] = true;
    else delete next[id];
    onSelectionChange(next);
  };

  return (
    // Rocket's table wrapper clips horizontally, which would cut off the selection gutter hanging into the page padding.
    <div ref={containerRef} className="tw-relative [&_[data-slot=table-container]]:tw-overflow-visible">
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
                  <Fragment key={item.id}>
                    <ConstantRow
                      item={item}
                      variant={variant}
                      searchKey={searchKey}
                      environmentName={environmentName}
                      isPinned={isPinned}
                      isSelected={Boolean(rowSelection[item.id])}
                      hasSelection={hasSelection}
                      onSelectedChange={(checked) => toggleRow(item.id, checked)}
                      onEdit={onEdit}
                      onTogglePin={() => (isPinned ? onUnpin([item.id]) : onPin([item.id]))}
                      onDelete={(opener) => {
                        deleteOpener.current = opener;
                        setDeleteTarget(item);
                      }}
                    />
                    {/* The divider only separates pinned rows from the rows that follow them. */}
                    {isPinned && index === pinnedCount - 1 && pinnedCount < rows.length && <PinDivider />}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
        <PinDropIndicator containerRef={containerRef} />
      </PinReorderProvider>
      {deleteTarget && (
        <DeleteConstantsDialog
          open
          constants={[deleteTarget.name]}
          onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
          onConfirm={() => onDelete([deleteTarget.id])}
          onCloseAutoFocus={(event) => {
            if (deleteOpener.current?.isConnected) {
              event.preventDefault();
              deleteOpener.current.focus();
            }
          }}
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
  environmentName = '',
  isSourceFiltered = false,
  pinnedIds = [],
  rowSelection = {},
  onSelectionChange = noop,
  onPin = noop,
  onUnpin = noop,
  onMovePin = noop,
  onEdit = noop,
  onDelete = noopAsync,
  onCreate,
  onRetry,
}: ConstantsTableProps) {
  if (status === 'error') return <ErrorState onRetry={onRetry} />;

  const isLoading = status === 'idle' || status === 'loading';
  if (!isLoading && items.length === 0) {
    return (
      <ConstantsEmptyState
        variant={searchKey ? 'search' : variant === ConstantTypes.Secret ? 'secret' : 'global'}
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
      environmentName={environmentName}
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
