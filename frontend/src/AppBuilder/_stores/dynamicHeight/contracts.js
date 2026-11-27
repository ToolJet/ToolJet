import { MODAL_TYPES, TABS_TYPES } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { SDK_COMPONENT_TYPES } from '@/AppBuilder/_helpers/sdkComponentTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Height contracts: how each container type takes part in dynamic height.
// The one place that lists them; a widget type not listed here is a leaf: it
// is measured, never solved.
//
//   content: 'grid'   children are placed by the solver; the container's
//                     height follows its lowest rendered child.
//   content: 'rows'   children are a row template repeated per data row
//                     (List view); the container's height is its rows stacked.
//   content: 'flex'   children are placed by flex rules; only their heights
//                     are written.
//
//   contentSlot: 'activeTab'  the children live on the active tab's canvas,
//                     not on the container's own one (Tabs).
//   portal: true      the body renders outside the grid (Modal): it is sized,
//                     but never pushes the widgets around its trigger.
//   followsExpansion: true  the height follows being opened and closed even
//                     with Dynamic height off (Accordion).
//   moduleRoot: true  the root of an embedded module: drawn flush with the
//                     Module widget, which takes its height from it.
//
//   measured: true    the widget's own code draws its rows, so its height is
//                     measured like a leaf's, never worked out from them. Its
//                     row count is not in its properties either: it comes from
//                     the rows it set up in the store (moduleScope.rowCountOf).
//   rowFit            how one row of a measured list is sized:
//                     'fitted'  its components plus 8px, never below the Row
//                               height (UI 2.0 List view, ui2Rows.js);
//                     'card'    the same, leaving out a component hidden on the
//                               card (UI 2.0 Kanban);
//                     'host'    by the component's host (usePackHost), from
//                               where its components were placed: the engine
//                               only places them.
//
// A component built with the SDK (PackComponent, LibraryComponent) may have
// rows, drop areas, or both. Its rows sit on its own canvas, once per row; its
// drop areas on `<id>-<slot>` canvases, drawn once and solved as grids. Either
// way it measures its own box.
//
// Kept in the frontend rather than on the widget definitions: only the canvas
// reads them, and a definition key would ride along on every component of
// every app the server sends.
// ─────────────────────────────────────────────────────────────────────────────

export const CONTENT_KINDS = ['grid', 'rows', 'flex'];

// Every widget of a type shares its contract object, so they are frozen: a
// caller changing one would change it for all of them.
const contract = (fields) => Object.freeze(fields);

const GRID = contract({ content: 'grid' });
const ACTIVE_TAB = contract({ content: 'grid', contentSlot: 'activeTab' });
const MODAL_BODY = contract({ content: 'grid', portal: true });
const SDK_ROWS = contract({ content: 'rows', measured: true, rowFit: 'host' });

export const HEIGHT_CONTRACTS = Object.freeze({
  Container: GRID,
  Form: GRID,
  Accordion: contract({ content: 'grid', followsExpansion: true }),
  ModuleContainer: contract({ content: 'grid', moduleRoot: true }),
  Listview: contract({ content: 'rows' }),
  FlexContainer: contract({ content: 'flex' }),
  ShadListView: contract({ content: 'rows', measured: true, rowFit: 'fitted' }),
  ShadKanban: contract({ content: 'rows', measured: true, rowFit: 'card' }),
  ...Object.fromEntries(SDK_COMPONENT_TYPES.map((type) => [type, SDK_ROWS])),
  // Native Tabs and Modal plus their UI 2.0 skins, which share their canvases and behaviour.
  ...Object.fromEntries(TABS_TYPES.map((type) => [type, ACTIVE_TAB])),
  ...Object.fromEntries(MODAL_TYPES.map((type) => [type, MODAL_BODY])),
});

// The contract of a widget type, or null for a leaf. `hasOwn` keeps names like
// `toString` from resolving to Object.prototype members.
export const heightContractOf = (componentType) =>
  Object.prototype.hasOwnProperty.call(HEIGHT_CONTRACTS, componentType) ? HEIGHT_CONTRACTS[componentType] : null;
