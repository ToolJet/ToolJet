// Selectors for the Cascader widget (frontend/src/AppBuilder/Widgets/Cascader/Cascader.tsx + CascaderMenu.tsx).
// Pass the runtime name (e.g. "cascader1"). RenderWidget passes dataCy = componentName.
const box = (name) => `[data-cy="draggable-widget-${name}"]`;

export const cascaderSelector = {
  // RenderWidget.jsx — inner box (`.canvas-component`)
  draggableWidget: box,
  // WidgetWrapper.jsx — the canvas wrapper (ancestor of the draggable): id = component id
  wrapper: "[component-type]",
  // Cascader.tsx:262-280 — row holding label + field; `invisible` class while hidden
  root: (name) => `${box(name)} .cascader-widget`,
  // Cascader.tsx:284-298 → Label.jsx:98 `${dataCy}-label`
  label: (name) => `[data-cy="${name}-label"]`,
  // Cascader.tsx:299-305 — the field section
  field: (name) => `[data-cy="${String(name).toLowerCase()}-actionable-section"]`,
  // Cascader.tsx:313-339 — the focusable combobox (#component-<id>, role=combobox, tabIndex 0)
  control: (name) => `${box(name)} [role="combobox"]`,
  // Cascader.tsx:353-366 — selected path / placeholder text
  display: (name) => `${box(name)} .cascader-display`,
  // Cascader.tsx:368-376 — clear button
  clearButton: (name) => `${box(name)} [data-cy="cascader-clear"]`,

  // Portalled Radix popover (Cascader.tsx:390-417) — only one Cascader menu is open at a time
  popover: ".cascader-popover",
  // CascaderMenu.tsx:139 — menu root
  menu: ".cascader-popover .cascader-menu",
  // CascaderMenu.tsx:140-167 — back / breadcrumb header (only below the root level)
  menuBack: '.cascader-popover [data-cy="cascader-menu-back"]',
  // CascaderMenu.tsx:170-180 — the scrolling option list (maxHeight 260px, overflow-y auto)
  menuList: ".cascader-popover .cascader-menu > div:last-child",
  // CascaderMenu.tsx:203-210 — one row per node at the current level
  option: (value) => `.cascader-popover [data-cy="cascader-option-${value}"]`,
  anyOption: '.cascader-popover [data-cy^="cascader-option-"]',
};
