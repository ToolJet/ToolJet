// Selectors for the Popover Menu widget (frontend/src/AppBuilder/Widgets/PopoverMenu/PopoverMenu.jsx +
// components/CustomButton.jsx + components/CustomOptions.jsx). Pass the runtime name (e.g. "popovermenu1").
// RenderWidget passes dataCy = componentName. The portalled menu parts carry fixed, unprefixed data-cy values,
// so a widget's own menu is reached through the trigger's aria-controls (`popover-menu-<component id>`).
const box = (name) => `[data-cy="draggable-widget-${name}"]`;

export const popoverMenuSelector = {
  // RenderWidget.jsx — inner box (`.canvas-component`)
  draggableWidget: box,
  // WidgetWrapper.jsx — the canvas wrapper (ancestor of the draggable): id = component id
  wrapper: "[component-type]",
  // PopoverMenu.jsx:186 — role=region root, data-cy = dataCy
  root: (name) => `${box(name)} [data-cy="${name}"]`,
  // CustomButton.jsx:145-147 — the Popover.Trigger element (unprefixed data-cy)
  buttonContainer: (name) => `${box(name)} [data-cy="popover-menu-button-container"]`,
  // CustomButton.jsx:157-191 — the real trigger <button> (no data-cy of its own)
  trigger: (name) => `${box(name)} button`,
  // CustomButton.jsx:210-222 — label paragraph
  triggerLabel: (name) => `${box(name)} button p`,
  // CustomButton.jsx:243 → ToolJetUI/Loader — the loader <svg>
  loader: (name) => `${box(name)} button .tj-widget-loader svg`,

  // Portalled Radix popover (PopoverMenu.jsx:206-252) — only one menu is open at a time
  portal: '[data-cy="popover-menu-portal-container"]',
  content: '[data-cy="popover-menu-content"]',
  // the open menu of one widget: Popover.Content id (PopoverMenu.jsx:209)
  contentById: (id) => `[id="${id}"]`,
  // CustomOptions.jsx:130-147 — scrolling option list (maxHeight 323px, overflow-y auto)
  listbox: '[data-cy="popover-menu-content"] [data-cy="popover-menu-options-listbox"]',
  // CustomOptions.jsx:160-176 — one row per visible option, data-cy carries the source index
  option: (index) => `[data-cy="popover-menu-content"] [data-cy="popover-menu-option-${index}"]`,
  anyOption: '[data-cy="popover-menu-content"] [role="option"]',
};
