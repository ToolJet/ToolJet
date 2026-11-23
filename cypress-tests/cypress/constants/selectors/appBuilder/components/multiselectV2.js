// Selectors for the Multi Select (MultiselectV2) widget (frontend/src/AppBuilder/Widgets/MultiselectV2/MultiselectV2.jsx).
// Pass the runtime name (e.g. "multiselect1"); the portalled menu is reached through the component id.
// The Select has no classNamePrefix and the field carries no data-cy, so the react-select parts are reached
// structurally (emotion class labels such as `-control` only exist in development builds).
const box = (name) => `[data-cy="draggable-widget-${name}"]`;

export const multiselectV2Selector = {
  // RenderWidget.jsx — inner box (`.canvas-component._tooljet-MultiselectV2`)
  draggableWidget: box,
  // WidgetWrapper.jsx — the canvas wrapper (ancestor of the draggable): id = component id
  wrapper: "[component-type]",
  // MultiselectV2.jsx:528-551 — row holding label + field (its data-cy is `label-<name> ` with a trailing space)
  root: (name) => `${box(name)} .multiselect-widget`,
  // MultiselectV2.jsx:567-574 — the field: click / touch-end target that toggles the menu (no data-cy)
  field: (name) => `${box(name)} .multiselect-widget > div.px-0`,
  // MultiselectV2.jsx:596 — react-select container `#component-<id>`
  container: (name) => `${box(name)} [id^="component-"]`,
  // react-select Control — the only <div> child of the container (the a11y nodes are <span>s)
  control: (name) => `${box(name)} [id^="component-"] > div`,
  // CustomValueContainer.jsx:67 — the selected-labels summary (`id="options"`, repeated by every Multi Select)
  summary: (name) => `${box(name)} [id^="component-"] span#options`,
  // react-select IndicatorsContainer — last child of the Control
  indicators: (name) => `${box(name)} [id^="component-"] > div > div:last-child`,
  // MultiselectV2.jsx:611 → ToolJetUI/Loader/Loader.jsx
  loader: (name) => `${box(name)} .tj-widget-loader`,
  // react-select combobox input (receives focus when the search box is off — MultiselectV2.jsx:389-391)
  combobox: (name) => `${box(name)} input[role="combobox"]`,

  // Portalled menu (menuPortalTarget=document.body, MultiselectV2.jsx:644)
  // CustomMenuList.jsx:70-72 — `#dropdown-multiselect-widget-custom-menu-list-<componentId>` (menuId = id)
  menu: (componentId) => `#dropdown-multiselect-widget-custom-menu-list-${componentId}`,
  anyMenu: ".dropdown-multiselect-widget-custom-menu-list",
  // CustomMenuList.jsx:113-120 — the virtualized scroller
  menuBody: ".dropdown-multiselect-widget-custom-menu-list-body",
  // CustomMenuList.jsx:86-108 — search box at the top of the menu
  menuSearch: ".dropdown-multiselect-widget-search-box",
  // react-select option ids: react-select-<instance>-option-<index> (CustomOption.jsx:19)
  option: '[id^="react-select-"][id*="-option-"]',
  // CustomOption.jsx:26 — the option's checkbox
  optionCheck: "input.form-check-input",
};
