import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, X } from 'lucide-react';
import { cn } from '../lib/cn';
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
  type BoardCard,
  type BoardColumn,
  type CardMove,
} from '../lib/ui2/display/kanban/board';
import { dropPointAt, NO_TOUCH, useTouchDragRef, type TouchDragOptions } from '../lib/ui2/display/kanban/touchDrag';
import { BADGE_BY_WORD, badgeLook, columnMinimum, cssLength, fieldName, initials, isSet, kanbanVars } from '../lib/ui2/display/kanban/look';
import { ColumnsSkel, LoadingBox, LoadingFrame, Scrim, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useDrawnNumber, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import '../styles/ui2-display-kanban.css';

// UI 2.0's Kanban (ShadKanban): a data-driven board. Columns are values of a status field and cards are rows of data
// shown by the fields the author maps (title, description, badge, tags, progress, meta, avatar, details), or rows of
// ToolJet components (cardLayout 'custom', read as {{cardData}}, as UI 2.0's, or {{listItem}}). Dragging, the delete buttons and the actions change
// the board at once and publish the change (updatedCardData, the last added, moved, updated or removed card, and an
// event) for a query to save; the board follows the data again when the data changes.

type CardFields = { title: string; description: string; badge: string; tags: string; progress: string; avatar: string; meta: string; details: string };

// A board draws this many cards a column at first, then this many more per "Show more"; columns the same way.
const CARDS_PER_STEP = 100;
const MAX_BOARD_COLUMNS = 50;
// A detail longer than this takes the card's full width; shorter ones (an amount, a date) sit two to a row.
const SHORT_DETAIL = 22;
const KEYBOARD_HELP = 'Press Enter to open a card. To move it, press Space, use the arrow keys, then Space or Enter to drop it. Escape cancels.';

const strip = (card: BoardCard | null | undefined): Record<string, unknown> => {
  if (!card) return {};
  const { __key, ...plain } = card;
  return plain;
};
const asTags = (value: unknown): string[] =>
  (Array.isArray(value) ? value : isSet(value) ? String(value).split(',') : [])
    .map((tag) => String((tag && typeof tag === 'object' ? (tag as Record<string, unknown>).label : tag) ?? '').trim())
    .filter(Boolean);
// A card's text: a stored ISO date or timestamp as a short date, anything else as written.
const shown = (value: unknown): string => cardDateLabel(value) ?? String(value);

const CardBody = ({ card, fields, badgeColors, expanded }: { card: BoardCard; fields: CardFields; badgeColors: unknown; expanded: boolean }) => {
  const badge = fields.badge ? card[fields.badge] : undefined;
  const avatar = fields.avatar ? card[fields.avatar] : undefined;
  const meta = fields.meta ? card[fields.meta] : undefined;
  const tags = fields.tags ? asTags(card[fields.tags]) : [];
  const progress = fields.progress && isSet(card[fields.progress]) ? Number(card[fields.progress]) : NaN;
  const details = expanded && fields.details ? cardDetails(card[fields.details]) : [];
  const mapped = isSet(badge) ? badgeLook(badge, badgeColors) : null;
  return (
    <>
      <p className="ui2-kb-card-title">{String(card[fields.title] ?? '')}</p>
      {fields.description && isSet(card[fields.description]) ? <p className="ui2-kb-card-text">{shown(card[fields.description])}</p> : null}
      {tags.length ? (
        <div className="ui2-kb-tags">
          {tags.map((tag) => (
            <span key={tag} className="ui2-kb-badge ui2-kb-badge--outline ui2-kb-tag">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      {Number.isFinite(progress) ? (
        <div className="ui2-kb-progress">
          <span className="ui2-kb-bar" role="progressbar" aria-label="Progress" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
          </span>
          <span className="ui2-kb-pct">{Math.round(progress)}%</span>
        </div>
      ) : null}
      {isSet(badge) || isSet(avatar) || isSet(meta) ? (
        <div className="ui2-kb-foot">
          {isSet(badge) ? (
            <span
              className={cn('ui2-kb-badge', mapped ? 'ui2-kb-badge--mapped' : `ui2-kb-badge--${BADGE_BY_WORD[String(badge).toLowerCase()] || 'outline'}`)}
              style={mapped ?? undefined}
            >
              {String(badge)}
            </span>
          ) : null}
          {isSet(meta) ? (
            <span className="ui2-kb-meta" title={String(meta)}>
              {shown(meta)}
            </span>
          ) : null}
          {isSet(avatar) ? (
            <span className="ui2-kb-avatar" title={String(avatar)}>
              {initials(avatar)}
            </span>
          ) : null}
        </div>
      ) : null}
      {details.length ? (
        <dl className="ui2-kb-details">
          {details.map((row, i) => (
            <div key={`${row.label}-${i}`} className={cn(row.value.length > SHORT_DETAIL && 'is-long')}>
              {row.label ? <dt>{row.label}</dt> : null}
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </>
  );
};

interface CardProps {
  card: BoardCard;
  columnId: string;
  body: React.ReactNode;
  custom: boolean;
  collapsedHeight: unknown;
  expanded: boolean;
  onToggleExpanded: (key: string) => void;
  selected: boolean;
  draggable: boolean;
  dragging: boolean;
  picked: boolean;
  onSelect: (card: BoardCard) => void;
  onDelete?: (card: BoardCard) => void;
  onDragStart: (key: string) => void;
  onDragEnd: () => void;
  onDragOverCard: (e: React.DragEvent, columnId: string, key: string) => void;
  onKey: (e: React.KeyboardEvent, card: BoardCard, columnId: string) => void;
}

const KanbanCard = ({
  card,
  columnId,
  body,
  custom,
  collapsedHeight,
  expanded,
  onToggleExpanded,
  selected,
  draggable,
  dragging,
  picked,
  onSelect,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOverCard,
  onKey,
}: CardProps) => {
  // Collapsed height: the content's natural height decides whether the card collapses at all.
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!isSet(collapsedHeight) || !el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => setContentHeight(el.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [collapsedHeight]);
  const clamp = custom ? { collapsible: false, maxHeight: undefined } : cardClamp(collapsedHeight, contentHeight, expanded);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-roledescription="Draggable card"
      data-kb-card={card.__key}
      aria-describedby="ui2-kb-help"
      aria-pressed={selected}
      // In the editor a drag that starts on a card moves the card, not the whole widget.
      data-tj-inner-drag=""
      draggable={draggable}
      className={cn('ui2-kb-card', custom && 'is-custom', draggable && 'is-draggable', selected && 'is-selected', dragging && 'is-dragging', picked && 'is-picked')}
      onClick={() => onSelect(card)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        onKey(e, card, columnId);
      }}
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.__key);
        onDragStart(card.__key);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOverCard(e, columnId, card.__key)}
    >
      {onDelete ? (
        <button
          type="button"
          className="ui2-kb-card-del"
          aria-label="Delete card"
          title="Delete card"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card);
          }}
        >
          <X />
        </button>
      ) : null}
      <div className={cn('ui2-kb-clamp', !!clamp.maxHeight && 'is-clamped')} style={clamp.collapsible ? { maxHeight: clamp.maxHeight } : undefined}>
        <div ref={contentRef}>{body}</div>
      </div>
      {clamp.collapsible ? (
        <button
          type="button"
          className="ui2-kb-more"
          aria-expanded={expanded}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpanded(card.__key);
          }}
        >
          {expanded ? <ChevronUp /> : <ChevronDown />}
          {expanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  );
};

/** A column's card list: scrolls inside the board, fading out at the bottom while more cards are below. */
const CardList = ({ collapsed, depsKey, children }: { collapsed: boolean; depsKey: string; children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const check = () => setMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
    check();
    el.addEventListener('scroll', check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', check);
      observer.disconnect();
    };
  }, [depsKey, collapsed]);
  return (
    <div ref={ref} className={cn('ui2-kb-list', moreBelow && 'has-more-below')} style={collapsed ? { display: 'none' } : undefined}>
      {children}
    </div>
  );
};

export const Kanban = () => {
  const [data] = ToolJet.useStateArray({
    name: 'data',
    label: 'Cards',
    description: 'Array of card objects, e.g. {{queries.getTasks.data}}.',
    initialValue: [
      { id: 1, title: 'Draft the brief', status: 'todo', priority: 'High', owner: 'Ada Lovelace' },
      { id: 2, title: 'Review designs', status: 'doing', priority: 'Medium', owner: 'Alan Turing' },
      { id: 3, title: 'Ship v1', status: 'done', priority: 'Low', owner: 'Grace Hopper' },
    ],
  });
  const [columns] = ToolJet.useStateArray({
    name: 'columns',
    label: 'Columns (in order)',
    description: 'Array of { id, title } (a color adds a dot). A status no column lists gets a column at the end.',
    initialValue: [
      { id: 'todo', title: 'To do' },
      { id: 'doing', title: 'In progress' },
      { id: 'done', title: 'Done' },
    ],
  });
  const [statusFieldRaw] = ToolJet.useStateString({ name: 'statusField', label: 'Status field', initialValue: 'status' });
  const [idFieldRaw] = ToolJet.useStateString({ name: 'idField', label: 'Id field', initialValue: 'id' });
  const [cardLayout] = ToolJet.useStateEnumeration({
    name: 'cardLayout',
    label: 'Card content',
    enumDefinition: ['fields', 'custom'],
    enumLabels: { fields: 'Fields', custom: 'Custom' },
    initialValue: 'fields',
    inspector: 'switch',
    description: 'Custom: each card is a row of ToolJet components reading the card as {{cardData}}, e.g. {{cardData.title}} ({{listItem}} works too).',
  });
  const [cardHeight] = ToolJet.useStateNumber({
    name: 'cardHeight',
    label: 'Card height (custom content)',
    initialValue: 96,
    min: 24,
    max: 1200,
    visibleWhen: { key: 'cardLayout', value: 'custom' },
  });
  const [titleField] = ToolJet.useStateString({ name: 'titleField', label: 'Title field', initialValue: 'title' });
  const [descriptionField] = ToolJet.useStateString({ name: 'descriptionField', label: 'Description field', initialValue: '' });
  const [badgeField] = ToolJet.useStateString({ name: 'badgeField', label: 'Badge field (priority, severity)', initialValue: 'priority' });
  const [tagsField] = ToolJet.useStateString({ name: 'tagsField', label: 'Tags field (a list)', initialValue: '' });
  const [progressField] = ToolJet.useStateString({ name: 'progressField', label: 'Progress field (0 to 100)', initialValue: '' });
  const [metaField] = ToolJet.useStateString({ name: 'metaField', label: 'Meta field (a date, a count)', initialValue: '' });
  const [avatarField] = ToolJet.useStateString({ name: 'avatarField', label: 'Avatar field (a name)', initialValue: 'owner' });
  const [detailsField] = ToolJet.useStateString({ name: 'detailsField', label: 'Details field (shown on the clicked card)', initialValue: '' });
  const [density] = ToolJet.useStateEnumeration({
    name: 'density',
    label: 'Card density',
    enumDefinition: ['comfortable', 'compact'],
    enumLabels: { comfortable: 'Comfortable', compact: 'Compact' },
    initialValue: 'comfortable',
    inspector: 'switch',
  });
  const [collapsedHeight] = ToolJet.useStateString({ name: 'collapsedHeight', label: 'Collapsed card height (px, empty: show all)', initialValue: '' });
  const [columnWidthRaw] = ToolJet.useStateString({ name: 'columnWidth', label: 'Column width (px, empty: fill the board)', initialValue: '' });
  const [showCount] = ToolJet.useStateBoolean({ name: 'showCount', label: 'Card count on columns', initialValue: true });
  const [collapsibleColumns] = ToolJet.useStateBoolean({ name: 'collapsibleColumns', label: 'Collapsible columns', initialValue: true });
  const [collapsedColumns, setCollapsedColumns] = ToolJet.useStateArray({ name: 'collapsedColumns', label: 'Columns collapsed at start (ids)', initialValue: [] });
  const [allowDrag] = ToolJet.useStateBoolean({ name: 'allowDrag', label: 'Drag to move', initialValue: true });
  const [allowAdd] = ToolJet.useStateBoolean({ name: 'allowAdd', label: 'Add card button on columns', initialValue: false });
  const [allowDelete] = ToolJet.useStateBoolean({ name: 'allowDelete', label: 'Delete button on cards', initialValue: false });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty column message', initialValue: 'No cards' });
  const [badgeColors] = ToolJet.useStateObject({
    name: 'badgeColors',
    label: 'Badge colours by value',
    description: "Badge value to colour, e.g. { High: '#dc2626' }, or { text, background }.",
    initialValue: {},
  });
  // Exposed values.
  const [, setUpdatedCardData] = ToolJet.useStateArray({ name: 'updatedCardData', initialValue: [], inspector: 'hidden' });
  const [, setLastSelectedCard] = ToolJet.useStateObject({ name: 'lastSelectedCard', initialValue: {}, inspector: 'hidden' });
  const [, setLastCardMovement] = ToolJet.useStateObject({ name: 'lastCardMovement', initialValue: {}, inspector: 'hidden' });
  const [, setAddCardColumn] = ToolJet.useStateString({ name: 'addCardColumn', initialValue: '', inspector: 'hidden' });
  const [, setLastAddedCard] = ToolJet.useStateObject({ name: 'lastAddedCard', initialValue: {}, inspector: 'hidden' });
  const [, setLastUpdatedCard] = ToolJet.useStateObject({ name: 'lastUpdatedCard', initialValue: {}, inspector: 'hidden' });
  const [, setLastRemovedCard] = ToolJet.useStateObject({ name: 'lastRemovedCard', initialValue: {}, inspector: 'hidden' });
  const onCardMoved = ToolJet.useEventCallback({ name: 'onCardMoved' });
  const onAddCardClick = ToolJet.useEventCallback({ name: 'onAddCardClick' });
  const onCardAdded = ToolJet.useEventCallback({ name: 'onCardAdded' });
  const onCardUpdated = ToolJet.useEventCallback({ name: 'onCardUpdated' });
  const onCardRemoved = ToolJet.useEventCallback({ name: 'onCardRemoved' });
  const onCardSelected = ToolJet.useEventCallback({ name: 'onCardSelected' });
  const onUpdate = ToolJet.useEventCallback({ name: 'onUpdate' });
  const styles: Record<string, unknown> = {
    accentColor: useThemeColor('accentColor', 'Accent (selection, progress, drop line)', TOKEN.brand),
    columnBackgroundColor: useThemeColor('columnBackgroundColor', 'Column background', TOKEN.muted),
    columnBorderColor: useThemeColor('columnBorderColor', 'Column border color', 'transparent'),
    columnTitleColor: useThemeColor('columnTitleColor', 'Column title color', TOKEN.text),
    columnCountBackgroundColor: useThemeColor('columnCountBackgroundColor', 'Column count background', TOKEN.brand),
    columnCountTextColor: useThemeColor('columnCountTextColor', 'Column count text color', TOKEN.brand),
    columnGap: useDrawnNumber('columnGap', 'Gap between columns', 16),
    columnBorderRadius: useThemeRadius('columnBorderRadius', 'Column radius'),
    cardBackgroundColor: useThemeColor('cardBackgroundColor', 'Card background', TOKEN.surface),
    cardBorderColor: useThemeColor('cardBorderColor', 'Card border color', TOKEN.border),
    cardTitleColor: useThemeColor('cardTitleColor', 'Card title color', TOKEN.text),
    cardTextColor: useThemeColor('cardTextColor', 'Card secondary text color', TOKEN.mutedText),
    progressColor: useThemeColor('progressColor', 'Progress color (else the accent)', TOKEN.brand),
    cardBorderRadius: useThemeRadius('cardBorderRadius', 'Card radius'),
    cardShadow: ToolJet.useStyleEnumeration({
      name: 'cardShadow',
      label: 'Card shadow',
      enumDefinition: ['none', 'sm', 'md', 'lg'],
      enumLabels: { none: 'None', sm: 'Small', md: 'Medium', lg: 'Large' },
      initialValue: 'sm',
    }),
  };
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 43, defaultHeight: 46 });

  const statusField = fieldName(statusFieldRaw, 'status');
  const idField = fieldName(idFieldRaw, 'id');
  const fields: CardFields = {
    title: fieldName(titleField, 'title'),
    description: fieldName(descriptionField, ''),
    badge: fieldName(badgeField, ''),
    tags: fieldName(tagsField, ''),
    progress: fieldName(progressField, ''),
    avatar: fieldName(avatarField, ''),
    meta: fieldName(metaField, ''),
    details: fieldName(detailsField, ''),
  };
  const compact = density === 'compact';
  const custom = cardLayout === 'custom';

  const fromData = useMemo(
    () => boardColumns(Array.isArray(data) ? data : [], Array.isArray(columns) ? columns : [], statusField, idField),
    [data, columns, statusField, idField]
  );
  const [board, setBoard] = useState<BoardColumn[]>(fromData);
  useEffect(() => setBoard(fromData), [fromData]);
  const allCards = useMemo(() => board.flatMap((c) => c.cards), [board]);

  // Selection, open details and expanded cards are kept by card key and read from the current board.
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const toggleExpanded = (key: string) =>
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const collapsed = useMemo(() => new Set((Array.isArray(collapsedColumns) ? collapsedColumns : []).map(String)), [collapsedColumns]);
  const toggleColumn = (columnId: string) => {
    const next = new Set(collapsed);
    if (next.has(columnId)) next.delete(columnId);
    else next.add(columnId);
    setCollapsedColumns([...next]);
  };
  const [shownColumns, setShownColumns] = useState(MAX_BOARD_COLUMNS);
  const [shownCards, setShownCards] = useState<Record<string, number>>({});
  const shownOf = (columnId: string) => shownCards[columnId] ?? CARDS_PER_STEP;

  // Actions and handlers run later: they read the board from a ref, so two in a row see each other's change.
  const live = useRef({ board, statusField, idField });
  live.current = { board, statusField, idField };
  const commit = (next: BoardColumn[], exposed: () => void, event: () => void) => {
    live.current.board = next;
    setBoard(next);
    setUpdatedCardData(boardCards(next));
    exposed();
    event();
    // The native Kanban's onUpdate follows every change to the cards.
    onUpdate();
  };
  const doAdd = (card: unknown, columnId: unknown) => {
    const { board: cols, statusField: sf, idField: idf } = live.current;
    const result = addCard(cols, card && typeof card === 'object' ? card : {}, isSet(columnId) ? String(columnId) : undefined, sf, idf);
    commit(result.columns, () => setLastAddedCard(result.card), onCardAdded);
  };
  const doUpdate = (id: unknown, values: unknown) => {
    const { board: cols, statusField: sf, idField: idf } = live.current;
    const result = updateCard(cols, id, values ?? {}, sf, idf);
    if (!result.card) return;
    const card = result.card;
    setSelectedKey((current) => (current === String(id ?? '') ? result.key : current));
    commit(result.columns, () => setLastUpdatedCard(card), onCardUpdated);
  };
  const doDelete = (id: unknown) => {
    const result = deleteCard(live.current.board, id);
    if (!result.card) return;
    const card = result.card;
    commit(result.columns, () => setLastRemovedCard(card), onCardRemoved);
  };
  const doMove = (id: unknown, toColumnId: unknown, beforeKey: unknown = null) => {
    const { board: cols, statusField: sf, idField: idf } = live.current;
    const { columns: next, move } = moveCard(cols, id, toColumnId, beforeKey, sf, idf);
    if (!move) return;
    const m: CardMove = move;
    commit(next, () => setLastCardMovement(m as unknown as Record<string, unknown>), onCardMoved);
  };
  // A keyboard drop can land past its column's "Show more" window, and a card that changes column remounts: widen the
  // windows to include it and give it focus back once it is drawn, so keyboard focus does not fall to the page.
  const refocusKey = useRef<string | null>(null);
  const revealCard = (key: string) => {
    const cols = live.current.board;
    const colAt = cols.findIndex((c) => c.cards.some((x) => x.__key === key));
    if (colAt < 0) return;
    const { id, cards } = cols[colAt];
    const at = cards.findIndex((x) => x.__key === key);
    const step = (n: number, size: number) => Math.ceil((n + 1) / size) * size;
    setShownCards((n) => (at < (n[id] ?? CARDS_PER_STEP) ? n : { ...n, [id]: step(at, CARDS_PER_STEP) }));
    setShownColumns((n) => (colAt < n ? n : step(colAt, MAX_BOARD_COLUMNS)));
    refocusKey.current = key;
  };
  useLayoutEffect(() => {
    const key = refocusKey.current;
    if (!key) return;
    refocusKey.current = null;
    const el = Array.from(boardRef.current?.querySelectorAll<HTMLElement>('[data-kb-card]') ?? []).find((c) => c.dataset.kbCard === key);
    el?.focus();
  });

  ToolJet.useAction(
    {
      name: 'addCard',
      displayName: 'Add card',
      params: [
        { handle: 'card', displayName: 'Card', defaultValue: "{{{ title: 'New card' }}}" },
        { handle: 'columnId', displayName: 'Column id (optional)', defaultValue: '' },
      ],
    },
    (card, columnId) => doAdd(card, columnId)
  );
  ToolJet.useAction(
    {
      name: 'moveCard',
      displayName: 'Move card',
      params: [
        { handle: 'id', displayName: 'Card id', defaultValue: '' },
        { handle: 'columnId', displayName: 'Column id', defaultValue: '' },
      ],
    },
    (id, columnId) => doMove(id, columnId)
  );
  ToolJet.useAction({ name: 'deleteCard', displayName: 'Delete card', params: [{ handle: 'id', displayName: 'Card id', defaultValue: '' }] }, (id) => doDelete(id));
  ToolJet.useAction(
    {
      name: 'updateCardData',
      displayName: 'Update card data',
      params: [
        { handle: 'id', displayName: 'Card id', defaultValue: '' },
        { handle: 'value', displayName: 'Values', defaultValue: "{{{ title: 'Renamed' }}}" },
      ],
    },
    (id, value) => doUpdate(id, value)
  );

  // Custom cards: rows of ToolJet components, one per card in board order, each placed in its column by RowSlot. A
  // card grows to fit its components (text that wraps in a narrow column pushes the ones below it down), never below
  // its card height, and the card wraps its row, so it is drawn at the row's height.
  const order = useMemo(() => new Map(allCards.map((c, i) => [c.__key, i])), [allCards]);
  const rowItems = useMemo(() => (custom ? allCards.map(strip) : []), [custom, allCards]);
  ToolJet.useRows(rowItems, Math.min(1200, Math.max(24, Number(cardHeight) || 96)), { fit: true });

  // Board size: columns share its width (columnMinimum) and it fades at the right while more columns are off screen.
  // The board element, with long-press touch moves bound to it (options set below).
  const touch = useRef<TouchDragOptions>(NO_TOUCH);
  const boardRef = useTouchDragRef(touch);
  const [boardWidth, setBoardWidth] = useState(0);
  const [moreRight, setMoreRight] = useState(false);
  useEffect(() => {
    const el = boardRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const check = () => {
      setBoardWidth(el.clientWidth);
      setMoreRight(el.scrollWidth - el.scrollLeft - el.clientWidth > 4);
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(el);
    // The columns too: their widths follow boardWidth after the first check, which can end the overflow without
    // resizing the board, and the fade stayed over columns that all fit.
    Array.from(el.children).forEach((child) => observer.observe(child));
    return () => {
      el.removeEventListener('scroll', check);
      observer.disconnect();
    };
  }, [board.length, collapsed]);
  // And once the width-dependent columns have been laid out at the new board width.
  useLayoutEffect(() => {
    const el = boardRef.current;
    if (el) setMoreRight(el.scrollWidth - el.scrollLeft - el.clientWidth > 4);
  }, [boardWidth]);

  // Dragging: the dragged card's key and where it would land (a column, before a card or at the end).
  const { disabled } = ToolJet.useControlState();
  const draggable = allowDrag !== false && !disabled;
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [target, setTarget] = useState<{ columnId: string; before: string | null } | null>(null);
  // A keyboard move: Space picks a card up, arrows move its landing place, Space or Enter drops, Escape cancels.
  const [picked, setPicked] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const endDrag = () => {
    setDragKey(null);
    setPicked(null);
    setTarget(null);
  };
  const titleOf = (key: string) => {
    const t = allCards.find((c) => c.__key === key)?.[fields.title];
    return typeof t === 'string' || typeof t === 'number' ? String(t) : 'card';
  };
  const columnTitle = (id: string) => board.find((c) => c.id === id)?.title ?? id;
  const onDragOverCard = (e: React.DragEvent, columnId: string, key: string) => {
    if (!dragKey || !draggable) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    // The upper half of a card lands before it, the lower half before the next card.
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cards = board.find((c) => c.id === columnId)?.cards ?? [];
    const at = cards.findIndex((c) => c.__key === key);
    const before = e.clientY < rect.top + rect.height / 2 ? key : cards[at + 1]?.__key ?? null;
    if (target?.columnId !== columnId || target.before !== before) setTarget({ columnId, before });
  };
  const onDragOverColumn = (e: React.DragEvent, columnId: string) => {
    if (!dragKey || !draggable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (target?.columnId !== columnId) setTarget({ columnId, before: null });
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // Dropped just before itself, the card stays where it is.
    if (dragKey && target && draggable && target.before !== dragKey) doMove(dragKey, target.columnId, target.before);
    endDrag();
  };
  // A touch move (phones fire no HTML drag): a long press picks the card up, the finger shows where it would land (the
  // same target and drop line) and lifting it drops the card through the same move as a mouse drop.
  const touchTarget = useRef<{ columnId: string; before: string | null } | null>(null);
  touch.current = {
    enabled: draggable && !ld.loading,
    onPick: (key) => {
      touchTarget.current = null;
      setDragKey(key);
      setPicked(null);
    },
    onOver: (x, y) => {
      const t = dropPointAt(boardRef.current, live.current.board, x, y);
      if (!t) return;
      touchTarget.current = t;
      setTarget((current) => (current?.columnId === t.columnId && current.before === t.before ? current : t));
    },
    onDrop: (key) => {
      const t = touchTarget.current;
      touchTarget.current = null;
      if (t && t.before !== key) doMove(key, t.columnId, t.before);
      endDrag();
    },
    onCancel: () => {
      touchTarget.current = null;
      endDrag();
    },
  };
  const select = (card: BoardCard) => {
    if (fields.details) setOpenKey((current) => (current === card.__key ? null : card.__key));
    setSelectedKey(card.__key);
    setLastSelectedCard(strip(card));
    onCardSelected();
  };
  const onCardKey = (e: React.KeyboardEvent, card: BoardCard, columnId: string) => {
    const key = card.__key;
    if (picked === key) {
      const t = target ?? { columnId, before: null };
      const colIndex = board.findIndex((c) => c.id === t.columnId);
      const others = (board[colIndex]?.cards ?? []).filter((c) => c.__key !== key);
      const found = t.before === null ? -1 : others.findIndex((c) => c.__key === t.before);
      const at = found < 0 ? others.length : found;
      let next = t;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const to = board[colIndex + (e.key === 'ArrowRight' ? 1 : -1)];
        if (to) next = { columnId: to.id, before: null };
      } else if (e.key === 'ArrowUp') next = { columnId: t.columnId, before: others[Math.max(0, at - 1)]?.__key ?? null };
      else if (e.key === 'ArrowDown') next = { columnId: t.columnId, before: at + 1 >= others.length ? null : others[at + 1].__key };
      else if (e.key === ' ' || e.key === 'Enter' || e.key === 'Tab') {
        if (e.key !== 'Tab') e.preventDefault();
        doMove(key, t.columnId, t.before);
        revealCard(key);
        setAnnounce(`${titleOf(key)} dropped in ${columnTitle(t.columnId)}.`);
        endDrag();
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setAnnounce(`Moving ${titleOf(key)} cancelled.`);
        endDrag();
        return;
      } else return;
      e.preventDefault();
      setTarget(next);
      setAnnounce(`${titleOf(key)} is over ${columnTitle(next.columnId)}.`);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      select(card);
    } else if (e.key === ' ' && draggable) {
      e.preventDefault();
      const cards = board.find((c) => c.id === columnId)?.cards ?? [];
      const at = cards.findIndex((c) => c.__key === key);
      setPicked(key);
      setTarget({ columnId, before: cards[at + 1]?.__key ?? null });
      setAnnounce(`Picked up ${titleOf(key)}.`);
    }
  };
  const onAdd = (column: BoardColumn) => {
    setAddCardColumn(column.id);
    onAddCardClick();
  };

  const columnWidth = cssLength(columnWidthRaw);
  const visibleColumns = board.slice(0, shownColumns);
  const gap = isSet(styles.columnGap) ? Number(styles.columnGap) || 16 : 16;
  const minColumn = columnMinimum(visibleColumns.length, boardWidth, gap);
  const moving = dragKey ?? picked;
  // Reloading a board that has cards keeps it on screen under a scrim (UI 2.0): swapping it for a loading look lost a
  // drag made while the data came back, and the board flashed on every move.
  const reloading = ld.loading && allCards.length > 0;

  return (
    <LoadingFrame loading={ld.loading} visible={reloading} look={reloading ? <Scrim /> : ld.skeleton ? <ColumnsSkel /> : <LoadingBox />}>
      <div
        ref={boardRef}
        className={cn('ui ui2-kb', compact && 'is-compact', moreRight && 'has-more-right')}
        data-tj-no-drag=""
        style={kanbanVars(styles)}
        onDragEnd={endDrag}
      >
        <span id="ui2-kb-help" className="ui2-kb-sr">
          {KEYBOARD_HELP}
        </span>
        <span className="ui2-kb-sr" aria-live="polite">
          {announce}
        </span>
        {visibleColumns.map((column) => {
          const isCollapsed = collapsed.has(column.id);
          const over = !!moving && target?.columnId === column.id;
          const cards = column.cards.slice(0, shownOf(column.id));
          const hidden = column.cards.length - cards.length;
          const toggle = () => toggleColumn(column.id);
          // The drop line, where the moving card would land; none right before or after the card itself.
          const dropLine = (before: string | null) => {
            if (!over || target?.before !== before || !moving) return null;
            const at = before === null ? cards.length : cards.findIndex((c) => c.__key === before);
            if (before === moving || cards[at - 1]?.__key === moving) return null;
            return <div className="ui2-kb-drop" aria-hidden="true" />;
          };
          const count = showCount !== false ? <span className="ui2-kb-count">{column.cards.length}</span> : null;
          const title = (
            <span className="ui2-kb-title">
              {column.color ? <span className="ui2-kb-dot" style={{ background: column.color }} /> : null}
              <span>{column.title}</span>
            </span>
          );
          return (
            <section
              key={column.id}
              data-kb-col={column.id}
              className={cn('ui2-kb-col', isCollapsed && 'is-collapsed', !isCollapsed && !columnWidth && 'is-fill', over && 'is-over')}
              style={
                isCollapsed
                  ? undefined
                  : columnWidth
                  ? { width: columnWidth, flex: `1 1 ${columnWidth}`, minWidth: `min(${columnWidth}, ${minColumn}px)` }
                  : { minWidth: `${minColumn}px` }
              }
              {...(isCollapsed
                ? {
                    role: 'button',
                    tabIndex: 0,
                    title: `Expand ${column.title}`,
                    'aria-label': `Expand ${column.title}`,
                    onClick: toggle,
                    onKeyDown: (e: React.KeyboardEvent) => {
                      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        toggle();
                      }
                    },
                  }
                : {})}
              onDragOver={(e) => onDragOverColumn(e, column.id)}
              onDrop={onDrop}
            >
              {isCollapsed ? (
                <div className="ui2-kb-head">
                  {title}
                  {count}
                </div>
              ) : (
                <div className="ui2-kb-head">
                  {title}
                  <div className="ui2-kb-head-end">
                    {count}
                    {collapsibleColumns !== false ? (
                      <button type="button" className="ui2-kb-fold" title={`Collapse ${column.title}`} aria-label={`Collapse ${column.title}`} onClick={toggle}>
                        <ChevronLeft />
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
              <CardList collapsed={isCollapsed} depsKey={`${column.cards.length}:${cards.length}`}>
                {cards.length ? (
                  cards.map((card) => (
                    <React.Fragment key={card.__key}>
                      {dropLine(card.__key)}
                      <KanbanCard
                        card={card}
                        columnId={column.id}
                        custom={custom}
                        body={
                          custom ? (
                            <ToolJet.RowSlot name="card" index={order.get(card.__key) ?? 0} item={strip(card)} />
                          ) : (
                            <CardBody card={card} fields={fields} badgeColors={badgeColors} expanded={card.__key === openKey} />
                          )
                        }
                        collapsedHeight={isSet(collapsedHeight) ? collapsedHeight : ''}
                        expanded={expandedKeys.has(card.__key)}
                        onToggleExpanded={toggleExpanded}
                        selected={card.__key === selectedKey}
                        draggable={draggable && !picked}
                        dragging={dragKey === card.__key}
                        picked={picked === card.__key}
                        onSelect={select}
                        onDelete={allowDelete === true ? (c) => doDelete(c.__key) : undefined}
                        onDragStart={(key) => {
                          setDragKey(key);
                          setPicked(null);
                        }}
                        onDragEnd={endDrag}
                        onDragOverCard={onDragOverCard}
                        onKey={onCardKey}
                      />
                    </React.Fragment>
                  ))
                ) : (
                  <div className="ui2-kb-empty">{String(emptyText || 'No cards')}</div>
                )}
                {cards.length ? dropLine(null) : null}
                {hidden > 0 ? (
                  <button
                    type="button"
                    className="ui2-kb-btn"
                    onClick={() => setShownCards((n) => ({ ...n, [column.id]: (n[column.id] ?? CARDS_PER_STEP) + CARDS_PER_STEP }))}
                  >
                    Show {Math.min(hidden, CARDS_PER_STEP)} more
                  </button>
                ) : null}
                {allowAdd === true ? (
                  <button type="button" className="ui2-kb-btn" onClick={() => onAdd(column)}>
                    <Plus />
                    Add card
                  </button>
                ) : null}
              </CardList>
              {isCollapsed ? (
                <span className="ui2-kb-show">
                  <ChevronRight />
                  Show cards
                </span>
              ) : null}
            </section>
          );
        })}
        {board.length > shownColumns ? (
          <button
            type="button"
            className="ui2-kb-btn"
            style={{ alignSelf: 'flex-start', whiteSpace: 'nowrap' }}
            onClick={() => setShownColumns((n) => n + MAX_BOARD_COLUMNS)}
          >
            Show {Math.min(board.length - shownColumns, MAX_BOARD_COLUMNS)} more
          </button>
        ) : null}
      </div>
    </LoadingFrame>
  );
};
