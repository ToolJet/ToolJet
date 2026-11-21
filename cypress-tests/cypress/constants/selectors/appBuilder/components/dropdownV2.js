// Selectors for the Dropdown (DropdownV2) widget (frontend/src/AppBuilder/Widgets/DropdownV2/DropdownV2.jsx).
// Pass the runtime name (e.g. "dropdown1"). RenderWidget passes dataCy = componentName.
// The Select has no classNamePrefix, so react-select parts are reached structurally (emotion class labels
// such as `-control` only exist in development builds).
const box = (name) => `[data-cy="draggable-widget-${name}"]`;

export const dropdownV2Selector = {
  // RenderWidget.jsx — inner box with BOX_PADDING (`.canvas-component._tooljet-DropdownV2`)
  draggableWidget: box,
  // WidgetWrapper.jsx — the canvas wrapper (ancestor of the draggable): id = component id
  wrapper: "[component-type]",
  // DropdownV2.jsx:523-535 — row holding label + field; `invisible` class while hidden
  root: (name) => `${box(name)} .dropdown-widget`,
  // DropdownV2.jsx:547-562 → Label.jsx `${dataCy}-label`
  label: (name) => `[data-cy="${String(name).toLowerCase()}-label"]`,
  // DropdownV2.jsx:563-572 — the field (click/touch target that toggles the menu)
  field: (name) => `[data-cy="${String(name).toLowerCase()}-actionable-section"]`,
  // DropdownV2.jsx:608 — react-select container `#component-<id>`
  container: (name) => `${box(name)} [id^="component-"]`,
  // react-select Control — the only <div> child of the container (the a11y nodes are <span>s)
  control: (name) => `${box(name)} [id^="component-"] > div`,
  // react-select ValueContainer — first child of the Control (DropdownV2.jsx:421-428 styles, justifyContent)
  valueContainer: (name) => `${box(name)} [id^="component-"] > div > div:first-child`,
  // CustomValueContainer.jsx:40-53 — SingleValue or Placeholder (both <div>) inside the inner span
  valueText: (name) => `${box(name)} [id^="component-"] > div > div:first-child span.d-flex > div`,
  // react-select IndicatorsContainer — last child of the Control
  indicators: (name) => `${box(name)} [id^="component-"] > div > div:last-child`,
  // DropdownV2.jsx:48-63 — clear indicator (role=button, aria-label "Clear selection")
  clearButton: (name) => `${box(name)} .clear-indicator`,
  // DropdownV2.jsx:623 → ToolJetUI/Loader/Loader.jsx
  loader: (name) => `${box(name)} .tj-widget-loader`,
  // react-select combobox input (aria-invalid / aria-expanded)
  combobox: (name) => `${box(name)} input[role="combobox"]`,
  // DropdownV2.jsx:656-670 — rendered after user interaction while invalid; id = `<componentId>-validation-error`
  validationError: (componentId) => `[id="${componentId}-validation-error"]`,

  // Portalled menu (menuPortalTarget=document.body, DropdownV2.jsx:617) — only one menu is open at a time.
  // CustomMenuList.jsx:70-80 — menu list (its parent is the react-select Menu, grandparent the MenuPortal)
  menuList: ".dropdown-multiselect-widget-custom-menu-list",
  // CustomMenuList.jsx:113-120 — the virtualized scroller
  menuBody: ".dropdown-multiselect-widget-custom-menu-list-body",
  // CustomMenuList.jsx:86-108 — search box at the top of the menu
  menuSearch: ".dropdown-multiselect-widget-search-box",
  // react-select option ids: react-select-<instance>-option-<index>
  option: '.dropdown-multiselect-widget-custom-menu-list [id^="react-select-"][id*="-option-"]',
};
