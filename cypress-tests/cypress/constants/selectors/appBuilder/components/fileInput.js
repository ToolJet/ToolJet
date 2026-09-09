// Selectors for the File Input widget.
//
// The widget builds its child data-cy from `generateCypressDataCy(dataCy)`
// (frontend/src/modules/common/helpers/cypressHelpers.js), so names are derivable rather
// than discovered. `cyBase` mirrors that helper exactly — keep the two in step rather
// than adding another variant.
//
// Those attributes were ADDED to FileInput.jsx as part of this work. Before that the
// widget emitted exactly one data-cy (its root) and its label rendered as
// `undefined-label`, because no `dataCy` prop reached _ui/Label — a name shared with
// every other widget carrying that gap, and therefore useless as an identifier. Every
// selector below now addresses one instance unambiguously.
const cyBase = (widgetName) =>
  String(widgetName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const fileInputSelector = {
  // NOTE: `widget` and `draggableWidget` take the name RAW. The widget root
  // (`data-cy={dataCy}`) and RenderWidget's wrapper interpolate the component name
  // unnormalised, so `fiUploadDoc` stays `fiUploadDoc` on these two nodes while every
  // child below is lowercased. Do not "tidy" these into cyBase().
  //
  // The root also carries the alignment/direction Tailwind classes: tw-flex-col
  // (alignment top) · tw-flex-row (side) · tw-flex-row-reverse and tw-text-right
  // (direction right).
  widget: (name) => `[data-cy="${name}"]`,
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,

  // Always rendered
  // The bordered box. Every container style is an INLINE style here
  // (FileInput.jsx:159-204): border-radius, border-color, box-shadow, background-color,
  // and `color` for textColor.
  field: (name) => `[data-cy="${cyBase(name)}-field"]`,
  // The real file input — visually hidden but present, and the only carrier of the aria
  // state plus the `accept`/`multiple` attributes the validation block drives.
  inputField: (name) => `[data-cy="${cyBase(name)}-input-field"]`,
  // The filename / "N files selected" / placeholder text.
  summary: (name) => `[data-cy="${cyBase(name)}-summary"]`,

  // Rendered only when `label && (width > 0 || auto)` (Label.jsx:31) — an empty label
  // removes the element rather than emptying it.
  label: (name) => `[data-cy="${cyBase(name)}-label"]`,
  // The colour target is the inner <p>, not the <label> wrapper (Label.jsx:52).
  labelText: (name) => `[data-cy="${cyBase(name)}-label"] p`,
  // The mandatory `*` is a <span> INSIDE that <p> (Label.jsx:69-80) and carries no
  // data-cy of its own — _ui/Label is shared by 8+ widgets, so adding one there is a
  // wider change than this widget owns. Assert on this element, never on the label's
  // full text, which includes the asterisk.
  mandatoryIndicator: (name) => `[data-cy="${cyBase(name)}-label"] p span`,

  // Only while NOT loading — Browse and the loader are the two branches of one ternary
  // (FileInput.jsx:287-318), so exactly one of these exists at a time.
  browseButton: (name) => `[data-cy="${cyBase(name)}-button"]`,
  loader: (name) => `[data-cy="${cyBase(name)}-loader"]`,
  // + an icon must be visible: iconVisibility ships false, so this is ABSENT by default.
  icon: (name) => `[data-cy="${cyBase(name)}-icon"]`,

  // + a file is held AND clear selection is enabled (which itself ships off).
  clearButton: (name) => `[data-cy="${cyBase(name)}-clear-button"]`,

  // Only while a validation error is showing. Rendered as a SIBLING of the widget root
  // (FileInput.jsx:350), not inside the field box.
  errorMessage: (name) => `[data-cy="${cyBase(name)}-invalid-feedback"]`,

  // State-scoped variants of the field box.
  fieldDisabled: (name) => `[data-cy="${cyBase(name)}-field"].tj-file-input-disabled`,
  fieldError: (name) => `[data-cy="${cyBase(name)}-field"].tj-file-input-error`,

  // Accessibility hooks on the file input. Usable as assertions, and as selectors.
  ariaRequired: (name) => `${fileInputSelector.inputField(name)}[aria-required="true"]`,
  ariaBusy: (name) => `${fileInputSelector.inputField(name)}[aria-busy="true"]`,
  // Tracks disabled OR picker-disabled (at the file limit), not just the disable property.
  ariaDisabled: (name) => `${fileInputSelector.inputField(name)}[aria-disabled="true"]`,
};
