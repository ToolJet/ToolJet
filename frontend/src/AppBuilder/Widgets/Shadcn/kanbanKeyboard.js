// shadcn/ui pack (experiment): moving a Kanban card with the keyboard (dnd-kit's KeyboardSensor). Its default moves
// the card 25px per arrow press, so reaching the next column took about a dozen presses; here Left and Right jump to
// the previous or next column, Up and Down move past one card.

const ARROWS = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'];

/** The KeyboardSensor coordinate getter: the new drag coordinates for an arrow key, undefined for any other key. */
export const kanbanCoordinates = (event, { context, currentCoordinates }) => {
  const key = ARROWS.includes(event.key) ? event.key : ARROWS.includes(event.code) ? event.code : null;
  if (!key) return undefined;
  event.preventDefault?.();
  const rect = context?.collisionRect;
  if (!rect || !currentCoordinates) return undefined;
  if (key === 'ArrowDown' || key === 'ArrowUp') {
    const step = Math.max(24, rect.height + 8) * (key === 'ArrowDown' ? 1 : -1);
    return { x: currentCoordinates.x, y: currentCoordinates.y + step };
  }
  const columns = [...(context.droppableRects?.entries?.() ?? [])]
    .filter(([id]) => String(id).startsWith('col-'))
    .map(([, r]) => r)
    .sort((a, b) => a.left - b.left);
  if (!columns.length) return currentCoordinates;
  const centre = rect.left + rect.width / 2;
  let at = columns.findIndex((r) => centre >= r.left && centre <= r.left + r.width);
  // Between columns (over the gap): the column to its left counts as the current one.
  if (at === -1) at = columns.filter((r) => r.left + r.width < centre).length - 1;
  const target = columns[at + (key === 'ArrowRight' ? 1 : -1)];
  if (!target) return currentCoordinates;
  return {
    x: currentCoordinates.x + (target.left + (target.width - rect.width) / 2 - rect.left),
    y: currentCoordinates.y,
  };
};

/** Screen reader announcements in the board's own words (the card's title, the column's) instead of dnd-kit's ids. */
export const kanbanAnnouncements = (cardTitle, columnTitle) => {
  const where = (over) => (over ? columnTitle(over.id) : '');
  return {
    onDragStart: ({ active }) => `Picked up ${cardTitle(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${cardTitle(active.id)} is over ${where(over)}.` : `${cardTitle(active.id)} is not over a column.`,
    onDragEnd: ({ active, over }) =>
      over ? `${cardTitle(active.id)} dropped in ${where(over)}.` : `${cardTitle(active.id)} dropped back.`,
    onDragCancel: ({ active }) => `Moving ${cardTitle(active.id)} cancelled.`,
  };
};

export const KANBAN_INSTRUCTIONS =
  'To move a card, press Space or Enter, use the arrow keys to move it between columns, then Space or Enter to drop it. Escape cancels.';
