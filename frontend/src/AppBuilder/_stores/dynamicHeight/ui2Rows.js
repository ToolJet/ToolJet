import { UI2_ROW_CHROME, heightHeldInView, ui2RowFloor } from '@/AppBuilder/_helpers/dynamicHeightPolicy';

// ─────────────────────────────────────────────────────────────────────────────
// UI 2.0 rows: one row of UI 2.0's List view, or one card of its Kanban.
//
// Like a native List view row, a row is sized from the components on it (the
// engine solves them at the row's context). Unlike it, the row keeps 8px under
// its lowest component, and never goes below the height the builder set for
// rows (Row height) or cards (card height). The list itself is drawn by its
// own code and measures its own height.
//
// Pure arithmetic: the row's content bottom is worked out by the engine.
// ─────────────────────────────────────────────────────────────────────────────

// The least a Kanban card with something hidden on it goes down to.
const SHRUNK_CARD_MIN_HEIGHT = 40;

/**
 * The height of one row (or card).
 *
 *   - Dynamic height off: the Row height (card height).
 *   - A card with a component hidden on it: its components plus 8, at least 40. Whether a card shows a component is
 *     decided per card (from cardData), so a card that hides one may be shorter than the card height.
 *   - Otherwise: its components plus 8, never below the Row height (card height).
 *
 * @param {object} options
 * @param {'ShadListView'|'ShadKanban'} options.componentType
 * @param {object} [options.properties]  the list's resolved properties
 * @param {number} options.contentBottom  the lowest bottom of the components on the row; for a card, leaving out the
 *   hidden ones
 * @param {boolean} [options.anyHidden]  a card with a component hidden on it (the engine says so for cards only)
 * @returns {number}
 */
export const ui2RowHeight = ({ componentType, properties = {}, contentBottom, anyHidden = false }) => {
  const floor = ui2RowFloor(componentType, properties);
  if (heightHeldInView(componentType, properties)) return floor;
  const fitted = contentBottom + UI2_ROW_CHROME;
  if (anyHidden) return Math.max(SHRUNK_CARD_MIN_HEIGHT, fitted);
  return Math.max(floor, fitted);
};
