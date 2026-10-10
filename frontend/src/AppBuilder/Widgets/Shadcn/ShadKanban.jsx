import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, X } from 'lucide-react';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import { initials, list, useAutoHeight, useExposed } from '../packHooks';
import { Avatar, AvatarFallback, Badge, Progress, cn, getPortalRoot } from './ui';
import { Shell } from './Shadcn';
import { addCard, boardCards, boardColumns, cardClamp, deleteCard, moveCard, updateCard } from './kanbanBoard';

// shadcn/ui pack Kanban (experiment): a data-driven board. Columns are values of a status field and cards are rows
// of data shown by the fields the author maps (title, description, badge, tags, progress, meta, avatar), so an agent
// builds it from a query alone and a card shows more or less by mapping more or fewer fields. Dragging, the add and
// delete buttons and the actions change the board at once and publish the change (cards, the last added, moved,
// updated or removed card, and an event) for a query to save; the board follows the data again when the data
// changes. Own lazy chunk (dnd-kit).

const BADGE_BY_WORD = {
  critical: 'destructive',
  urgent: 'destructive',
  high: 'destructive',
  blocked: 'destructive',
  medium: 'warning',
  normal: 'secondary',
  low: 'secondary',
  done: 'success',
};

const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 10px -2px rgb(0 0 0 / 0.08)',
  lg: '0 12px 24px -6px rgb(0 0 0 / 0.16)',
};

const isSet = (value) => value !== undefined && value !== null && String(value).trim() !== '';
const px = (value) => (/^\d+(\.\d+)?$/.test(String(value).trim()) ? `${value}px` : String(value));

/** Column and card looks: the author's styles where set, else shadcn's from the app theme. Applied inline, so the
 *  pack's Tailwind utilities (which are !important) are left off those properties; hover, selected and drop states
 *  keep their utilities and so still win. */
const boardLook = (styles = {}) => ({
  column: {
    background: isSet(styles.columnBackgroundColor)
      ? styles.columnBackgroundColor
      : 'color-mix(in srgb, var(--sc-muted) 60%, transparent)',
    borderRadius: isSet(styles.columnBorderRadius) ? px(styles.columnBorderRadius) : 'calc(var(--sc-radius) + 4px)',
  },
  card: {
    background: isSet(styles.cardBackgroundColor) ? styles.cardBackgroundColor : 'var(--sc-card)',
    borderColor: isSet(styles.cardBorderColor) ? styles.cardBorderColor : 'var(--sc-border)',
    borderRadius: isSet(styles.cardBorderRadius) ? px(styles.cardBorderRadius) : 'var(--sc-radius)',
    boxShadow: SHADOWS[styles.cardShadow] ?? (isSet(styles.cardShadow) ? styles.cardShadow : SHADOWS.sm),
  },
});

const asTags = (value) =>
  (Array.isArray(value) ? value : isSet(value) ? String(value).split(',') : [])
    .map((tag) => String(tag?.label ?? tag).trim())
    .filter(Boolean);

