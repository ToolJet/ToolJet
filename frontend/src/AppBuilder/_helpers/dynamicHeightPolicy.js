// Which widgets size to their content in the viewer. One rule, read by the canvas wrapper (which slot height to use),
// the FlexContainer (whether it grows) and the component packs (whether they measure themselves), so the three agree.
import { usesFlexLayoutV2 } from './flexLayoutVersion';

const CARD_SURFACES = ['shadcnCard'];
const isPackWidget = (componentType) => /^Shad[A-Z]/.test(componentType ?? '');

/**
 * - A native widget follows its Dynamic height property.
 * - A FlexContainer drawn as a card, or laid out as a row, always fits its content: a card never scrolls inside or
 *   leaves an empty band, and a row is never a scroll area. A plain column follows the property (it may scroll). A row
 *   saved before the UI 2.0 layout (flexLayoutVersion.js) follows the property too, as on lts-3.16.
 * - A component-pack widget fits its content unless Dynamic height is turned off: one given a guessed height (an
 *   agent's, or a default) neither clips its content nor leaves a gap under it.
 */
export const fitsContentInView = (componentType, properties = {}) => {
  if (componentType === 'FlexContainer') {
    return (
      !!properties.dynamicHeight ||
      CARD_SURFACES.includes(properties.cardStyle) ||
      (properties.direction === 'row' && usesFlexLayoutV2(properties))
    );
  }
  if (isPackWidget(componentType)) return properties.dynamicHeight !== false;
  return !!properties.dynamicHeight;
};

// UI 2.0 widgets drawn at their box's height in the viewer too: they never measure themselves (no useAutoHeight), so
// nothing makes the box follow their content. Kept in step with the widgets by Ui2/__tests__/integration/dynamicHeightMarker.spec.js.
const PACK_BOX_SIZED = [
  'ShadAreaChart',
  'ShadAvatar',
  'ShadBadge',
  'ShadBarChart',
  'ShadBreadcrumb',
  'ShadButton',
  'ShadChat',
  'ShadComboChart',
  'ShadDropdownMenu',
  'ShadEmpty',
  'ShadFunnelChart',
  'ShadHeatmapChart',
  'ShadIcon',
  'ShadLineChart',
  'ShadLink',
  'ShadMap',
  'ShadNavigation',
  'ShadPagination',
  'ShadPieChart',
  'ShadProgress',
  'ShadRadarChart',
  'ShadRadialChart',
  'ShadScatterChart',
  'ShadSeparator',
  'ShadSkeleton',
  'ShadSparkline',
  'ShadSpinner',
];

/**
 * Whether a UI 2.0 widget is always drawn at its box's height (it never measures itself).
 * @param {string | undefined} componentType
 * @returns {boolean}
 */
export const isPackBoxSized = (componentType) => PACK_BOX_SIZED.includes(componentType);

/**
 * Whether the editor marks the widget as dynamic height (the purple outline, handle and resize lines): its box follows
 * its content in the viewer. fitsContentInView says yes for every UI 2.0 widget whose Dynamic height is not off, so
 * widgets that never measure themselves and have no Dynamic height property (Skeleton, Button, the charts) were marked
 * though their box keeps its drawn height. Only the marker reads this; the layout keeps fitsContentInView.
 */
export const marksDynamicHeight = (componentType, properties = {}) =>
  fitsContentInView(componentType, properties) && !PACK_BOX_SIZED.includes(componentType);

/** The reflow's gate: a height the author turned off dynamic height for stays as drawn. A FlexContainer card or row
 *  is never held (it always fits its content); every other widget keeps ToolJet's rule, dynamicHeight === false. */
export const heightHeldInView = (componentType, properties = {}) => {
  if (componentType === 'FlexContainer' && fitsContentInView(componentType, { ...properties, dynamicHeight: false })) {
    return false;
  }
  return properties.dynamicHeight === false;
};

/**
 * Whether a child of a FlexContainer row is stretched to its line's height. An Equal heights row (or one whose Align is
 * Stretch, for FlexContainer children) stretches the children that draw a surface filling their box: a FlexContainer
 * (a card or a plain container) and a UI 2.0 Stat drawn as a card that fits its content, so cards of different content
 * heights line up. Every other child keeps its own height and the row's Align, so a heading beside a button still
 * centres. A stretched leaf is measured unstretched by the reflow (resolveWidgetMeasuredHeight), so the row can shrink.
 * Leaves stretch in the viewer only, where their height is their content's; in the editor they keep their drawn height.
 * @param {{ alignItems?: string, equalHeights?: boolean }} [rowProperties]  the row's resolved properties
 * @param {string | undefined} childType
 * @param {Record<string, unknown>} [childProperties]  the child's resolved properties
 * @param {string} [mode]  'view' or 'edit'
 * @param {string} [packRole]  a component pack widget's manifest role: a pack Stat stretches like ShadStat
 * @returns {boolean}
 */
export const stretchesInRow = (rowProperties = {}, childType, childProperties = {}, mode, packRole) => {
  if (childType === 'FlexContainer') return rowProperties.alignItems === 'stretch' || !!rowProperties.equalHeights;
  return (
    !!rowProperties.equalHeights &&
    mode === 'view' &&
    (childType === 'ShadStat' || (childType === 'LibraryComponent' && packRole === 'stat')) &&
    childProperties.card !== false &&
    fitsContentInView(childType, childProperties)
  );
};

/**
 * Whether a widget moved by a sibling keeps the height its own reflow fitted, even below the height it was drawn at.
 * True for a component-pack widget, which fits its content. A native widget moved by a sibling is floored at its drawn
 * height, so a stale height cannot pin a top-label input below its label row.
 * @param {string | undefined} componentType
 * @returns {boolean}
 */
// A component pack's widget (LibraryComponent) fits its content too: floored at its saved height, an Ant Title or
// Statistic drawn shorter than the UI 2.0 size it was saved at left a band under it (Ant apps, room bookings).
export const keepsFittedHeightWhenMoved = (componentType) =>
  isPackWidget(componentType) || componentType === 'LibraryComponent';

// UI 2.0 widgets whose rows (or cards) each take their own height in the reflow, the way the native Listview's rows
// do: a child growing in row r writes the row's height under the widget's id at that row's context. The native
// Listview keeps its own branches in the reflow; these names are only ever true for UI 2.0 types.
const UI2_PER_ROW_TYPES = ['ShadListView', 'ShadKanban'];

/**
 * Whether a widget is a UI 2.0 List view or Kanban, whose rows or cards are sized from the components on them.
 * @param {string | undefined} componentType
 * @returns {boolean}
 */
export const isUi2PerRowType = (componentType) => UI2_PER_ROW_TYPES.includes(componentType);

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
 * The height a UI 2.0 row or card never goes below when it fits its components: the author's row or card height.
 * @param {string} componentType
 * @param {Record<string, unknown>} [properties]
 * @returns {number}
 */
export const ui2RowFloor = (componentType, properties) =>
  componentType === 'ShadKanban' ? kanbanCardHeight(properties) : listRowHeight(properties);

/** Space a UI 2.0 row or card keeps under its lowest component. */
export const UI2_ROW_CHROME = 8;
