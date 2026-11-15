// Selectors for the Tree Select widget (frontend/src/AppBuilder/Widgets/TreeSelect/TreeSelect.jsx).
// Pass the runtime name (e.g. "treeselect1"). RenderWidget passes dataCy = componentName.
export const treeSelectSelector = {
  // RenderWidget.jsx:340-347 — inner box: BOX_PADDING / padding:none; its parent is the WidgetWrapper (grid box)
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // TreeSelect.jsx:434-450 — `.custom-checkbox-tree` root (height 100% | auto, overflow-y auto, display:none when hidden)
  root: (name) => `[data-cy="draggable-widget-${name}"] .custom-checkbox-tree[data-cy="${name}"]`,
  // react-checkbox-tree TreeNode — one <li> per rendered node (children only while the parent is expanded)
  nodes: (name) => `[data-cy="draggable-widget-${name}"] li.rct-node`,
  // react-checkbox-tree TreeNode.renderCollapseButton — the expand / collapse toggle of a parent node
  toggles: (name) => `[data-cy="draggable-widget-${name}"] button.rct-collapse-btn`,
  // TreeSelectCheckbox.jsx:45-80 — the per-node checkbox input (keyboard target; mouse goes to the row)
  checkboxes: (name) => `[data-cy="draggable-widget-${name}"] .rct-title input[data-cy="checkbox-input"]`,
};
