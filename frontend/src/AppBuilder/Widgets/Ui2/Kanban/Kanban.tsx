import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import { useAutoHeight, useExposed, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { useOwnContextPath } from '@/AppBuilder/Widgets/Ui2/_shared/SubcontainerContext';
import { cn, getPortalRoot } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Spinner } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { ShowMore, useShownCount } from '@/AppBuilder/Widgets/Ui2/_shared/ShowMore';
import { addCard, boardCards, boardColumns, deleteCard, moveCard, updateCard } from './kanbanBoard';
import { KANBAN_INSTRUCTIONS, KANBAN_KEYS, kanbanAnnouncements, kanbanCoordinates } from './kanbanKeyboard';
import { SHADOWS, kanbanLook } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { fitsContentInView, kanbanCardHeight } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import type { BoardCard, BoardColumn, CardMove } from './kanbanBoard';
import { CardBody, CustomCardBody } from './KanbanCard';
import type { CardFields } from './KanbanCard';
import { KanbanColumn, MAX_BOARD_COLUMNS } from './KanbanColumn';
import { useBoardSize } from './useBoardSize';
import { useCustomCards } from './useCustomCards';
import { RIGHT_FADE, columnMinimum, fieldName, kanbanCollision, strip } from './kanbanLayout';
import { cssLength, isSet, list } from '@/AppBuilder/Widgets/Ui2/_shared/values';

/** What the board's actions read later, without going stale. */
interface KanbanLive {
  columns: BoardColumn[];
  setExposedVariable: WidgetProps['setExposedVariable'];
  fireEvent: WidgetProps['fireEvent'];
  statusField: string;
  idField: string;
}

/** What the board reads from the app store. */

// ToolJet UI 2.0 Kanban: a data-driven board. Columns are values of a status field and cards are rows
// of data shown by the fields the author maps (title, description, badge, tags, progress, meta, avatar), so an agent
// builds it from a query alone and a card shows more or less by mapping more or fewer fields. Dragging, the add and
// delete buttons and the actions change the board at once and publish the change (cards, the last added, moved,
// updated or removed card, and an event) for a query to save; the board follows the data again when the data
// changes. Own lazy chunk (dnd-kit).

export { columnMinimum, kanbanCollision } from './kanbanLayout';

