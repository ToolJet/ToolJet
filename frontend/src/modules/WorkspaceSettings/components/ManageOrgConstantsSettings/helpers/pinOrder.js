// ponytail: ported from the apps dashboard; dedupe once that lands on main
import { arrayMove } from '@dnd-kit/sortable';

// Index the active row lands at when dropped on `side` ('before' | 'after') of `overId`; null when the order wouldn't change.
export function getDropIndex(ids, activeId, overId, side) {
  const fromIndex = ids.indexOf(activeId);
  const overIndex = ids.indexOf(overId);
  if (fromIndex === -1 || overIndex === -1) return null;

  const slot = side === 'before' ? overIndex : overIndex + 1;
  // Lifting the active row out shifts every later slot up by one.
  const toIndex = slot > fromIndex ? slot - 1 : slot;
  return toIndex === fromIndex ? null : toIndex;
}

// Search and source filters hide rows, so a manual order set under them would be misleading.
export const canReorderPins = ({ searchKey, isSourceFiltered, pinnedRowCount }) =>
  searchKey.trim() === '' && !isSourceFiltered && pinnedRowCount > 1;

// Pinned rows lead, in pin order; the rest keep the server's order. Only the loaded page is ordered, so a pin on
// another page is ignored here.
export function orderRows(items, pinnedIds) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const pinned = pinnedIds.map((id) => byId.get(id)).filter(Boolean);
  const pinnedSet = new Set(pinned.map((item) => item.id));
  return { rows: [...pinned, ...items.filter((item) => !pinnedSet.has(item.id))], pinnedCount: pinned.length };
}

// Mirrors the server's list comparators (organization-constants/helpers/constants-list.ts) so a new pin lands where
// the sorted list would put it.
const compareNames = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'accent' });
const compareIds = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

// Rows without a modified date go last in both directions.
const compareModified = (direction) => (a, b) => {
  if (!a.last_modified_at && !b.last_modified_at) return compareNames(a, b) || compareIds(a, b);
  if (!a.last_modified_at) return 1;
  if (!b.last_modified_at) return -1;
  const byDate = (new Date(a.last_modified_at) - new Date(b.last_modified_at)) * direction;
  return byDate || compareNames(a, b) || compareIds(a, b);
};

const COMPARATORS = {
  name_asc: (a, b) => compareNames(a, b) || compareIds(a, b),
  name_desc: (a, b) => compareNames(b, a) || compareIds(a, b),
  modified_asc: compareModified(1),
  modified_desc: compareModified(-1),
};

export const compareConstants = (sort) => COMPARATORS[sort] ?? COMPARATORS.name_asc;

// Adds `ids` to `pinIds`, each at the slot the current sort gives it: before the first pin that sorts after it.
// Pins missing from `items` can't be compared and are skipped; with no slot found the id is appended.
// Already-pinned ids and ids not on the loaded page are ignored. Each id finds its own slot, so the
// result does not depend on the order of `ids`.
export function insertPins(pinIds, items, ids, sort) {
  const compare = compareConstants(sort);
  const byId = new Map(items.map((item) => [item.id, item]));
  const next = [...pinIds];
  [...new Set(ids)]
    .map((id) => byId.get(id))
    .filter((item) => item && !next.includes(item.id))
    .forEach((item) => {
      const slot = next.findIndex((pinId) => {
        const pinned = byId.get(pinId);
        return pinned && compare(item, pinned) < 0;
      });
      next.splice(slot === -1 ? next.length : slot, 0, item.id);
    });
  return next;
}

// Moves `id` to `toIndex` among the pins on the loaded page; pins from other pages keep their slots.
export function movePinnedId(pinIds, loadedIds, id, toIndex) {
  const loaded = new Set(loadedIds);
  const visible = pinIds.filter((pinId) => loaded.has(pinId));
  const fromIndex = visible.indexOf(id);
  if (fromIndex === -1 || fromIndex === toIndex) return pinIds;

  const moved = arrayMove(visible, fromIndex, toIndex);
  let next = 0;
  return pinIds.map((pinId) => (loaded.has(pinId) ? moved[next++] : pinId));
}
