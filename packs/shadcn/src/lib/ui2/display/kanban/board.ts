// Ported from UI 2.0's Kanban (Ui2/Kanban/kanbanBoard.ts): the board's data logic, kept apart from the drag-and-drop
// UI. Cards are rows of data; a column is a value of the status field.

import { contentKey } from '../../../contentKey';
import { sameValue } from '../../../sameValue';

const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

/** A row of the board's data. */
export type CardRow = Record<string, unknown>;

/** A card on the board: its row and a drag key unique across the board. */
export type BoardCard = CardRow & { __key: string };

export interface BoardColumn {
  id: string;
  title: string;
  /** The pack's own extra: a dot of this colour before the column title. */
  color?: string;
  cards: BoardCard[];
}

/** A card's move (lastCardMovement): the card with its new status, where it came from and where it went. It also
 *  carries the native Kanban's names for the same facts, which apps and agents bind (cardDetails.id,
 *  destinationColumnId): without them a save on onCardMoved matched no row and still reported success. */
export interface CardMove {
  cardId: unknown;
  card: CardRow;
  from: string;
  to: string;
  toIndex: number;
  cardDetails: CardRow;
  originColumnId: string;
  destinationColumnId: string;
  originCardIndex: number;
  destinationIndex: number;
}

export interface CardDetail {
  label: string;
  value: string;
}

const keyOf = (value: unknown): string => String(value ?? '');
const hasId = (id: unknown) => id !== undefined && id !== null && id !== '';
/** A card's public id, the one actions and events use: its idField value as the data has it (a number stays a
 *  number). A card without one is named by its drag key, which every action also accepts. */
export const cardIdOf = (card: BoardCard, idField: string): unknown =>
  hasId(card[idField]) ? card[idField] : card.__key;
/** Hands out drag keys no other card has: the card's id when free, else the id with a suffix. Duplicate or empty ids
 *  (two rows with id '' or the same id) gave two cards one key: dnd-kit dragged both and React reused one's element
 *  for the other, and a move removed every copy. Each id remembers its next suffix: probing from ~2 again for every
 *  duplicate cost n(n+1)/2 checks for n cards sharing an id (2,000 cards: two million).
 *
 *  `used` starts with every real id on the board, so a key made up (a suffix, or a card without an id named by its
 *  column) never takes one: ids a, a, a~2 gave the second a the key a~2, and an action on a~2 changed it instead of the
 *  card with that id. A card's own id is its key the first time (`own`), though `used` holds it. */
const keyMaker = (used: Set<string>) => {
  const nextSuffix = new Map<string, number>();
  const claimed = new Set<string>();
  return (base: string, own = false): string => {
    if (own && !claimed.has(base)) {
      claimed.add(base);
      used.add(base);
      return base;
    }
    // A duplicate's own id is taken already; a made-up name may be free.
    let key = base;
    if (own || used.has(key)) {
      let n = nextSuffix.get(base) ?? 2;
      for (key = `${base}~${n}`; used.has(key); key = `${base}~${n}`) n += 1;
      nextSuffix.set(base, n + 1);
    }
    used.add(key);
    return key;
  };
};

/** The key for a card taking the id `id` on a board (`self`, the card's own key, left out): the id, or a suffixed one
 *  when another card has that id too. A card holding the id as a made-up key gets another one (`renamed`), so the id
 *  names the card that has it. */
const claimKey = (columns: BoardColumn[], id: string, idField: string, self?: string) => {
  const cards = columns.flatMap((c) => c.cards);
  const used = new Set<string>();
  for (const card of cards) {
    used.add(card.__key);
    if (hasId(card[idField]) && card.__key !== self) used.add(keyOf(card[idField]));
  }
  const holder = cards.find((c) => c.__key === id && c.__key !== self);
  if (!holder) return { columns, key: id, renamed: null };
  const holderId = hasId(holder[idField]) ? keyOf(holder[idField]) : null;
  if (holderId === id) return { columns, key: keyMaker(used)(id), renamed: null };
  const to = keyMaker(used)(holderId ?? holder.__key);
  return {
    columns: columns.map((c) => ({ ...c, cards: c.cards.map((x) => (x === holder ? { ...x, __key: to } : x)) })),
    key: id,
    renamed: { from: id, to },
  };
};

/** Columns in the order given ({ id, title } objects or plain values), each with its cards; a status value no column
 *  lists gets a column at the end, so no card disappears. With no columns given, they come from the data. */
