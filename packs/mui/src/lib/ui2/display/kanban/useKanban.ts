import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import {
  addCard,
  boardCards,
  boardColumns,
  deleteCard,
  moveCard,
  updateCard,
  type BoardCard,
  type BoardColumn,
  type CardMove,
} from './board';
import { columnMinimum, cssLength, fieldName, isSet, kanbanVars } from './look';

// The shadcn pack's Kanban (UI 2.0's ShadKanban) without its markup: the properties, styles, exposed values, events and
// actions, the board state, dragging and the keyboard move. A pack draws the board from what this returns in its own
// library's parts. Shared as is by the MUI and Ant packs (keep the copies the same).

export type CardFields = { title: string; description: string; badge: string; tags: string; progress: string; avatar: string; meta: string; details: string };

export type KanbanOptions = {
  /** The cards property: the native and shadcn name is data; the Ant pack keeps its own dataSource. */
  dataName: string;
  sample: unknown[];
  columns: unknown[];
  /** Card fields mapped on a fresh drop. */
  defaults: Partial<CardFields>;
  /** The action parameter handles for the card id and its new values. */
  params: { id: string; values: string };
  /** The card shadow on a fresh drop (the library's own card look). */
  shadow: 'none' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
};

export type DropTarget = { columnId: string; before: string | null };

// A board draws this many cards a column at first, then this many more per "Show more"; columns the same way.
export const CARDS_PER_STEP = 100;
export const MAX_BOARD_COLUMNS = 50;
// A detail longer than this takes the card's full width; shorter ones (an amount, a date) sit two to a row.
export const SHORT_DETAIL = 22;
export const KEYBOARD_HELP = 'Press Enter to open a card. To move it, press Space, use the arrow keys, then Space or Enter to drop it. Escape cancels.';

export const strip = (card: BoardCard | null | undefined): Record<string, unknown> => {
  if (!card) return {};
  const { __key, ...plain } = card;
  return plain;
};
export const asTags = (value: unknown): string[] =>
  (Array.isArray(value) ? value : isSet(value) ? String(value).split(',') : [])
    .map((tag) => String((tag && typeof tag === 'object' ? (tag as Record<string, unknown>).label : tag) ?? '').trim())
    .filter(Boolean);
/** An avatar value that is an image address. */
export const isImage = (value: unknown) => typeof value === 'string' && /^(https?:|data:image\/)/.test(value.trim());

/** Whether a scrolled element has more content past its end (`axis` y: below, x: to the right), for a fade. */
export const useMoreAhead = (ref: React.RefObject<HTMLElement>, axis: 'x' | 'y', deps: unknown[], onSize?: (el: HTMLElement) => void) => {
  const [more, setMore] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const check = () => {
      onSize?.(el);
      setMore(axis === 'y' ? el.scrollHeight - el.scrollTop - el.clientHeight > 4 : el.scrollWidth - el.scrollLeft - el.clientWidth > 4);
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', check);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return more;
};

/** A card's natural content height, measured only when a collapsed height is set. */
export const useContentHeight = (ref: React.RefObject<HTMLElement>, collapsedHeight: unknown) => {
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!isSet(collapsedHeight) || !el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [collapsedHeight]);
  return height;
};

