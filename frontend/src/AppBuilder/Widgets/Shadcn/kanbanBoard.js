// shadcn/ui pack Kanban (experiment): the board's data logic, kept apart from the drag-and-drop UI so it is tested on
// its own. Cards are rows of data; a column is a value of the status field.

const keyOf = (value) => String(value ?? '');
const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
/** A drag key no other card has: the card's id when free, else the id with a suffix. Duplicate or empty ids (two
 *  rows with id '' or the same id) gave two cards one key: dnd-kit dragged both and React reused one's element for
 *  the other, and a move removed every copy. */
const uniqueKey = (keys, base) => {
  let key = base;
  for (let n = 2; keys.has(key); n += 1) key = `${base}~${n}`;
  keys.add(key);
  return key;
};

/** Columns in the order given ({ id, title } objects or plain values), each with its cards; a status value no column
 *  lists gets a column at the end, so no card disappears. With no columns given, they come from the data. */
export const boardColumns = (cards, columns, statusField, idField) => {
  const listed = (Array.isArray(columns) ? columns : []).map((c) =>
    c !== null && typeof c === 'object'
      ? { id: keyOf(c.id ?? c.value ?? c.title), title: String(c.title ?? c.label ?? c.id ?? c.value ?? '') }
      : { id: keyOf(c), title: String(c) }
  );
  const byId = new Map(listed.map((c) => [c.id, { ...c, cards: [] }]));
  for (const card of Array.isArray(cards) ? cards : []) {
    const status = keyOf(card?.[statusField]);
    if (!byId.has(status)) byId.set(status, { id: status, title: status, cards: [] });
    byId.get(status).cards.push(card);
  }
  // Keep a stable id on every card for drag and drop, unique across the board. Rows that are not objects become
  // empty cards rather than spreading a string's characters into fields.
  const keys = new Set();
  for (const column of byId.values()) {
    column.cards = column.cards.map((card, i) => {
      const row = isPlain(card) ? card : {};
      const id = row[idField];
      const base = id === undefined || id === null || id === '' ? `${column.id}-${i}` : keyOf(id);
      return { ...row, __key: uniqueKey(keys, base) };
    });
  }
  return [...byId.values()];
};

/** Moves a card to a column, before `beforeCardKey` (or at the end). Returns the new columns and the move (null when
 *  the card is already there): the card with its status set to the new column, where it came from and where it went. */
export const moveCard = (columns, cardKey, toColumnId, beforeCardKey, statusField) => {
  const key = keyOf(cardKey);
  const from = columns.find((c) => c.cards.some((card) => card.__key === key));
  const to = columns.find((c) => c.id === keyOf(toColumnId));
  if (!from || !to) return { columns, move: null };
  const card = from.cards.find((c) => c.__key === key);
  const fromIndex = from.cards.indexOf(card);
  const next = columns.map((c) => ({ ...c, cards: c.cards.filter((x) => x.__key !== key) }));
  const target = next.find((c) => c.id === to.id);
  const before =
    beforeCardKey === null || beforeCardKey === undefined
      ? -1
      : target.cards.findIndex((x) => x.__key === keyOf(beforeCardKey));
  const toIndex = before < 0 ? target.cards.length : before;
  if (from.id === to.id && toIndex === fromIndex) return { columns, move: null };
  const moved = { ...card, [statusField]: to.id };
  target.cards.splice(toIndex, 0, moved);
  const { __key, ...plain } = moved;
  return { columns: next, move: { cardId: plain.id ?? key, card: plain, from: from.id, to: to.id, toIndex } };
};

const plain = (card) => {
  if (!card) return null;
  const { __key, ...rest } = card;
  return rest;
};

/** Every card on the board, without its drag key, in board order (column by column). */
export const boardCards = (columns) => columns.flatMap((c) => c.cards.map(plain));

/** Adds a card at the end of a column: `columnId` when given (the card's status is set to it), else the card's status
 *  column, which is created when no column has that status. A card without an id gets one no other card has. */
export const addCard = (columns, rawCard, columnId, statusField, idField) => {
  const card = isPlain(rawCard) ? rawCard : {};
  const keys = new Set(columns.flatMap((c) => c.cards.map((x) => x.__key)));
  let id = card[idField];
  if (id === undefined || id === null || id === '') {
    let n = keys.size + 1;
    while (keys.has(`new-${n}`)) n += 1;
    id = `new-${n}`;
  }
  const status = keyOf(columnId ?? card?.[statusField]);
  const added = { ...card, [idField]: id, [statusField]: columnId ?? card?.[statusField] ?? status };
  const next = columns.map((c) => ({ ...c, cards: [...c.cards] }));
  let target = next.find((c) => c.id === status);
  if (!target) {
    target = { id: status, title: status, cards: [] };
    next.push(target);
  }
  target.cards.push({ ...added, __key: uniqueKey(keys, keyOf(id)) });
  return { columns: next, card: added };
};

/** Removes the card with this id. Returns the new columns and the removed card (null when there is none). */
export const deleteCard = (columns, cardId) => {
  const key = keyOf(cardId);
  const card = columns.flatMap((c) => c.cards).find((x) => x.__key === key);
  if (!card) return { columns, card: null };
  return { columns: columns.map((c) => ({ ...c, cards: c.cards.filter((x) => x.__key !== key) })), card: plain(card) };
};

/** Merges `values` into the card with this id, in place; a changed status moves it to the end of that column. */
export const updateCard = (columns, cardId, values, statusField, idField) => {
  const key = keyOf(cardId);
  const card = columns.flatMap((c) => c.cards).find((x) => x.__key === key);
  if (!card) return { columns, card: null };
  const updated = { ...card, ...(isPlain(values) ? values : {}), __key: key };
  if (keyOf(updated[statusField]) === keyOf(card[statusField])) {
    const next = columns.map((c) => ({ ...c, cards: c.cards.map((x) => (x.__key === key ? updated : x)) }));
    return { columns: next, card: plain(updated) };
  }
  const removed = deleteCard(columns, cardId).columns;
  const { __key, ...rest } = updated;
  return { columns: addCard(removed, rest, undefined, statusField, idField).columns, card: plain(updated) };
};

/** Whether a card's content collapses to `collapsedHeight` px (empty: never) given its full `contentHeight`, and the
 *  max height to clamp it to. A few pixels of overflow are left alone: a toggle would only hide them. */
export const cardClamp = (collapsedHeight, contentHeight, expanded) => {
  const limit = Number(collapsedHeight);
  const collapsible = collapsedHeight !== '' && limit > 0 && contentHeight > limit + 8;
  return { collapsible, maxHeight: collapsible && !expanded ? limit : undefined };
};