export const boardColumns = (cards: unknown, columns: unknown, statusField: string, idField: string): BoardColumn[] => {
  const listed = (Array.isArray(columns) ? columns : []).map((c) =>
    c !== null && typeof c === 'object'
      ? {
          id: keyOf(c.id ?? c.value ?? c.title),
          title: String(c.title ?? c.label ?? c.id ?? c.value ?? ''),
          color: typeof c.color === 'string' && c.color ? c.color : undefined,
        }
      : { id: keyOf(c), title: String(c), color: undefined as string | undefined }
  );
  const byId = new Map<string, { id: string; title: string; color?: string; cards: unknown[] }>(
    listed.map((c) => [c.id, { ...c, cards: [] }])
  );
  for (const card of Array.isArray(cards) ? cards : []) {
    const status = keyOf(isRecord(card) ? card[statusField] : undefined);
    if (!byId.has(status)) byId.set(status, { id: status, title: status, cards: [] });
    byId.get(status)?.cards.push(card);
  }
  // Keep a stable id on every card for drag and drop, unique across the board. Rows that are not objects become
  // empty cards rather than spreading a string's characters into fields.
  const ids = new Set<string>();
  for (const column of byId.values())
    for (const card of column.cards) if (isRecord(card) && hasId(card[idField])) ids.add(keyOf(card[idField]));
  const uniqueKey = keyMaker(ids);
  for (const column of byId.values()) {
    column.cards = column.cards.map((card) => {
      const row = isRecord(card) ? card : {};
      const id = row[idField];
      // A card with no id is keyed by its content: a position key moved the selected or open card to whichever card
      // took its place when one above it was removed (team testing, 2026-10-29).
      const { __key: _old, ...content } = row;
      return { ...row, __key: hasId(id) ? uniqueKey(keyOf(id), true) : uniqueKey(contentKey(content)) };
    });
  }
  // Every card now has its key.
  return [...byId.values()] as BoardColumn[];
};

/** Moves a card to a column, before `beforeCardKey` (or at the end). Returns the new columns and the move (null when
 *  the card is already there): the card's public id (cardIdOf) and the card with its status set to the new column,
 *  where it came from and where it went. */
export const moveCard = (
  columns: BoardColumn[],
  cardKey: unknown,
  toColumnId: unknown,
  beforeCardKey: unknown,
  statusField: string,
  idField: string
): { columns: BoardColumn[]; move: CardMove | null } => {
  const key = keyOf(cardKey);
  const from = columns.find((c) => c.cards.some((card) => card.__key === key));
  const to = columns.find((c) => c.id === keyOf(toColumnId));
  if (!from || !to) return { columns, move: null };
  const card = from.cards.find((c) => c.__key === key);
  if (!card) return { columns, move: null };
  const fromIndex = from.cards.indexOf(card);
  const next = columns.map((c) => ({ ...c, cards: c.cards.filter((x) => x.__key !== key) }));
  const target = next.find((c) => c.id === to.id);
  if (!target) return { columns, move: null };
  const before =
    beforeCardKey === null || beforeCardKey === undefined
      ? -1
      : target.cards.findIndex((x) => x.__key === keyOf(beforeCardKey));
  const toIndex = before < 0 ? target.cards.length : before;
  if (from.id === to.id && toIndex === fromIndex) return { columns, move: null };
  const moved: BoardCard = { ...card, [statusField]: to.id };
  target.cards.splice(toIndex, 0, moved);
  const { __key, ...plain } = moved;
  return {
    columns: next,
    move: {
      cardId: cardIdOf(moved, idField),
      card: plain,
      from: from.id,
      to: to.id,
      toIndex,
      cardDetails: plain,
      originColumnId: from.id,
      destinationColumnId: to.id,
      originCardIndex: fromIndex,
      destinationIndex: toIndex,
    },
  };
};

const plain = (card: BoardCard | null | undefined): CardRow | null => {
  if (!card) return null;
  const { __key, ...rest } = card;
  return rest;
};

/** Every card on the board, without its drag key, in board order (column by column). */
export const boardCards = (columns: BoardColumn[]) => columns.flatMap((c) => c.cards.map(plain));

/** A card key that changed hands: the card keyed `from` is now keyed `to`. */
export type Renamed = { from: string; to: string } | null;

/** Adds a card at the end of a column: `columnId` when given (the card's status is set to it), else the card's status
 *  column, which is created when no column has that status. A card without an id gets one no other card has. */
export const addCard = (
  columns: BoardColumn[],
  rawCard: unknown,
  columnId: unknown,
  statusField: string,
  idField: string
): { columns: BoardColumn[]; card: CardRow; key: string; renamed: Renamed } => {
  const card: CardRow = isRecord(rawCard) ? rawCard : {};
  let id = card[idField];
  if (!hasId(id)) {
    const cards = columns.flatMap((c) => c.cards);
    const used = new Set(cards.flatMap((x) => [x.__key, keyOf(x[idField])]));
    let n = cards.length + 1;
    while (used.has(`new-${n}`)) n += 1;
    id = `new-${n}`;
  }
  const status = keyOf(columnId ?? card?.[statusField]);
  const added: CardRow = { ...card, [idField]: id, [statusField]: columnId ?? card?.[statusField] ?? status };
  const claim = claimKey(columns, keyOf(id), idField);
  const next = claim.columns.map((c) => ({ ...c, cards: [...c.cards] }));
  let target: BoardColumn | undefined = next.find((c) => c.id === status);
  if (!target) {
    target = { id: status, title: status, cards: [] };
    next.push(target);
  }
  target.cards.push({ ...added, __key: claim.key });
  return { columns: next, card: added, key: claim.key, renamed: claim.renamed };
};

