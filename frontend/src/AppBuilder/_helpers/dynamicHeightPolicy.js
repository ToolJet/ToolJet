// Which widgets size to their content in the viewer. One rule, read by the canvas wrapper (which slot height to use),
// the FlexContainer (whether it grows) and the component packs (whether they measure themselves), so the three agree.
import { usesFlexLayoutV2 } from './flexLayoutVersion';
import { isSdkComponentType } from './sdkComponentTypes';
import { heightContractOf } from '@/AppBuilder/_stores/dynamicHeight/contracts';

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

/**
 * Whether the canvas box (WidgetWrapper) of a widget that sizes to its content (fitsContentInView) follows that
 * content in the viewer: drawn at height: auto, so the browser sizes it from what the widget draws, and the height
 * registry measures it there.
 *
 * - A widget the engine measures in the browser does: one with no height contract (a native leaf, a UI 2.0 or pack
 *   widget), or a `measured` one (a UI 2.0 or pack list, an SDK component). A pack's host draws fitted content at
 *   auto and anything else at an explicit height (SdkComponentHost), so an auto box always holds what it draws.
 * - A native List view does: its rows are drawn one under another, so the box is their height.
 * - A container sized from its children does not: they are placed absolutely, so an auto box would collapse. Its
 *   height comes from the engine.
 * @param {string | undefined} componentType
 * @returns {boolean}
 */
export const boxFollowsContent = (componentType) => {
  const contract = heightContractOf(componentType);
  return contract === null || contract.measured === true || componentType === 'Listview';
};

// UI 2.0 widgets drawn at their box's height in the viewer too: their host draws them at the box's height
// (SdkComponentHost, when the component cannot fit its content), so their box never grows with what they show.
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
 * centres. A stretched leaf is measured as drawn, at its line's height; its slot's floor is its drawn height, never a
 * measured one (FlexContainer followContentInSlot), so the row can still shrink.
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
    (childType === 'ShadStat' || (isSdkComponentType(childType) && packRole === 'stat')) &&
    childProperties.card !== false &&
    fitsContentInView(childType, childProperties)
  );
};

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