const CardBody = ({ card, fields, compact }) => {
  const badge = fields.badge ? card[fields.badge] : undefined;
  const avatar = fields.avatar ? card[fields.avatar] : undefined;
  const meta = fields.meta ? card[fields.meta] : undefined;
  const tags = fields.tags ? asTags(card[fields.tags]) : [];
  const progress = fields.progress ? Number(card[fields.progress]) : NaN;
  return (
    <>
      <p className={cn('pr-5 font-medium leading-snug', compact ? 'text-[13px]' : 'text-sm')}>
        {String(card[fields.title] ?? '')}
      </p>
      {fields.description && isSet(card[fields.description]) ? (
        <p className={cn('line-clamp-2 text-xs text-muted-foreground', compact ? 'mt-0.5' : 'mt-1')}>
          {String(card[fields.description])}
        </p>
      ) : null}
      {tags.length ? (
        <div className={cn('flex flex-wrap gap-1', compact ? 'mt-1.5' : 'mt-2')}>
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="px-1.5 py-0 text-[11px] font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
      {Number.isFinite(progress) ? (
        <div className={cn('flex items-center gap-2', compact ? 'mt-1.5' : 'mt-2.5')}>
          <Progress value={Math.max(0, Math.min(100, progress))} className="h-1.5" />
          <span className="text-[11px] tabular-nums text-muted-foreground">{Math.round(progress)}%</span>
        </div>
      ) : null}
      {isSet(badge) || isSet(avatar) || isSet(meta) ? (
        <div className={cn('flex items-center gap-2', compact ? 'mt-2' : 'mt-3')}>
          {isSet(badge) ? (
            <Badge variant={BADGE_BY_WORD[String(badge).toLowerCase()] || 'outline'}>{String(badge)}</Badge>
          ) : null}
          {isSet(meta) ? <span className="text-xs text-muted-foreground">{String(meta)}</span> : null}
          {isSet(avatar) ? (
            <Avatar className="ml-auto h-6 w-6">
              <AvatarFallback className="text-[10px]">{initials(avatar)}</AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      ) : null}
    </>
  );
};

const KanbanCard = ({
  card,
  columnId,
  renderBody,
  padding,
  look,
  collapse,
  selected,
  draggable,
  onSelect,
  onDelete,
}) => {
  const data = { type: 'card', key: card.__key, columnId };
  const drag = useDraggable({ id: card.__key, data, disabled: !draggable });
  const drop = useDroppable({ id: `drop-${card.__key}`, data });
  // Collapsed height: the content's natural height decides whether the card collapses at all.
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!isSet(collapse.height) || !el) return undefined;
    const measure = () => setContentHeight(el.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [collapse.height]);
  const clamp = cardClamp(collapse.height, contentHeight, collapse.expanded);
  return (
    <div
      ref={(el) => {
        drag.setNodeRef(el);
        drop.setNodeRef(el);
      }}
      {...drag.attributes}
      {...drag.listeners}
      onClick={() => onSelect(card)}
      style={look.card}
      className={cn(
        'group relative overflow-hidden border text-card-foreground transition-colors hover:border-primary/40',
        padding,
        draggable && 'cursor-grab active:cursor-grabbing',
        selected && 'border-primary ring-1 ring-primary',
        drop.isOver && 'border-t-2 border-t-primary',
        drag.isDragging && 'opacity-40'
      )}
    >
      {onDelete ? (
        <button
          type="button"
          aria-label="Delete card"
          title="Delete card"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card);
          }}
          className="absolute right-1.5 top-1.5 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <div
        className="relative"
        style={clamp.collapsible ? { maxHeight: clamp.maxHeight, overflow: 'hidden' } : undefined}
      >
        <div ref={contentRef}>{renderBody(card)}</div>
        {clamp.maxHeight ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8"
            style={{ background: `linear-gradient(to bottom, transparent, ${look.card.background})` }}
          />
        ) : null}
      </div>
      {clamp.collapsible ? (
        // Shown on hover (or keyboard focus) only, over the card's bottom edge, so it takes no room at rest.
        <button
          type="button"
          aria-expanded={collapse.expanded}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            collapse.onToggle(card.__key);
          }}
          className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-[11px] text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
        >
          {collapse.expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {collapse.expanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  );
};

const KanbanColumn = ({
  column,
  renderBody,
  padding,
  look,
  width,
  collapsedHeight,
  expandedKeys,
  onToggle,
  compact,
  showCount,
  selectedKey,
  draggable,
  emptyText,
  onSelect,
  onDelete,
  onAdd,
  collapsed,
  onCollapse,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${column.id}`,
    data: { type: 'column', columnId: column.id },
  });
  // A collapsed column is a narrow strip: title read sideways and the count. It still takes dropped cards, and a
  // click opens it again.
  if (collapsed) {
    return (
      <div
        ref={setNodeRef}
        data-collapsed="true"
        role="button"
        tabIndex={0}
        title={`Expand ${column.title}`}
        aria-label={`Expand ${column.title}`}
        onClick={() => onCollapse(column.id)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onCollapse(column.id)}
        style={{ ...look.column, width: 44, flex: '0 0 44px' }}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-2 px-1 py-3 transition-shadow hover:ring-1 hover:ring-border',
          isOver && 'ring-1 ring-primary'
        )}
      >
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        {showCount ? (
          <Badge variant="secondary" className="px-1.5 tabular-nums">
            {column.cards.length}
          </Badge>
        ) : null}
        <span className="truncate text-sm font-semibold [writing-mode:vertical-rl]">{column.title}</span>
      </div>
    );
  }
  return (
    <div
      ref={setNodeRef}
      data-collapsed="false"
      // A set column width is inline; without one the columns share the board, at least 240px each.
      style={width ? { ...look.column, width, flex: `0 0 ${width}` } : look.column}
      className={cn(
        'flex flex-col p-3 transition-shadow',
        !width && 'min-w-[240px] flex-1',
        compact ? 'gap-1.5' : 'gap-2',
        isOver && 'ring-1 ring-border'
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2 px-1">
        <span className="truncate text-sm font-semibold">{column.title}</span>
        <div className="flex shrink-0 items-center gap-1">
          {showCount ? (
            <Badge variant="secondary" className="tabular-nums">
              {column.cards.length}
            </Badge>
          ) : null}
          {onCollapse ? (
            <button
              type="button"
              title={`Collapse ${column.title}`}
              aria-label={`Collapse ${column.title}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onCollapse(column.id)}
              className="rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      {column.cards.length ? (
        column.cards.map((card) => (
          <KanbanCard
            key={card.__key}
            card={card}
            columnId={column.id}
            renderBody={renderBody}
            padding={padding}
            look={look}
            collapse={{ height: collapsedHeight, expanded: expandedKeys.has(card.__key), onToggle }}
            selected={card.__key === selectedKey}
            draggable={draggable}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))
      ) : (
        <div className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
          {emptyText}
        </div>
      )}
      {onAdd ? (
        <button
          type="button"
          onClick={() => onAdd(column)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Add card
        </button>
      ) : null}
    </div>
  );
};

const strip = (card) => {
  if (!card) return {};
  const { __key, ...plain } = card;
  return plain;
};

export const ShadKanban = (props) => {
  const { properties, styles, setExposedVariable, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const statusField = properties.statusField || 'status';
  const idField = properties.idField || 'id';
  const fields = {
    title: properties.titleField || 'title',
    description: properties.descriptionField || '',
    badge: properties.badgeField || '',
    tags: properties.tagsField || '',
    progress: properties.progressField || '',
    avatar: properties.avatarField || '',
    meta: properties.metaField || '',
  };
  const compact = properties.density === 'compact';
  const look = boardLook(styles);
  const fromData = useMemo(
    () => boardColumns(list(properties.data), list(properties.columns), statusField, idField),
    [properties.data, properties.columns, statusField, idField]
  );
  const [columns, setColumns] = useState(fromData);
  useEffect(() => setColumns(fromData), [fromData]);
  const [selected, setSelected] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [activeKey, setActiveKey] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState(() => new Set());
  const toggleExpanded = (key) =>
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  // Folded columns: those listed in collapsedColumns at start (again whenever that list changes), then the user's.
  const startCollapsed = JSON.stringify(list(properties.collapsedColumns).map(String));
  const [collapsedColumns, setCollapsedColumns] = useState(() => new Set(JSON.parse(startCollapsed)));
  useEffect(() => setCollapsedColumns(new Set(JSON.parse(startCollapsed))), [startCollapsed]);
  const toggleColumn = (columnId) =>
    setCollapsedColumns((current) => {
      const next = new Set(current);
      if (next.has(columnId)) next.delete(columnId);
      else next.add(columnId);
      return next;
    });
  const collapsedHeight = isSet(properties.collapsedHeight) ? properties.collapsedHeight : '';
  const columnWidth = isSet(properties.columnWidth) ? px(properties.columnWidth) : undefined;

  // Actions run later, from event handlers and queries: they read the board and the widget's callbacks from refs.
  const live = useRef({});
  live.current = { columns, setExposedVariable, fireEvent, statusField, idField };
  /** Shows a change on the board and publishes it: the board's cards, `exposed` (e.g. lastAddedCard), then `event`. */
  const commit = (next, exposed, event) => {
    const { setExposedVariable: expose, fireEvent: fire } = live.current;
    live.current.columns = next;
    setColumns(next);
    expose('cards', boardCards(next));
    Object.entries(exposed).forEach(([key, value]) => expose(key, value));
    if (event) fire(event);
  };
  const doAdd = (card, columnId) => {
    const { columns: cols, statusField: sf, idField: idf } = live.current;
    const result = addCard(cols, card ?? {}, isSet(columnId) ? String(columnId) : undefined, sf, idf);
    commit(result.columns, { lastAddedCard: result.card }, 'onCardAdded');
  };
  const doUpdate = (id, values) => {
    const { columns: cols, statusField: sf, idField: idf } = live.current;
    const result = updateCard(cols, id, values ?? {}, sf, idf);
    if (result.card) commit(result.columns, { lastUpdatedCard: result.card }, 'onCardUpdated');
  };
  const doDelete = (id) => {
    const result = deleteCard(live.current.columns, id);
    if (!result.card) return;
    setSelected((current) => (current && current.__key === String(id) ? null : current));
    commit(result.columns, { lastRemovedCard: result.card }, 'onCardRemoved');
  };
  const doMove = (id, toColumnId, beforeKey = null) => {
    const { columns: cols, statusField: sf } = live.current;
    const { columns: next, move } = moveCard(cols, id, toColumnId, beforeKey, sf);
    if (!move) return;
    setLastMove(move);
    commit(next, { movedCard: move.card, lastMove: move }, 'onCardMoved');
  };

  useExposed(setExposedVariables, properties, {
    cards: boardCards(columns),
    selectedCard: strip(selected),
    collapsedColumns: [...collapsedColumns],
    movedCard: lastMove?.card ?? {},
    lastMove: lastMove ?? {},
    addCard: async (card, columnId) => doAdd(card, columnId),
    updateCard: async (id, values) => doUpdate(id, values),
    moveCard: async (id, columnId) => doMove(id, columnId),
    deleteCard: async (id) => doDelete(id),
  });

  // Custom card content: every card renders the board's one card canvas (the components dropped on the first card)
  // with its own row of cardData, as a list view renders its rows. The canvas is laid out at the card's width.
  const { moduleId } = useModuleContext();
  const updateCustomResolvables = useStore((state) => state.updateCustomResolvables);
  const custom = properties.cardLayout === 'custom';
  const editing = props.currentMode === 'edit';
  const cardHeight = Number(properties.cardHeight) || 96;
  const order = useMemo(
    () => new Map(columns.flatMap((c) => c.cards).map((card, index) => [card.__key, index])),
    [columns]
  );
  useLayoutEffect(() => {
    if (!custom) return;
    updateCustomResolvables(
      props.id,
      boardCards(columns).map((card) => ({ cardData: card })),
      'cardData',
      moduleId
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [custom, columns, props.id, moduleId]);
  const boardRef = useRef(null);
  const [cardWidth, setCardWidth] = useState(0);
  useLayoutEffect(() => {
    if (!custom || !boardRef.current) return undefined;
    // A column's content box less the card's 1px borders; every column has the same width.
    const measure = () => {
      const column = boardRef.current?.querySelector(':scope > [data-collapsed="false"]');
      if (column) setCardWidth(Math.max(0, column.clientWidth - 24 - 2));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(boardRef.current);
    return () => observer.disconnect();
  }, [custom, columns.length, collapsedColumns]);
  const renderBody = custom
    ? (card) => (
        // In the editor, a press inside the card edits its components instead of starting a card drag.
        <div style={{ height: cardHeight }} onPointerDown={editing ? (e) => e.stopPropagation() : undefined}>
          {cardWidth > 0 ? (
            <SubContainer
              id={props.id}
              index={order.get(card.__key) ?? 0}
              canvasWidth={cardWidth}
              canvasHeight={cardHeight}
              componentType="ShadKanban"
              styles={{ backgroundColor: 'transparent' }}
              darkMode={props.darkMode}
            />
          ) : null}
        </div>
      )
    : (card) => <CardBody card={card} fields={fields} compact={compact} />;
  const padding = custom ? 'p-0' : compact ? 'p-2.5' : 'p-3';

  const enabled = !properties.disabledState;
  // Custom cards don't drag in the editor, where a press edits the card's components.
  const draggable = properties.allowDrag !== false && enabled && !(custom && editing);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );
  const activeCard = activeKey ? columns.flatMap((c) => c.cards).find((c) => c.__key === activeKey) : null;
  const select = (card) => {
    setSelected(card);
    setExposedVariable('selectedCard', strip(card));
    fireEvent('onCardClicked');
  };
  const onAdd =
    properties.allowAdd === true && enabled
      ? (column) => {
          setExposedVariable('addCardColumn', column.id);
          fireEvent('onAddCardClick');
        }
      : undefined;
  const onDelete = properties.allowDelete === true && enabled ? (card) => doDelete(card.__key) : undefined;
  const onDragEnd = ({ active, over }) => {
    setActiveKey(null);
    const target = over?.data?.current;
    if (!target) return;
    doMove(active.id, target.columnId, target.type === 'card' ? target.key : null);
  };
  return (
    <Shell {...props} innerRef={ref}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => setActiveKey(active.id)}
        onDragCancel={() => setActiveKey(null)}
        onDragEnd={onDragEnd}
      >
        <div ref={boardRef} className="flex gap-4 overflow-x-auto pb-1">
          {columns.map((column) => (
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
            />
          ))}
        </div>
        {/* The preview renders at the body: ToolJet places widgets with CSS transforms, and position: fixed inside a
            transformed ancestor is offset by it, so the card trailed far from the pointer. The portal root carries
            .tj-shadcn, so the preview keeps the pack's styles; DragOverlay sizes it to the dragged card. */}
        {createPortal(
          <DragOverlay>
            {activeCard ? (
              <div
                style={{ ...look.card, boxShadow: SHADOWS.lg }}
                className={cn('h-full w-full rotate-1 overflow-hidden border text-card-foreground', padding)}
              >
                {renderBody(activeCard)}
              </div>
            ) : null}
          </DragOverlay>,
          getPortalRoot()
        )}
      </DndContext>
    </Shell>
  );
};
