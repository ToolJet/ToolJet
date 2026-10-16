// Which widgets size to their content in the viewer. One rule, read by the canvas wrapper (which slot height to use),
// the FlexContainer (whether it grows) and the component packs (whether they measure themselves), so the three agree.

const CARD_SURFACES = ['shadcnCard'];
const isPackWidget = (componentType) => /^Shad[A-Z]/.test(componentType ?? '');

/**
 * - A native widget follows its Dynamic height property.
 * - A FlexContainer drawn as a card, or laid out as a row, always fits its content: a card never scrolls inside or
 *   leaves an empty band, and a row is never a scroll area. A plain column follows the property (it may scroll).
 * - A component-pack widget fits its content unless Dynamic height is turned off: one given a guessed height (an
 *   agent's, or a default) neither clips its content nor leaves a gap under it.
 */
export const fitsContentInView = (componentType, properties = {}) => {
  if (componentType === 'FlexContainer') {
    return !!properties.dynamicHeight || CARD_SURFACES.includes(properties.cardStyle) || properties.direction === 'row';
  }
  if (isPackWidget(componentType)) return properties.dynamicHeight !== false;
  return !!properties.dynamicHeight;
};

/** The reflow's gate: a height the author turned off dynamic height for stays as drawn. A FlexContainer card or row
 *  is never held (it always fits its content); every other widget keeps ToolJet's rule, dynamicHeight === false. */
export const heightHeldInView = (componentType, properties = {}) => {
  if (componentType === 'FlexContainer' && fitsContentInView(componentType, { ...properties, dynamicHeight: false })) {
    return false;
  }
  return properties.dynamicHeight === false;
};

// Widgets whose rows (or cards) each take their own height in the reflow: a child growing in row r writes the row's
// height under the widget's id at that row's context. Not ROW_SCOPED_WIDGET_TYPES: Table and the native Kanban scope
// their rows' values but do not size rows from their children.
const PER_ROW_HEIGHT_TYPES = ['Listview', 'ShadListView', 'ShadKanban'];

/**
 * Whether a widget's rows or cards are sized from the components on them, each on its own.
 * @param {string | undefined} componentType
 * @returns {boolean}
 */
export const hasPerRowHeight = (componentType) => PER_ROW_HEIGHT_TYPES.includes(componentType);

/**
 * The UI 2.0 List view's row height: its rowHeight property, 72 when unset, kept between 24 and 4000.
 * @param {Record<string, unknown>} [properties]
 * @returns {number}
 */
export const listRowHeight = (properties) => Math.min(4000, Math.max(24, Number(properties?.rowHeight) || 72));

/**
 * The UI 2.0 Kanban's custom card height: its cardHeight property, 96 when unset.
 * @param {Record<string, unknown>} [properties]
 * @returns {number}
 */
export const kanbanCardHeight = (properties) => Number(properties?.cardHeight) || 96;

/**
 * The height a row or card never goes below when it fits its components (the author's row or card height). The
 * native Listview's is its rowHeight as resolved (undefined when unset, so the caller keeps its own fallback).
 * @param {string} componentType
 * @param {Record<string, unknown>} [properties]
 * @returns {number | undefined}
 */
export const rowFloorOf = (componentType, properties) => {
  if (componentType === 'ShadListView') return listRowHeight(properties);
  if (componentType === 'ShadKanban') return kanbanCardHeight(properties);
  return properties?.rowHeight;
};

/**
 * Space a row keeps under its lowest component: the native row's padding and safety margin, a UI 2.0 row's 8px.
 * @param {string} componentType
 * @returns {number}
 */
export const rowChromeOf = (componentType) => (componentType === 'Listview' ? 15 : 8);
