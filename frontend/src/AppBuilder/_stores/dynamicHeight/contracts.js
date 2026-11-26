import { MODAL_TYPES, TABS_TYPES } from '@/AppBuilder/AppCanvas/appCanvasConstants';

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
// Kept in the frontend rather than on the widget definitions: only the canvas
// reads them, and a definition key would ride along on every component of
// every app the server sends. Component pack containers with rows of their own
// (UI 2.0 List view, Kanban) follow the pack rules, not a contract here.
// ─────────────────────────────────────────────────────────────────────────────

export const CONTENT_KINDS = ['grid', 'rows', 'flex'];

// Every widget of a type shares its contract object, so they are frozen: a
// caller changing one would change it for all of them.
const contract = (fields) => Object.freeze(fields);

const GRID = contract({ content: 'grid' });
const ACTIVE_TAB = contract({ content: 'grid', contentSlot: 'activeTab' });
const MODAL_BODY = contract({ content: 'grid', portal: true });

export const HEIGHT_CONTRACTS = Object.freeze({
  Container: GRID,
  Form: GRID,
  Accordion: contract({ content: 'grid', followsExpansion: true }),
  ModuleContainer: contract({ content: 'grid', moduleRoot: true }),
  Listview: contract({ content: 'rows' }),
  FlexContainer: contract({ content: 'flex' }),
  // Native Tabs and Modal plus their UI 2.0 skins, which share their canvases and behaviour.
  ...Object.fromEntries(TABS_TYPES.map((type) => [type, ACTIVE_TAB])),
  ...Object.fromEntries(MODAL_TYPES.map((type) => [type, MODAL_BODY])),
});

// The contract of a widget type, or null for a leaf. `hasOwn` keeps names like
// `toString` from resolving to Object.prototype members.
export const heightContractOf = (componentType) =>
  Object.prototype.hasOwnProperty.call(HEIGHT_CONTRACTS, componentType) ? HEIGHT_CONTRACTS[componentType] : null;
