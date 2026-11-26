import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager/componentTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Height contracts — how a container takes part in dynamic height, declared on
// its widget definition (`heightContract` in packages/widget-definitions):
//
//   content: 'grid'   children are placed by the solver; the container's
//                     height follows the lowest rendered child.
//   content: 'rows'   children are a row template repeated per data row
//                     (Listview); the container's height is the rows stacked.
//   content: 'flex'   children are placed by flex rules; only their heights
//                     are written.
//   contentSlot: 'activeTab'   grid content lives in the active tab's pane,
//                     not in the container's own slot (Tabs).
//   portal: true      the body renders outside the grid (ModalV2): it is
//                     sized, but never pushes siblings.
//   followsExpansion: true   height follows an expanded/collapsed state even
//                     with `dynamicHeight` off (Accordion).
//   moduleRoot: true  the root of an embedded module: drawn flush with its
//                     instance, and it fits its content in both directions.
//
// A widget without a contract is a leaf: it is measured, never solved.
// ─────────────────────────────────────────────────────────────────────────────

export const CONTENT_KINDS = ['grid', 'rows', 'flex'];

export const heightContractOf = (componentType) => componentTypeDefinitionMap[componentType]?.heightContract ?? null;
