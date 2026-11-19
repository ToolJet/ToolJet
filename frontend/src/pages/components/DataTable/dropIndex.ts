/** Which side of the row under the pointer the insertion line sits on. */
export type DropSide = 'before' | 'after';

// Index the active row lands at when dropped on `side` of `overId`; null when the order wouldn't change.
export function getDropIndex(ids: string[], activeId: string, overId: string, side: DropSide): number | null {
  const fromIndex = ids.indexOf(activeId);
  const overIndex = ids.indexOf(overId);
  if (fromIndex === -1 || overIndex === -1) return null;

  const slot = side === 'before' ? overIndex : overIndex + 1;
  // Lifting the active row out shifts every later slot up by one.
  const toIndex = slot > fromIndex ? slot - 1 : slot;
  return toIndex === fromIndex ? null : toIndex;
}
