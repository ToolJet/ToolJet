// Selectors for the File Button widget.
//
// The widget builds most of its data-cy from `generateCypressDataCy(componentName)`
// (frontend/src/modules/common/helpers/cypressHelpers.js), so names are derivable
// rather than discovered. `cyBase` mirrors that helper exactly — keep the two in
// step rather than adding another `cyParamName` variant.
const cyBase = (widgetName) =>
  String(widgetName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const fileButtonSelector = {
  // NOTE: `widget` and `draggableWidget` take the name RAW. The widget root
  // (`data-cy={dataCy}`) and RenderWidget's wrapper interpolate the component name
  // unnormalised, so `btnUploadCSV` stays `btnUploadCSV` on these two nodes while
  // every child below is lowercased. Do not "tidy" these into cyBase().
  widget: (name) => `[data-cy="${name}"]`,
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,

  // Always rendered
  inputField: (name) => `[data-cy="${cyBase(name)}-input-field"]`,
  button: (name) => `[data-cy="${cyBase(name)}-button"]`,

  // Only while NOT loading — these live in the else-branch of `isLoading ? ... : ...`
  label: (name) => `[data-cy="${cyBase(name)}-label"]`,
  icon: (name) => `[data-cy="${cyBase(name)}-icon"]`, // + an icon must be configured
  mandatoryIndicator: (name) => `[data-cy="${cyBase(name)}-mandatory-indicator"]`, // + mandatory on
  // + a file is held and clear selection is enabled. Rendered as a SIBLING of the
  // trigger (absolutely positioned), not nested inside it, so its disabled state
  // does not cascade from the trigger.
  clearButton: (name) => `[data-cy="${cyBase(name)}-clear-button"]`,

  // Only while loading — mutually exclusive with label/icon/clear above
  loader: (name) => `[data-cy="${cyBase(name)}-loader"]`,

  // Only while a rejection is showing
  invalidFeedback: (name) => `[data-cy="${cyBase(name)}-invalid-feedback"]`,

  // Accessibility hooks on the file input. Usable as assertions, and as selectors
  // for sibling file widgets that still lack a data-cy.
  ariaRequired: (name) => `${fileButtonSelector.inputField(name)}[aria-required="true"]`,
  ariaBusy: (name) => `${fileButtonSelector.inputField(name)}[aria-busy="true"]`,
  // Tracks isPickerDisabled (disabled OR at the file limit), not just the disable property.
  ariaDisabled: (name) => `${fileButtonSelector.inputField(name)}[aria-disabled="true"]`,
};
