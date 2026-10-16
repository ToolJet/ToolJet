import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { CollisionDetection, DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { list, useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn, getPortalRoot } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Spinner } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { addCard, boardCards, boardColumns, deleteCard, moveCard, updateCard } from './kanbanBoard';
import { KANBAN_INSTRUCTIONS, KANBAN_KEYS, kanbanAnnouncements, kanbanCoordinates } from './kanbanKeyboard';
import { SHADOWS, isSet, kanbanLook, px } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import type { BoardCard, BoardColumn, CardMove, CardRow } from './kanbanBoard';
import { CardBody, CustomCardBody } from './KanbanCard';
import type { CardFields } from './KanbanCard';
import { KanbanColumn, MAX_BOARD_COLUMNS } from './KanbanColumn';
import { useBoardSize } from './useBoardSize';

/** What the board's actions read later, without going stale. */
interface KanbanLive {
  columns: BoardColumn[];
  setExposedVariable: WidgetProps['setExposedVariable'];
  fireEvent: WidgetProps['fireEvent'];
  statusField: string;
  idField: string;
}

/** What the board reads from the app store. */
type KanbanStore = {
  updateCustomResolvables: (id: string, values: Record<string, unknown>[], key: string, moduleId: string) => void;
};

// ToolJet UI 2.0 Kanban: a data-driven board. Columns are values of a status field and cards are rows
// of data shown by the fields the author maps (title, description, badge, tags, progress, meta, avatar), so an agent
// builds it from a query alone and a card shows more or less by mapping more or fewer fields. Dragging, the add and
// delete buttons and the actions change the board at once and publish the change (cards, the last added, moved,
// updated or removed card, and an event) for a query to save; the board follows the data again when the data
// changes. Own lazy chunk (dnd-kit).

// A field name is text (or a number): anything else bound there (a list of rows) was turned into a 150 KB key for
// every card, which froze the board.
const fieldName = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim() ? value : typeof value === 'number' ? String(value) : fallback;

/** The narrowest a column gets before the board scrolls: 200px, 160px on a board of six or more stages, and down to
 *  140px when that lets every stage fit the board (three stages in a 620px half of a page cut the third at the edge,
 *  2026-10-14). 16px gaps between columns. */
export const columnMinimum = (count: number, boardWidth: number): number => {
  const base = count >= 6 ? 160 : 200;
  if (!(boardWidth > 0) || count < 1) return base;
  const share = Math.floor((boardWidth - 16 * (count - 1)) / count);
  return Math.max(140, Math.min(base, share));
};

const strip = (card: BoardCard | null): CardRow => {
  if (!card) return {};
  const { __key, ...plain } = card;
  return plain;
};

const RIGHT_FADE = {
  maskImage: 'linear-gradient(to right, #000 calc(100% - 48px), transparent)',
  WebkitMaskImage: 'linear-gradient(to right, #000 calc(100% - 48px), transparent)',
};

/** Where a drop lands: what is under the pointer, a card first, then a column (a folded column is a 44px strip that
 *  closestCorners passed over for a card nearby, so drops on it were lost); off the board, the nearest corners. */
export const kanbanCollision: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  const cards = within.filter((c) => c.data?.droppableContainer?.data?.current?.type === 'card');
  if (cards.length) return cards;
  return within.length ? within : closestCorners(args);
};

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
  const [selected, setSelected] = useState<BoardCard | null>(null);
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
  const startCollapsed = stringify(list(properties.collapsedColumns).map(String));
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(() => new Set(JSON.parse(startCollapsed)));
  useEffect(() => setCollapsedColumns(new Set(JSON.parse(startCollapsed))), [startCollapsed]);
  const toggleColumn = (columnId: string) =>
    setCollapsedColumns((current) => {
      const next = new Set(current);
      if (next.has(columnId)) next.delete(columnId);
      else next.add(columnId);
      return next;
    });
  const collapsedHeight = isSet(properties.collapsedHeight) ? properties.collapsedHeight : '';
  const columnWidth = isSet(properties.columnWidth) ? px(properties.columnWidth) : undefined;

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
    if (result.card) commit(result.columns, { lastUpdatedCard: result.card }, 'onCardUpdated');
  };
  const doDelete = (id: unknown) => {
    const result = deleteCard(live.current.columns, id);
    if (!result.card) return;
    setSelected((current) => (current && current.__key === String(id) ? null : current));
    commit(result.columns, { lastRemovedCard: result.card }, 'onCardRemoved');
  };
  const doMove = (id: unknown, toColumnId: unknown, beforeKey: unknown = null) => {
    const { columns: cols, statusField: sf } = live.current;
    const { columns: next, move } = moveCard(cols, id, toColumnId, beforeKey, sf);
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

  // Custom card content: every card renders the board's one card canvas (the components dropped on the first card)
  // with its own row of cardData, as a list view renders its rows. The canvas is laid out at the card's width.
  const { moduleId } = useModuleContext();
  const updateCustomResolvables = useStore((state: KanbanStore) => state.updateCustomResolvables);
  const custom = properties.cardLayout === 'custom';
  const editing = props.currentMode === 'edit';
  const cardHeight = Number(properties.cardHeight) || 96;
  const order = useMemo(
    () => new Map(columns.flatMap((c) => c.cards).map((card, index) => [card.__key, index])),
    [columns]
  );
  useLayoutEffect(() => {
    if (!custom) return;
    // Published only once there are cards, the native Listview's way: publishing an empty board (data still loading)
    // shrank every card component's per-card entries to none, and the cards built later lacked the component's own
    // settings (show on desktop), so custom card content rendered blank. Card children keep object exposed values
    // (not the Listview's per-row arrays): sizing them as arrays crashed the app on their next write.
    const cards = boardCards(columns);
    if (!cards.length) return;
    updateCustomResolvables(
      props.id,
      cards.map((card) => ({ cardData: card })),
      'cardData',
      moduleId
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [custom, columns, props.id, moduleId]);
  const { boardNode, moreRight, boardWidth, cardWidth } = useBoardSize(custom, columns.length, collapsedColumns);
  const fitCards = custom && !editing && fitsContentInView(props.componentType ?? 'ShadKanban', properties);
  const renderBody = custom
    ? (card: BoardCard) => (
        <CustomCardBody
          id={props.id}
          index={order.get(card.__key) ?? 0}
          width={cardWidth}
          height={cardHeight}
          fit={fitCards}
          editing={editing}
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

  const enabled = !properties.disabledState;
  // Custom cards don't drag in the editor, where a press edits the card's components.
  const draggable = properties.allowDrag !== false && enabled && !properties.loadingState && !(custom && editing);
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
    if (fields.details) setOpenKey((current) => (current === card.__key ? null : card.__key));
    setSelected(card);
    setExposedVariable('lastSelectedCard', strip(card));
    fireEvent('onCardSelected');
  };
  const onAdd =
    properties.allowAdd === true && enabled
      ? (column: BoardColumn) => {
          setExposedVariable('addCardColumn', column.id);
          fireEvent('onAddCardClick');
        }
      : undefined;
  const onDelete = properties.allowDelete === true && enabled ? (card: BoardCard) => doDelete(card.__key) : undefined;
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveKey(null);
    const target = over?.data?.current;
    if (!target) return;
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
          {columns.slice(0, MAX_BOARD_COLUMNS).map((column) => (
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
              minColumn={columnMinimum(columns.length, boardWidth)}
            />
          ))}
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