export const useKanban = (o: KanbanOptions) => {
  const [data] = ToolJet.useStateArray({ name: o.dataName, label: 'Cards', description: 'Array of card objects, e.g. {{queries.getTasks.data}}.', initialValue: o.sample });
  const [columns] = ToolJet.useStateArray({
    name: 'columns',
    label: 'Columns (in order)',
    description: 'Array of { id, title } (a color adds a dot). A status no column lists gets a column at the end.',
    initialValue: o.columns,
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
    description: 'Custom: each card is a row of ToolJet components reading {{listItem}}.',
  });
  const [cardHeight] = ToolJet.useStateNumber({
    name: 'cardHeight',
    label: 'Card height (custom content)',
    initialValue: 96,
    min: 24,
    max: 1200,
    visibleWhen: { key: 'cardLayout', value: 'custom' },
  });
  const d = o.defaults;
  const [titleField] = ToolJet.useStateString({ name: 'titleField', label: 'Title field', initialValue: d.title ?? 'title' });
  const [descriptionField] = ToolJet.useStateString({ name: 'descriptionField', label: 'Description field', initialValue: d.description ?? '' });
  const [badgeField] = ToolJet.useStateString({ name: 'badgeField', label: 'Badge field (priority, severity)', initialValue: d.badge ?? '' });
  const [tagsField] = ToolJet.useStateString({ name: 'tagsField', label: 'Tags field (a list)', initialValue: d.tags ?? '' });
  const [progressField] = ToolJet.useStateString({ name: 'progressField', label: 'Progress field (0 to 100)', initialValue: d.progress ?? '' });
  const [metaField] = ToolJet.useStateString({ name: 'metaField', label: 'Meta field (a date, a count)', initialValue: d.meta ?? '' });
  const [avatarField] = ToolJet.useStateString({ name: 'avatarField', label: 'Avatar field (a name or image URL)', initialValue: d.avatar ?? '' });
  const [detailsField] = ToolJet.useStateString({ name: 'detailsField', label: 'Details field (shown on the clicked card)', initialValue: d.details ?? '' });
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
  // The board's own styles; the accent is the library's primary colour (the pack's theme styles).
  const styles: Record<string, unknown> = {
    columnBackgroundColor: ToolJet.useStyleString({ name: 'columnBackgroundColor', label: 'Column background', inspector: 'color', initialValue: '' }),
    columnBorderColor: ToolJet.useStyleString({ name: 'columnBorderColor', label: 'Column border color', inspector: 'color', initialValue: '' }),
    columnTitleColor: ToolJet.useStyleString({ name: 'columnTitleColor', label: 'Column title color', inspector: 'color', initialValue: '' }),
    columnCountBackgroundColor: ToolJet.useStyleString({ name: 'columnCountBackgroundColor', label: 'Column count background', inspector: 'color', initialValue: '' }),
    columnCountTextColor: ToolJet.useStyleString({ name: 'columnCountTextColor', label: 'Column count text color', inspector: 'color', initialValue: '' }),
    columnGap: ToolJet.useStyleNumber({ name: 'columnGap', label: 'Gap between columns', initialValue: '' }),
    columnBorderRadius: ToolJet.useStyleNumber({ name: 'columnBorderRadius', label: 'Column radius', initialValue: '' }),
    cardBackgroundColor: ToolJet.useStyleString({ name: 'cardBackgroundColor', label: 'Card background', inspector: 'color', initialValue: '' }),
    cardBorderColor: ToolJet.useStyleString({ name: 'cardBorderColor', label: 'Card border color', inspector: 'color', initialValue: '' }),
    cardTitleColor: ToolJet.useStyleString({ name: 'cardTitleColor', label: 'Card title color', inspector: 'color', initialValue: '' }),
    cardTextColor: ToolJet.useStyleString({ name: 'cardTextColor', label: 'Card secondary text color', inspector: 'color', initialValue: '' }),
    progressColor: ToolJet.useStyleString({ name: 'progressColor', label: 'Progress color (else the primary)', inspector: 'color', initialValue: '' }),
    cardBorderRadius: ToolJet.useStyleNumber({ name: 'cardBorderRadius', label: 'Card radius', initialValue: '' }),
    cardShadow: ToolJet.useStyleEnumeration({
      name: 'cardShadow',
      label: 'Card shadow',
      enumDefinition: ['none', 'sm', 'md', 'lg'],
      enumLabels: { none: 'None', sm: 'Small', md: 'Medium', lg: 'Large' },
      initialValue: o.shadow,
    }),
  };
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
  const showMoreCards = (columnId: string) => setShownCards((n) => ({ ...n, [columnId]: (n[columnId] ?? CARDS_PER_STEP) + CARDS_PER_STEP }));
  const showMoreColumns = () => setShownColumns((n) => n + MAX_BOARD_COLUMNS);

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
  // windows to include it and give it focus back once it is drawn (a pack marks each card with data-kb-card, its key),
  // so keyboard focus does not fall to the page.
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

  const { id: idParam, values: valuesParam } = o.params;
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
        { handle: idParam, displayName: 'Card id', defaultValue: '' },
        { handle: 'columnId', displayName: 'Column id', defaultValue: '' },
      ],
    },
    (id, columnId) => doMove(id, columnId)
  );
  ToolJet.useAction({ name: 'deleteCard', displayName: 'Delete card', params: [{ handle: idParam, displayName: 'Card id', defaultValue: '' }] }, (id) => doDelete(id));
  ToolJet.useAction(
    {
      name: 'updateCardData',
      displayName: 'Update card data',
      params: [
        { handle: idParam, displayName: 'Card id', defaultValue: '' },
        { handle: valuesParam, displayName: 'Values', defaultValue: "{{{ title: 'Renamed' }}}" },
      ],
    },
    (id, value) => doUpdate(id, value)
  );

  // Custom cards: rows of ToolJet components, one per card in board order, each placed in its column by RowSlot.
  const order = useMemo(() => new Map(allCards.map((c, i) => [c.__key, i])), [allCards]);
  const rowItems = useMemo(() => (custom ? allCards.map(strip) : []), [custom, allCards]);
  ToolJet.useRows(rowItems, Math.min(1200, Math.max(24, Number(cardHeight) || 96)));

  // Board size: columns share its width (columnMinimum) and it fades at the right while more columns are off screen.
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(0);
  const moreRight = useMoreAhead(boardRef, 'x', [board.length, collapsed], (el) => setBoardWidth(el.clientWidth));

  // Dragging: the dragged card's key and where it would land (a column, before a card or at the end).
  const draggable = allowDrag !== false && !o.disabled;
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [target, setTarget] = useState<DropTarget | null>(null);
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
  const onCardDragStart = (e: React.DragEvent, key: string) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
    setDragKey(key);
    setPicked(null);
  };
  const select = (card: BoardCard) => {
    if (fields.details) setOpenKey((current) => (current === card.__key ? null : card.__key));
    setSelectedKey(card.__key);
    setLastSelectedCard(strip(card));
    onCardSelected();
  };
  const onCardKey = (e: React.KeyboardEvent, card: BoardCard, columnId: string) => {
    if (e.target !== e.currentTarget) return;
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
  const visible = board.slice(0, shownColumns);
  const gap = isSet(styles.columnGap) ? Number(styles.columnGap) || 16 : 16;
  const minColumn = columnMinimum(visible.length, boardWidth, gap);
  const moving = dragKey ?? picked;

  const columnViews = visible.map((column) => {
    const isCollapsed = collapsed.has(column.id);
    const over = !!moving && target?.columnId === column.id;
    const cards = column.cards.slice(0, shownOf(column.id));
    // The drop line, where the moving card would land; none right before or after the card itself.
    const dropLineAt = (before: string | null) => {
      if (!over || target?.before !== before || !moving) return false;
      const at = before === null ? cards.length : cards.findIndex((c) => c.__key === before);
      return !(before === moving || cards[at - 1]?.__key === moving);
    };
    // A column's width: its share of the board (fill), or the author's width, never under the minimum.
    const style: React.CSSProperties | undefined = isCollapsed
      ? undefined
      : columnWidth
      ? { width: columnWidth, flex: `1 1 ${columnWidth}`, minWidth: `min(${columnWidth}, ${minColumn}px)` }
      : { minWidth: `${minColumn}px` };
    return { column, cards, hidden: column.cards.length - cards.length, isCollapsed, over, fill: !isCollapsed && !columnWidth, style, dropLineAt };
  });

  return {
    fields,
    custom,
    compact: density === 'compact',
    collapsedHeight: isSet(collapsedHeight) ? collapsedHeight : '',
    showCount: showCount !== false,
    collapsibleColumns: collapsibleColumns !== false,
    allowAdd: allowAdd === true,
    allowDelete: allowDelete === true,
    emptyText: String(emptyText || 'No cards'),
    badgeColors,
    vars: kanbanVars(styles),
    board,
    allCards,
    columnViews,
    moreColumns: Math.max(0, board.length - shownColumns),
    showMoreColumns,
    showMoreCards,
    boardRef,
    moreRight,
    order,
    selectedKey,
    openKey,
    expandedKeys,
    toggleExpanded,
    toggleColumn,
    draggable,
    dragKey,
    picked,
    announce,
    endDrag,
    onDragOverCard,
    onDragOverColumn,
    onDrop,
    onCardDragStart,
    onCardKey,
    select,
    onAdd,
    doDelete,
  };
};

export type KanbanModel = ReturnType<typeof useKanban>;