/** Removes the card with this id. Returns the new columns and the removed card (null when there is none). */
export const deleteCard = (
  columns: BoardColumn[],
  cardId: unknown
): { columns: BoardColumn[]; card: CardRow | null } => {
  const key = keyOf(cardId);
  const card = columns.flatMap((c) => c.cards).find((x) => x.__key === key);
  if (!card) return { columns, card: null };
  return { columns: columns.map((c) => ({ ...c, cards: c.cards.filter((x) => x.__key !== key) })), card: plain(card) };
};

/** Merges `values` into the card with this id, in place; a changed status moves it to the end of that column. A
 *  changed id gives the card the key of its new id (suffixed when another card has it, as duplicate ids in the data
 *  are), so the new id addresses it. Returns the card's key after the update (`key`) with the card, and another card's
 *  key that changed to make room (`renamed`, claimKey). */
export const updateCard = (
  columns: BoardColumn[],
  cardId: unknown,
  values: unknown,
  statusField: string,
  idField: string
): { columns: BoardColumn[]; card: CardRow | null; key: string | null; renamed: Renamed } => {
  const key = keyOf(cardId);
  const card = columns.flatMap((c) => c.cards).find((x) => x.__key === key);
  if (!card) return { columns, card: null, key: null, renamed: null };
  // Values the card already has change nothing: no card back, so updateCardData fires nothing (lib/sameValue).
  if (!isRecord(values) || Object.keys(values).every((k) => sameValue(card[k], values[k]))) return { columns, card: null, key: null, renamed: null };
  const updated: BoardCard = { ...card, ...values, __key: key };
  if (keyOf(updated[statusField]) === keyOf(card[statusField])) {
    let board = columns;
    let renamed: Renamed = null;
    if (hasId(updated[idField]) && keyOf(updated[idField]) !== keyOf(card[idField])) {
      const claim = claimKey(columns, keyOf(updated[idField]), idField, key);
      ({ columns: board, renamed } = claim);
      updated.__key = claim.key;
    }
    const next = board.map((c) => ({ ...c, cards: c.cards.map((x) => (x.__key === key ? updated : x)) }));
    return { columns: next, card: plain(updated), key: updated.__key, renamed };
  }
  const removed = deleteCard(columns, cardId).columns;
  const { __key, ...rest } = updated;
  const added = addCard(removed, rest, undefined, statusField, idField);
  return { columns: added.columns, card: plain(updated), key: added.key, renamed: added.renamed };
};

/** Whether a card's content collapses to `collapsedHeight` px (empty: never) given its full `contentHeight`, and the
 *  max height to clamp it to. A few pixels of overflow are left alone: a toggle would only hide them. */
export const cardClamp = (collapsedHeight: unknown, contentHeight: number, expanded: boolean) => {
  const limit = Number(collapsedHeight);
  const collapsible = collapsedHeight !== '' && limit > 0 && contentHeight > limit + 8;
  return { collapsible, maxHeight: collapsible && !expanded ? limit : undefined };
};

// A card's details (the details field, shown on the clicked card): an object of label to value, a list of
// { label, value } rows, or plain text as one unlabelled row. Empty values are left out; at most 12 rows.
const MAX_DETAIL_ROWS = 12;
// A few levels deep at most: a value that contains itself (an array pushed into itself in a binding) overflowed the stack.
const MAX_DETAIL_DEPTH = 4;
const detailText = (value: unknown, depth = 0): string => {
  if (depth > MAX_DETAIL_DEPTH) return '';
  if (Array.isArray(value)) return value.map((v) => detailText(v, depth + 1)).join(', ');
  if (value && typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return value === undefined || value === null ? '' : String(value);
};
export const cardDetails = (value: unknown): CardDetail[] => {
  if (value === undefined || value === null) return [];
  const rows: CardDetail[] = Array.isArray(value)
    ? value.map((row) => ({ label: detailText(row?.label), value: detailText(row?.value) }))
    : typeof value === 'object'
    ? Object.entries(value).map(([label, v]) => ({ label, value: detailText(v) }))
    : [{ label: '', value: detailText(value) }];
  return rows
    .map((row) => ({ ...row, value: cardDateLabel(row.value) ?? row.value }))
    .filter((row) => row.value.trim() !== '')
    .slice(0, MAX_DETAIL_ROWS);
};

// A card value that is a whole ISO date or timestamp reads as a short date ("Oct 14", or "Mar 2, 2025" in another
// year): cards showed raw stored values ("2026-10-14T00:00:00.000Z") wrapped over three lines. A timestamp shows its
// local day only; a card has no room for the time. Anything else returns null and is shown as written.
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
export const cardDateLabel = (value: unknown, now = new Date()): string | null => {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  let date: Date | null = null;
  const day = ISO_DAY.exec(v);
  if (day) {
    date = new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]));
    if (date.getMonth() !== Number(day[2]) - 1) return null;
  } else if (ISO_STAMP.test(v)) {
    date = new Date(v);
  }
  if (!date || Number.isNaN(date.getTime())) return null;
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (date.getFullYear() !== now.getFullYear()) options.year = 'numeric';
  return new Intl.DateTimeFormat('en-US', options).format(date);
};
