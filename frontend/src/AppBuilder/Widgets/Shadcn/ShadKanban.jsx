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
import { SHADOWS, badgeLook, isSet, kanbanLook, px } from './kanbanLook';
import { stringify } from '../packJson';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';

export { withControlState } from '../packHooks';

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

// A card's secondary text (description, meta, progress): the cardTextColor style, else the theme's muted text.
const SECONDARY_TEXT = 'text-[color:var(--kb-card-text,var(--sc-muted-foreground))]';

const asTags = (value) =>
  (Array.isArray(value) ? value : isSet(value) ? String(value).split(',') : [])
    .map((tag) => String(tag?.label ?? tag).trim())
    .filter(Boolean);

const CardBody = ({ card, fields, compact, badgeColors, progressStyle }) => {
  const badge = fields.badge ? card[fields.badge] : undefined;
  const avatar = fields.avatar ? card[fields.avatar] : undefined;
  const meta = fields.meta ? card[fields.meta] : undefined;
  const tags = fields.tags ? asTags(card[fields.tags]) : [];
  const progress = fields.progress ? Number(card[fields.progress]) : NaN;
  return (
    <>
      <p
        className={cn(
          'pr-5 font-medium leading-snug text-[color:var(--kb-card-title,var(--sc-card-foreground))]',
          compact ? 'text-[13px]' : 'text-sm'
        )}
      >
        {String(card[fields.title] ?? '')}
      </p>
      {fields.description && isSet(card[fields.description]) ? (
        <p className={cn('line-clamp-2 text-xs', SECONDARY_TEXT, compact ? 'mt-0.5' : 'mt-1')}>
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
        <div style={progressStyle} className={cn('flex items-center gap-2', compact ? 'mt-1.5' : 'mt-2.5')}>
          <Progress value={Math.max(0, Math.min(100, progress))} className="h-1.5" />
          <span className={cn('text-[11px] tabular-nums', SECONDARY_TEXT)}>{Math.round(progress)}%</span>
        </div>
      ) : null}
      {isSet(badge) || isSet(avatar) || isSet(meta) ? (
        <div className={cn('flex items-center gap-2', compact ? 'mt-2' : 'mt-3')}>
          {isSet(badge) ? (
            badgeLook(badge, badgeColors) ? (
              <Badge
                variant="outline"
                style={badgeLook(badge, badgeColors)}
                className="border-transparent bg-[color:var(--kb-badge-bg)] text-[color:var(--kb-badge-fg)]"
              >
                {String(badge)}
              </Badge>
            ) : (
              <Badge variant={BADGE_BY_WORD[String(badge).toLowerCase()] || 'outline'}>{String(badge)}</Badge>
            )
          ) : null}
          {isSet(meta) ? <span className={cn('text-xs', SECONDARY_TEXT)}>{String(meta)}</span> : null}
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
        'group/card relative overflow-hidden border text-card-foreground transition-colors hover:border-primary/40',
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
          className="absolute right-1.5 top-1.5 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover/card:opacity-100"
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
          className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-[11px] text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover/card:opacity-100"
        >
          {collapse.expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {collapse.expanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  );
};

// Column title and count colours: the columnTitleColor and count styles, else the theme's.
const COLUMN_TITLE = 'text-[color:var(--kb-col-title,var(--sc-foreground))]';
const COUNT_BADGE =
  'bg-[color:var(--kb-count-bg,var(--sc-secondary))] text-[color:var(--kb-count-fg,var(--sc-secondary-foreground))]';

// A field name is text (or a number): anything else bound there (a list of rows) was turned into a 150 KB key for
// every card, which froze the board.
const fieldName = (value, fallback) =>
  typeof value === 'string' && value.trim() ? value : typeof value === 'number' ? String(value) : fallback;

// A board draws this many cards a column at first, then this many more per "Show more" click (10k cards froze the
// page); and at most MAX_BOARD_COLUMNS columns (a 10k-item list bound as the columns).
const CARDS_PER_STEP = 100;
const MAX_BOARD_COLUMNS = 50;

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
  fixed,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${column.id}`,
    data: { type: 'column', columnId: column.id },
  });
  const [shownCards, setShownCards] = useState(CARDS_PER_STEP);
  const hiddenCards = column.cards.length - shownCards;
  // On a board with a fixed height the cards scroll inside their column, fading out at the bottom while more are
  // below (Trello-like); a board that fits its content grows instead.
  const listRef = useRef(null);
  const [moreBelow, setMoreBelow] = useState(false);
  useEffect(() => {
    const el = listRef.current;
    if (!fixed || !el) return undefined;
    const check = () => setMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
    check();
    el.addEventListener('scroll', check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', check);
      observer.disconnect();
    };
  }, [fixed, column.cards.length, shownCards]);
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
          'group/col flex cursor-pointer flex-col items-center gap-2 px-1 py-3 transition-shadow hover:ring-1 hover:ring-border',
          isOver && 'ring-1 ring-primary'
        )}
      >
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/col:opacity-100" />
        {showCount ? (
          <Badge variant="secondary" className={cn('px-1.5 tabular-nums', COUNT_BADGE)}>
            {column.cards.length}
          </Badge>
        ) : null}
        <span className={cn('truncate text-sm font-semibold [writing-mode:vertical-rl]', COLUMN_TITLE)}>
          {column.title}
        </span>
      </div>
    );
  }
  return (
    <div
      ref={setNodeRef}
      data-collapsed="false"
      // A set column width is inline; without one the columns share the board, at least 200px each (five stages fit a
      // typical page width).
      style={width ? { ...look.column, width, flex: `0 0 ${width}` } : look.column}
      className={cn(
        'group/col flex flex-col p-3 transition-shadow',
        fixed && 'min-h-0 overflow-hidden',
        !width && 'min-w-[200px] flex-1',
        compact ? 'gap-1.5' : 'gap-2',
        isOver && 'ring-1 ring-border'
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2 px-1">
        <span className={cn('truncate text-sm font-semibold', COLUMN_TITLE)}>{column.title}</span>
        <div className="flex shrink-0 items-center gap-1">
          {showCount ? (
            <Badge variant="secondary" className={cn('tabular-nums', COUNT_BADGE)}>
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
              className="rounded-md p-0.5 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover/col:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      <div
        ref={listRef}
        style={fixed && moreBelow ? BOTTOM_FADE : undefined}
        className={cn(
          'flex flex-col',
          compact ? 'gap-1.5' : 'gap-2',
          fixed && '-mx-1 min-h-0 flex-1 overflow-y-auto px-1 [&>*]:shrink-0'
        )}
      >
        {column.cards.length ? (
          column.cards
            .slice(0, shownCards)
            .map((card) => (
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
        {hiddenCards > 0 ? (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setShownCards((n) => n + CARDS_PER_STEP)}
            className="rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {`Show ${Math.min(hiddenCards, CARDS_PER_STEP)} more of ${hiddenCards}`}
          </button>
        ) : null}
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
    </div>
  );
};

const strip = (card) => {
  if (!card) return {};
  const { __key, ...plain } = card;
  return plain;
};

const BOTTOM_FADE = {
  maskImage: 'linear-gradient(to bottom, black calc(100% - 48px), transparent)',
  WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 48px), transparent)',
};

const RIGHT_FADE = {
  maskImage: 'linear-gradient(to right, #000 calc(100% - 48px), transparent)',
  WebkitMaskImage: 'linear-gradient(to right, #000 calc(100% - 48px), transparent)',
};

export const ShadKanban = (props) => {
  const { properties, styles, setExposedVariable, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  // Dynamic height off: the board keeps its drawn height and each column scrolls inside it.
  const fixed = !fitsContentInView(props.componentType ?? 'ShadKanban', properties);
  const statusField = fieldName(properties.statusField, 'status');
  const idField = fieldName(properties.idField, 'id');
  const fields = {
    title: fieldName(properties.titleField, 'title'),
    description: fieldName(properties.descriptionField, ''),
    badge: fieldName(properties.badgeField, ''),
    tags: fieldName(properties.tagsField, ''),
    progress: fieldName(properties.progressField, ''),
    avatar: fieldName(properties.avatarField, ''),
    meta: fieldName(properties.metaField, ''),
  };
  const compact = properties.density === 'compact';
  const look = kanbanLook(styles);
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
  const startCollapsed = stringify(list(properties.collapsedColumns).map(String));
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
  // Columns that run past the board's right edge fade out there, so the board reads as scrolling sideways (macOS hides
  // the scrollbar, and a column cut at the edge looks broken).
  const [moreRight, setMoreRight] = useState(false);
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return undefined;
    const check = () => setMoreRight(el.scrollWidth - el.scrollLeft - el.clientWidth > 4);
    check();
    el.addEventListener('scroll', check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', check);
      observer.disconnect();
    };
  }, []);
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
    : (card) => (
        <CardBody
          card={card}
          fields={fields}
          compact={compact}
          badgeColors={properties.badgeColors}
          progressStyle={look.progress}
        />
      );
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
    <Shell {...props} innerRef={ref} className={fixed ? 'h-full' : undefined}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => setActiveKey(active.id)}
        onDragCancel={() => setActiveKey(null)}
        onDragEnd={onDragEnd}
      >
        <div
          ref={boardRef}
          style={{ ...look.vars, ...(moreRight ? RIGHT_FADE : {}) }}
          className={cn('flex gap-[var(--kb-col-gap,1rem)] overflow-x-auto pb-1', fixed && 'h-full items-stretch')}
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
                style={{ ...look.vars, ...look.card, boxShadow: SHADOWS.lg }}
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
