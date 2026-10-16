import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, X } from 'lucide-react';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import { initials, list, useAutoHeight, useExposed } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Avatar, AvatarFallback, Badge, Progress, cn, getPortalRoot } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell, Spinner } from './Shadcn';
import {
  addCard,
  boardCards,
  boardColumns,
  cardClamp,
  cardDateLabel,
  cardDetails,
  deleteCard,
  moveCard,
  updateCard,
} from './kanbanBoard';
import { KANBAN_INSTRUCTIONS, KANBAN_KEYS, kanbanAnnouncements, kanbanCoordinates } from './kanbanKeyboard';
import { useCanvasFit } from '@/AppBuilder/Widgets/Ui2/_shared/canvasFit';
import { SHADOWS, badgeLook, isSet, kanbanLook, px } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';

export { withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';

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

// A detail longer than this takes the card's full width; shorter ones (an amount, a date) sit two to a row.
const SHORT_DETAIL = 22;

// A card's text: a stored ISO date or timestamp as a short date, anything else as written.
const shown = (value) => cardDateLabel(value) ?? String(value);

const CardBody = ({ card, fields, compact, badgeColors, progressStyle, expanded }) => {
  const badge = fields.badge ? card[fields.badge] : undefined;
  const avatar = fields.avatar ? card[fields.avatar] : undefined;
  const meta = fields.meta ? card[fields.meta] : undefined;
  const tags = fields.tags ? asTags(card[fields.tags]) : [];
  const progress = fields.progress ? Number(card[fields.progress]) : NaN;
  const details = expanded && fields.details ? cardDetails(card[fields.details]) : [];
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
          {shown(card[fields.description])}
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
        // Wraps beside a wide badge, the meta moving whole to the next line, before the meta is cut ("28 Oct 2...").
        <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-1', compact ? 'mt-2' : 'mt-3')}>
          {isSet(badge) ? (
            badgeLook(badge, badgeColors) ? (
              <Badge
                variant="outline"
                style={badgeLook(badge, badgeColors)}
                className="shrink-0 border-transparent bg-[color:var(--kb-badge-bg)] text-[color:var(--kb-badge-fg)]"
              >
                {String(badge)}
              </Badge>
            ) : (
              <Badge variant={BADGE_BY_WORD[String(badge).toLowerCase()] || 'outline'} className="shrink-0">
                {String(badge)}
              </Badge>
            )
          ) : null}
          {isSet(meta) ? (
            // One line: in a narrow column a date wrapped across lines; the whole text is in the tooltip.
            <span title={String(meta)} className={cn('min-w-0 truncate whitespace-nowrap text-xs', SECONDARY_TEXT)}>
              {shown(meta)}
            </span>
          ) : null}
          {isSet(avatar) ? (
            <Avatar className="ml-auto h-6 w-6">
              <AvatarFallback className="text-[10px]">{initials(avatar)}</AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      ) : null}
      {details.length ? (
        // The clicked card's details, under a hairline: short values two to a row, long ones (a note) full width.
        // mb-0 and font-normal: the app's global dl and dt styles (a bottom margin, bold terms) leak in otherwise.
        <dl
          className={cn(
            'mb-0 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[color:var(--sc-border)]',
            compact ? 'mt-2 pt-2' : 'mt-3 pt-2.5'
          )}
        >
          {details.map((row, i) => (
            <div key={`${row.label}-${i}`} className={cn('min-w-0', row.value.length > SHORT_DETAIL && 'col-span-2')}>
              {row.label ? (
                <dt className={cn('text-[11px] font-normal leading-4', SECONDARY_TEXT)}>{row.label}</dt>
              ) : null}
              <dd
                className={cn(
                  'm-0 break-words text-[color:var(--kb-card-title,var(--sc-card-foreground))]',
                  row.value.length > SHORT_DETAIL
                    ? 'whitespace-pre-line text-xs leading-relaxed'
                    : 'text-[13px] font-medium tabular-nums'
                )}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
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
      // In the editor a drag that starts on a card moves the card, not the whole board (the canvas skips it).
      data-tj-inner-drag=""
      onClick={() => onSelect(card)}
      // Enter activates the card as a click does (select it, onCardClicked, its details); Space picks it up to move
      // (KANBAN_KEYS). While a card is being moved, Enter drops it instead.
      onKeyDown={(e) => {
        drag.listeners?.onKeyDown?.(e);
        if (e.key === 'Enter' && !drag.isDragging && e.target === e.currentTarget) {
          e.preventDefault();
          onSelect(card);
        }
      }}
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

/** The narrowest a column gets before the board scrolls: 200px, 160px on a board of six or more stages, and down to
 *  140px when that lets every stage fit the board (three stages in a 620px half of a page cut the third at the edge,
 *  2026-10-14). 16px gaps between columns. */
export const columnMinimum = (count, boardWidth) => {
  const base = count >= 6 ? 160 : 200;
  if (!(boardWidth > 0) || count < 1) return base;
  const share = Math.floor((boardWidth - 16 * (count - 1)) / count);
  return Math.max(140, Math.min(base, share));
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
  fixed,
  maxHeight,
  minColumn = 200,
}) => {
  // A board that fits its content still stops at its drawn height (maxHeight): past it the column scrolls like a
  // fixed board's. Without the cap, 40 loans stood a board 2,274px tall (2026-10-13).
  const scrolls = fixed || !!maxHeight;
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
    if (!scrolls || !el) return undefined;
    const check = () => setMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
    check();
    el.addEventListener('scroll', check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', check);
      observer.disconnect();
    };
  }, [scrolls, column.cards.length, shownCards]);
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
        style={{ ...look.column, width: 152, flex: '0 0 152px' }}
        className={cn(
          'group/col relative flex cursor-pointer flex-col gap-2 p-3 transition-shadow hover:ring-1 hover:ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          look.columnFramed && 'border border-[color:var(--kb-column-border)]',
          isOver && 'ring-1 ring-primary'
        )}
      >
        {/* A folded lane keeps its title across, with the count on the open columns' header line: a 44px sliver of
            vertical text read as a broken column in reviews. */}
        <div className="flex items-center justify-between gap-2">
          <span className={cn('truncate text-sm font-semibold', COLUMN_TITLE)}>{column.title}</span>
          {showCount ? (
            <Badge variant="secondary" className={cn('shrink-0 px-1.5 tabular-nums', COUNT_BADGE)}>
              {column.cards.length}
            </Badge>
          ) : null}
        </div>
        <span className={cn('flex items-center gap-1 text-xs group-hover/col:text-foreground', SECONDARY_TEXT)}>
          <ChevronRight className="h-3.5 w-3.5" />
          Show cards
        </span>
      </div>
    );
  }
  return (
    <div
      ref={setNodeRef}
      data-collapsed="false"
      // A set column width is the preferred width: columns shrink to fit the board (down to the minimum, or the set
      // width if narrower) before it scrolls; five 245px stages clipped their last column. Without one the columns
      // share the board, at least the minimum each: 200px, or 160px on a board of six or more stages (a seventh
      // stage was cut off at the right edge of a full-width board). Columns grow to fill a wider board, as table
      // columns do: four 250px stages left a 165px empty strip at the right of a full-width board (2026-10-14).
      style={{
        ...(width
          ? { ...look.column, width, flex: `1 1 ${width}`, minWidth: `min(${width}, ${minColumn}px)` }
          : { ...look.column, minWidth: `${minColumn}px` }),
        ...(!fixed && maxHeight ? { maxHeight: `${maxHeight}px` } : {}),
      }}
      className={cn(
        'group/col flex flex-col p-3 transition-shadow',
        look.columnFramed && 'border border-[color:var(--kb-column-border)]',
        scrolls && 'min-h-0 overflow-hidden',
        !width && 'flex-1',
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
              className="rounded-md p-0.5 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/col:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      <div
        ref={listRef}
        style={scrolls && moreBelow ? BOTTOM_FADE : undefined}
        className={cn(
          'flex flex-col',
          compact ? 'gap-1.5' : 'gap-2',
          scrolls && '-mx-1 min-h-0 flex-1 overflow-y-auto px-1 [&>*]:shrink-0'
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

/** Where a drop lands: what is under the pointer, a card first, then a column (a folded column is a 44px strip that
 *  closestCorners passed over for a card nearby, so drops on it were lost); off the board, the nearest corners. */
/** A custom card's canvas: the components on the board's card, laid out with this card's data. With dynamic height
 *  on (in an app) the card grows with them, so a long text or an opened accordion is not cut off at cardHeight. */
const CustomCardBody = ({ id, index, width, height: cardHeight, fit, editing, darkMode }) => {
  const [ref, height] = useCanvasFit(fit, cardHeight, '[data-card-canvas]', { shrink: true });
  return (
    // In the editor, a press inside the card edits its components instead of starting a card drag.
    <div
      ref={ref}
      data-card-canvas=""
      style={{ height }}
      onPointerDown={editing ? (e) => e.stopPropagation() : undefined}
    >
      {width > 0 ? (
        <SubContainer
          id={id}
          index={index}
          canvasWidth={width}
          canvasHeight={height}
          componentType="ShadKanban"
          styles={{ backgroundColor: 'transparent' }}
          darkMode={darkMode}
        />
      ) : null}
    </div>
  );
};

export const kanbanCollision = (args) => {
  const within = pointerWithin(args);
  const cards = within.filter((c) => c.data?.droppableContainer?.data?.current?.type === 'card');
  if (cards.length) return cards;
  return within.length ? within : closestCorners(args);
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
  const [selected, setSelected] = useState(null);
  // The card whose details show (a details field is mapped): a click opens a card's details, a second click closes them.
  const [openKey, setOpenKey] = useState(null);
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
    expose('updatedCardData', boardCards(next));
    Object.entries(exposed).forEach(([key, value]) => expose(key, value));
    if (event) fire(event);
    // The native Kanban's onUpdate follows every change to the cards.
    if (event) fire('onUpdate');
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
    commit(next, { lastCardMovement: move }, 'onCardMoved');
  };

  useExposed(setExposedVariables, properties, {
    updatedCardData: boardCards(columns),
    lastSelectedCard: strip(selected),
    collapsedColumns: [...collapsedColumns],
    lastCardMovement: lastMove ?? {},
    addCard: async (card, columnId) => doAdd(card, columnId),
    updateCardData: async (id, values) => doUpdate(id, values),
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
  const boardRef = useRef(null);
  // Columns that run past the board's right edge fade out there, so the board reads as scrolling sideways (macOS hides
  // the scrollbar, and a column cut at the edge looks broken).
  const [moreRight, setMoreRight] = useState(false);
  const [boardWidth, setBoardWidth] = useState(0);
  // The board can first draw after a loading state, so the measuring follows the element itself: with an empty
  // dependency list it never attached then, and neither the fade nor the column minimum followed the board.
  const [boardEl, setBoardEl] = useState(null);
  const boardNode = useCallback((el) => {
    boardRef.current = el;
    setBoardEl(el);
  }, []);
  useEffect(() => {
    const el = boardEl;
    if (!el) return undefined;
    const check = () => {
      setMoreRight(el.scrollWidth - el.scrollLeft - el.clientWidth > 4);
      setBoardWidth(el.clientWidth);
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', check);
      observer.disconnect();
    };
  }, [boardEl]);
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
  const fitCards = custom && !editing && fitsContentInView(props.componentType ?? 'ShadKanban', properties);
  const renderBody = custom
    ? (card) => (
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
    : (card) => (
        <CardBody
          card={card}
          fields={fields}
          compact={compact}
          badgeColors={properties.badgeColors}
          progressStyle={look.progress}
          expanded={!custom && card.__key === openKey}
        />
      );
  const padding = custom ? 'p-0' : compact ? 'p-2.5' : 'p-3';

  const enabled = !properties.disabledState;
  // Custom cards don't drag in the editor, where a press edits the card's components.
  const draggable = properties.allowDrag !== false && enabled && !properties.loadingState && !(custom && editing);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: kanbanCoordinates, keyboardCodes: KANBAN_KEYS })
  );
  // What a screen reader hears while a card moves: its title and the column's, not dnd-kit's ids.
  const titleOfCard = (key) => {
    const card = live.current.columns.flatMap((c) => c.cards).find((c) => c.__key === String(key));
    const t = card?.[fields.title];
    return typeof t === 'string' || typeof t === 'number' ? String(t) : 'card';
  };
  const titleOfColumn = (overId) => {
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
  const select = (card) => {
    if (fields.details) setOpenKey((current) => (current === card.__key ? null : card.__key));
    setSelected(card);
    setExposedVariable('lastSelectedCard', strip(card));
    fireEvent('onCardSelected');
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
  // Reloading a board that has cards (a query refetching after a move) keeps the board on screen under a spinner,
  // instead of swapping it for a loading look: the swap unmounted the drag context, so a drag made while the data
  // came back was lost, and the board flashed on every move. The board takes no input until the data is back.
  const reloading = !!properties.loadingState && columns.some((c) => c.cards.length);
  const shellProps = reloading ? { ...props, properties: { ...properties, loadingState: false } } : props;
  return (
    <Shell {...shellProps} innerRef={ref} className={cn(fixed && 'h-full', reloading && 'relative')}>
      {reloading ? (
        <div
          aria-busy="true"
          // A firmer scrim, and the spinner on a chip of its own: bare over a 45% scrim it sat on a card's title.
          className="absolute inset-0 z-10 flex items-center justify-center rounded-[var(--sc-radius)] bg-[color:color-mix(in_srgb,var(--sc-background)_65%,transparent)]"
        >
          <span className="flex items-center justify-center rounded-full border border-[color:var(--sc-border)] bg-[color:var(--sc-background)] p-2 shadow-sm">
            <Spinner className="h-5 w-5" />
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
            'flex gap-[var(--kb-col-gap,1rem)] overflow-x-auto pb-1',
            fixed && 'h-full items-stretch',
            reloading && 'pointer-events-none'
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
