// Selectors for the File Input widget (FileInput.jsx). Config: packages/widget-definitions/src/widgets/fileinput.js
//
// Children derive their data-cy from `generateCypressDataCy(dataCy)` (cypressHelpers.js); `cyBase` mirrors it.
const cyBase = (widgetName) =>
  String(widgetName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const fileInputSelector = {
  // widget root (FileInput.jsx:243 `data-cy={dataCy}`) and RenderWidget's wrapper take the name raw
  widget: (name) => `[data-cy="${name}"]`,
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,

  label: (name) => `[data-cy="${cyBase(name)}-label"]`, // Label.jsx:98
  // the hidden native <input type="file"> the Browse click is delegated to (FileInput.jsx:277-285)
  inputField: (name) => `[data-cy="${cyBase(name)}-input-field"]`,
  button: (name) => `[data-cy="${cyBase(name)}-button"]`, // Browse (FileInput.jsx:303-313)
  loader: (name) => `[data-cy="${cyBase(name)}-loader"]`, // FileInput.jsx:295
  clearButton: (name) => `[data-cy="${cyBase(name)}-clear-button"]`, // FileInput.jsx:349
  invalidFeedback: (name) => `[data-cy="${cyBase(name)}-invalid-feedback"]`, // FileInput.jsx:368

  // No data-cy: the dropzone root carries only the component id (FileInput.jsx:276) and the
  // selected-file summary span has neither (FileInput.jsx:327-334).
  field: (id) => `#component-${id}`,
  fieldByName: (name) => `[data-cy="${name}"] .tj-file-input-field`,
  summary: (name) => `[data-cy="${name}"] .tj-file-input-field span.tw-truncate`,
};