export const ShadKanban = (props: WidgetProps) => {
  const { properties, styles, setExposedVariable, setExposedVariables, fireEvent } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  // Dynamic height off: the board keeps its drawn height and each column scrolls inside it.
  const fixed = !fitsContentInView(props.componentType ?? 'ShadKanban', properties);
  const statusField = fieldName(properties.statusField, 'status');
  const idField = fieldName(properties.idField, 'id');
  const fields: CardFields = {
    title: fieldName(properties.titleField, 'title'),
    description: fieldName(properties.descriptionField, ''),
    badge: fieldName(properties.badgeField, ''),
    tags: fieldName(properties.tagsField, ''),
    progress: fieldName(properties.progressField, ''),
    avatar: fieldName(properties.avatarField, ''),
    meta: fieldName(properties.metaField, ''),
    details: fieldName(properties.detailsField, ''),
  };
  const compact = properties.density === 'compact';
  const look = kanbanLook(styles);
  const fromData = useMemo(
    () => boardColumns(list(properties.data), list(properties.columns), statusField, idField),
    [properties.data, properties.columns, statusField, idField]
  );
  const [columns, setColumns] = useState(fromData);
  useEffect(() => setColumns(fromData), [fromData]);
  // The selection is kept by card key and read from the current board, so a data refresh re-publishes the fresh card
  // and a removed card clears it (README, "Selection after a data change").
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selected = useMemo(
    () => (selectedKey === null ? null : columns.flatMap((c) => c.cards).find((c) => c.__key === selectedKey) ?? null),
    [columns, selectedKey]
  );
  useEffect(() => {
    if (selectedKey !== null && !selected) setSelectedKey(null);
  }, [selectedKey, selected]);
  // The card whose details show (a details field is mapped): a click opens a card's details, a second click closes them.
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<CardMove | null>(null);
  const [activeKey, setActiveKey] = useState<UniqueIdentifier | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const toggleExpanded = (key: string) =>
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  // Folded columns: those listed in collapsedColumns at start (again whenever that list changes), then the user's.
  const startCollapsed = useStable(
    useMemo(() => list(properties.collapsedColumns).map(String), [properties.collapsedColumns])
  );
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(() => new Set(startCollapsed));
  useEffect(() => setCollapsedColumns(new Set(startCollapsed)), [startCollapsed]);
  const toggleColumn = (columnId: string) =>
    setCollapsedColumns((current) => {
      const next = new Set(current);
      if (next.has(columnId)) next.delete(columnId);
      else next.add(columnId);
      return next;
    });
  // The first MAX_BOARD_COLUMNS columns, then Show more for the rest (a 10k-item list bound as the columns froze the
  // page; past the cap, columns and their cards were dropped without a sign). Back to the first ones for new columns.
  const [shownColumns, showMoreColumns] = useShownCount(MAX_BOARD_COLUMNS, useStable(properties.columns));
  const collapsedHeight = isSet(properties.collapsedHeight) ? properties.collapsedHeight : '';
  const columnWidth = cssLength(properties.columnWidth);

  // Actions run later, from event handlers and queries: they read the board and the widget's callbacks from refs.
  const live = useRef<KanbanLive>({ columns, setExposedVariable, fireEvent, statusField, idField });
  live.current = { columns, setExposedVariable, fireEvent, statusField, idField };
  /** Shows a change on the board and publishes it: the board's cards, `exposed` (e.g. lastAddedCard), then `event`. */
  const commit = (next: BoardColumn[], exposed: Record<string, unknown>, event?: string) => {
    const { setExposedVariable: expose, fireEvent: fire } = live.current;
    live.current.columns = next;
    setColumns(next);
    expose('updatedCardData', boardCards(next));
    Object.entries(exposed).forEach(([key, value]) => expose(key, value));
    if (event) fire(event);
    // The native Kanban's onUpdate follows every change to the cards.
    if (event) fire('onUpdate');
  };
  const doAdd = (card: unknown, columnId: unknown) => {
    const { columns: cols, statusField: sf, idField: idf } = live.current;
    const result = addCard(cols, card ?? {}, isSet(columnId) ? String(columnId) : undefined, sf, idf);
    commit(result.columns, { lastAddedCard: result.card }, 'onCardAdded');
  };
  const doUpdate = (id: unknown, values: unknown) => {
    const { columns: cols, statusField: sf, idField: idf } = live.current;
    const result = updateCard(cols, id, values ?? {}, sf, idf);
    if (!result.card) return;
    // A changed id changes the card's key: its selection and open details follow it.
    const follow = (key: string | null) => (key === String(id ?? '') ? result.key : key);
    setSelectedKey(follow);
    setOpenKey(follow);
    commit(result.columns, { lastUpdatedCard: result.card }, 'onCardUpdated');
  };
  const doDelete = (id: unknown) => {
    const result = deleteCard(live.current.columns, id);
    if (!result.card) return;
    commit(result.columns, { lastRemovedCard: result.card }, 'onCardRemoved');
  };
  const doMove = (id: unknown, toColumnId: unknown, beforeKey: unknown = null) => {
    const { columns: cols, statusField: sf, idField: idf } = live.current;
    const { columns: next, move } = moveCard(cols, id, toColumnId, beforeKey, sf, idf);
    if (!move) return;
    setLastMove(move);
    commit(next, { lastCardMovement: move }, 'onCardMoved');
  };

  useExposed(setExposedVariables, properties, {
    updatedCardData: boardCards(columns),
    lastSelectedCard: strip(selected),
    collapsedColumns: [...collapsedColumns],
    lastCardMovement: lastMove ?? {},
    addCard: async (card: unknown, columnId: unknown) => doAdd(card, columnId),
    updateCardData: async (id: unknown, values: unknown) => doUpdate(id, values),
    moveCard: async (id: unknown, columnId: unknown) => doMove(id, columnId),
    deleteCard: async (id: unknown) => doDelete(id),
  });

  const custom = properties.cardLayout === 'custom';
  const editing = props.currentMode === 'edit';
  const cardHeight = kanbanCardHeight(properties);
  // Cards are rows of the board only at the top level: inside another row-scoped widget (a native Kanban card, a List
  // view row) the card canvas has no context of its own yet. There cards keep their set height (a card's height would
  // share the board's layout key and grow with it) and their components one entry.
  const ownPath = useOwnContextPath(props.subContainerIndex, props.parentId);
  const scoped = ownPath.length === 0;
  const { board, order } = useCustomCards(props.id, custom, scoped, columns);
  const { boardNode, moreRight, boardWidth, cardWidth } = useBoardSize(custom, columns.length, collapsedColumns);
  const fitCards = custom && !editing && scoped && fitsContentInView(props.componentType ?? 'ShadKanban', properties);
  const renderBody = custom
    ? (card: BoardCard) => (
        <CustomCardBody
          id={props.id}
          index={order.get(card.__key) ?? 0}
          card={card}
          width={cardWidth}
          height={cardHeight}
          fit={fitCards}
          editing={editing}
          scoped={scoped}
          currentLayout={props.currentLayout}
          darkMode={props.darkMode}
        />
      )
    : (card: BoardCard) => (
        <CardBody
          card={card}
          fields={fields}
          compact={compact}
          badgeColors={properties.badgeColors}
          progressStyle={look.progress}
          expanded={!custom && card.__key === openKey}
        />
      );
  const padding = custom ? 'tw-p-0' : compact ? 'tw-p-2.5' : 'tw-p-3';

  // Disabled or loading, the board takes no input: a card or button that already had focus kept its keys (Enter
  // selected a card, Delete removed one during a reload), and a drag under way still dropped.
  const enabled = !properties.disabledState && !properties.loadingState;
  // Custom cards don't drag in the editor, where a press edits the card's components.
  const draggable = properties.allowDrag !== false && enabled && !(custom && editing);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: kanbanCoordinates, keyboardCodes: KANBAN_KEYS })
  );
  // What a screen reader hears while a card moves: its title and the column's, not dnd-kit's ids.
  const titleOfCard = (key: UniqueIdentifier) => {
    const card = live.current.columns.flatMap((c) => c.cards).find((c) => c.__key === String(key));
    const t = card?.[fields.title];
    return typeof t === 'string' || typeof t === 'number' ? String(t) : 'card';
  };
  const titleOfColumn = (overId: UniqueIdentifier) => {
    const id = String(overId);
    const cols = live.current.columns;
    const column = id.startsWith('col-')
      ? cols.find((c) => `col-${c.id}` === id)
      : cols.find((c) => c.cards.some((card) => `drop-${card.__key}` === id));
    return column ? String(column.title ?? column.id) : 'a column';
  };
  const accessibility = {
    announcements: kanbanAnnouncements(titleOfCard, titleOfColumn),
    screenReaderInstructions: { draggable: KANBAN_INSTRUCTIONS },
  };
  const activeCard = activeKey ? columns.flatMap((c) => c.cards).find((c) => c.__key === activeKey) : null;
  const select = (card: BoardCard) => {
    if (!enabled) return;
    if (fields.details) setOpenKey((current) => (current === card.__key ? null : card.__key));
    setSelectedKey(card.__key);
    setExposedVariable('lastSelectedCard', strip(card));
    fireEvent('onCardSelected');
  };
  // The add and delete buttons stay while the board reloads (a focused one keeps its focus) but do nothing.
  const onAdd =
    properties.allowAdd === true && !properties.disabledState
      ? (column: BoardColumn) => {
          if (!enabled) return;
          setExposedVariable('addCardColumn', column.id);
          fireEvent('onAddCardClick');
        }
      : undefined;
  const onDelete =
    properties.allowDelete === true && !properties.disabledState
      ? (card: BoardCard) => enabled && doDelete(card.__key)
      : undefined;
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveKey(null);
    const target = over?.data?.current;
    // Checked at the drop too: the board may have been disabled, set loading or locked since the pick-up.
    if (!target || !draggable) return;
    doMove(active.id, target.columnId, target.type === 'card' ? target.key : null);
  };
  // Reloading a board that has cards (a query refetching after a move) keeps the board on screen under a spinner,
  // instead of swapping it for a loading look: the swap unmounted the drag context, so a drag made while the data
  // came back was lost, and the board flashed on every move. The board takes no input until the data is back.
  const reloading = !!properties.loadingState && columns.some((c) => c.cards.length);
  const shellProps = reloading ? { ...props, properties: { ...properties, loadingState: false } } : props;
  const portalRoot = getPortalRoot();
  return (
    <Shell {...shellProps} innerRef={ref} className={cn(fixed && 'tw-h-full', reloading && 'tw-relative')}>
      {reloading ? (
        <div
          aria-busy="true"
          // A firmer scrim, and the spinner on a chip of its own: bare over a 45% scrim it sat on a card's title.
          className="tw-absolute tw-inset-0 tw-z-10 tw-flex tw-items-center tw-justify-center tw-rounded-[var(--sc-radius)] tw-bg-[color:color-mix(in_srgb,var(--sc-background)_65%,transparent)]"
        >
          <span className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-[color:var(--sc-border)] tw-bg-[color:var(--sc-background)] tw-p-2 tw-shadow-sm">
            <Spinner className="tw-h-5 tw-w-5" />
          </span>
        </div>
      ) : null}
      <DndContext
        sensors={sensors}
        collisionDetection={kanbanCollision}
        accessibility={accessibility}
        onDragStart={({ active }) => setActiveKey(active.id)}
        onDragCancel={() => setActiveKey(null)}
        onDragEnd={onDragEnd}
      >
        <div
          ref={boardNode}
          style={{ ...look.vars, ...(moreRight ? RIGHT_FADE : {}) }}
          className={cn(
            'tw-flex tw-gap-[var(--kb-col-gap,1rem)] tw-overflow-x-auto tw-pb-1',
            fixed && 'tw-h-full tw-items-stretch',
            reloading && 'tw-pointer-events-none'
          )}
        >
          {board.slice(0, shownColumns).map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              renderBody={renderBody}
              padding={padding}
              look={look}
              width={columnWidth}
              collapsedHeight={collapsedHeight}
              expandedKeys={expandedKeys}
              onToggle={toggleExpanded}
              collapsed={collapsedColumns.has(column.id)}
              onCollapse={properties.collapsibleColumns !== false ? toggleColumn : undefined}
              compact={compact}
              showCount={properties.showCount !== false}
              selectedKey={selected?.__key}
              draggable={draggable}
              emptyText={String(properties.emptyText || 'No cards')}
              onSelect={select}
              onDelete={onDelete}
              onAdd={onAdd}
              fixed={fixed}
              maxHeight={!fixed && Number(props.height) > 0 ? Number(props.height) : undefined}
              minColumn={columnMinimum(Math.min(columns.length, shownColumns), boardWidth)}
            />
          ))}
          <ShowMore
            remaining={columns.length - shownColumns}
            step={MAX_BOARD_COLUMNS}
            onMore={showMoreColumns}
            className="tw-shrink-0 tw-self-start tw-whitespace-nowrap tw-rounded-ui2-md tw-px-3 tw-py-1.5 tw-text-ui2-sm tw-text-ui2-muted-foreground tw-transition-colors hover:tw-bg-ui2-muted hover:tw-text-ui2-foreground"
          />
        </div>
        {/* The preview renders at the body: ToolJet places widgets with CSS transforms, and position: fixed inside a
            transformed ancestor is offset by it, so the card trailed far from the pointer. The portal root carries
            .tj-shadcn, so the preview keeps the pack's styles; DragOverlay sizes it to the dragged card. */}
        {portalRoot
          ? createPortal(
              <DragOverlay>
                {activeCard ? (
                  <div
                    style={{ ...look.vars, ...look.card, boxShadow: SHADOWS.lg }}
                    className={cn(
                      'tw-h-full tw-w-full tw-rotate-1 tw-overflow-hidden tw-border tw-text-ui2-card-foreground',
                      padding
                    )}
                  >
                    {renderBody(activeCard)}
                  </div>
                ) : null}
              </DragOverlay>,
              portalRoot
            )
          : null}
      </DndContext>
    </Shell>
  );
};

export default withControlState(ShadKanban);
