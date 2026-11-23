// Selectors for the Key Value Pair widget (frontend/src/AppBuilder/Widgets/KeyValuePair/KeyValuePair.jsx,
// _components/KeyValueRow.jsx) and its custom inspector (RightSideBar/Inspector/Components/KeyValuePair/**).
// Pass the runtime name (e.g. "keyvaluepair1"). RenderWidget passes dataCy = componentName, which KeyValuePair puts on
// its `.key-value-pair-container` root (KeyValuePair.jsx:248).
const root = (name) => `[data-cy="${name}"]`;

export const keyValuePairSelector = {
  // KeyValuePair.jsx:238-250 — bordered root (owns the 1px border, radius, padding)
  container: (name) => `${root(name)}.key-value-pair-container`,
  // KeyValuePair.jsx:251-254 — the scrolling value list
  content: (name) => `${root(name)} .key-value-pair-content`,
  // KeyValueRow.jsx:180 — one per field, in render order
  rows: (name) => `${root(name)} .kv-row-container`,
  // KeyValueRow.jsx:182-198 — the label <label> (data-cy renders as "undefined-label") and its text <p>
  labels: (name) => `${root(name)} .key-value-label`,
  // KeyValueRow.jsx:199-207 — value cell; `kv-<fieldType>` modifier per field type
  valueCells: (name) => `${root(name)} .key-value-render-value`,
  valueCell: (name, fieldType) => `${root(name)} .key-value-render-value.kv-${fieldType}`,
  // StringRenderer — the contenteditable that a click on an editable string cell focuses
  editingString: (name) => `${root(name)} .kv-value-editing [contenteditable="true"]`,
  editingCell: (name) => `${root(name)} .kv-value-editing`, // KeyValueRow.jsx:201 while a cell is in edit mode
  // KeyValuePair.jsx:280-309 — changeset bar
  changesetPopover: (name) => `${root(name)} .kv-changeset-popover`,
  changesetContent: (name) => `${root(name)} .kv-changeset-content`,
  cancelButton: (name) => `${root(name)} [data-cy="kv-button-cancel"]`,
  saveButton: (name) => `${root(name)} [data-cy="kv-button-save-changes"]`,
  // KeyValuePair.jsx:282 — react-tooltip rendered inside the bar (icon tier only)
  ctaTooltip: (name) => `${root(name)} .react-tooltip`,
  // ImageRenderer — <img> inside an image field
  image: (name) => `${root(name)} .kv-image img`,
};

// Field-type popovers (shared DataTypes renderers, portalled outside the widget).
export const keyValuePairPopoverSelector = {
  // DatePickerRenderer.jsx:16-35 custom input + react-datepicker popper (portalId "component-portal")
  dateInput: (name) => `[data-cy="${name}"] .kv-datepicker .table-column-datepicker-input`,
  datePopper: ".react-datepicker-popper",
  dateDay: (day) => `.react-datepicker__day--0${String(day).padStart(2, "0")}:not(.react-datepicker__day--outside-month)`,
  dateSelectedDay: ".react-datepicker__day--selected",
  dateKeyboardSelectedDay: ".react-datepicker__day--keyboard-selected",
  // SelectRenderer — react-select menu portalled to <body>; options are custom `.option-wrapper` rows
  selectMenu: ".react-select__menu",
  selectOptions: ".react-select__menu .option-wrapper",
  selectFocusedOption: ".react-select__menu .option-wrapper.option-focused",
  singleValue: (name) => `[data-cy="${name}"] .kv-select .react-select__single-value`,
  multiValueLabels: (name) => `[data-cy="${name}"] .kv-newMultiSelect .react-select__multi-value__label`,
  selectInput: (name, fieldType) => `[data-cy="${name}"] .kv-${fieldType} input[role="combobox"]`,
};

// Inspector › Properties › Fields (FieldManager/FieldsList.jsx, FieldItem.jsx, ToolJetUI List.jsx).
export const keyValuePairInspectorSelector = {
  addField: '[data-cy="button-add-field"]', // FieldsList.jsx:54
  // FieldItem.jsx:104 — `field-<resolved name>` (name is not slugified, spaces are kept)
  fieldItem: (fieldName) => `[data-cy="field-${fieldName}"]`,
  fieldItems: '[data-cy^="field-"].list-group-item',
  // FieldItem.jsx:64-69 — the react-beautiful-dnd draggable + drag handle wrapper (keyboard sensor target)
  dragHandle: (fieldId) => `[data-rbd-drag-handle-draggable-id="${fieldId}"]`,
  // List.jsx:148-160 — rendered only while the row is hovered
  deleteButton: (fieldName) => `[data-cy="field-${fieldName}"] .delete-icon-btn`,
};
