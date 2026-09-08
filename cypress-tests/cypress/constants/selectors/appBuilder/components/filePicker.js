// Selectors for the File Picker widget.
//
// DIVERGENCE FROM File Input — do not copy that module's `cyBase()` in here.
// RenderWidget passes `dataCy={componentName}` RAW (RenderWidget.jsx:343) and FilePicker
// interpolates it directly (`${dataCy}-upload-files-label`, FilePicker.jsx:232) with no
// generateCypressDataCy pass. File Input normalises; this widget does not. So every
// selector below takes the instance name verbatim, and a renamed widget such as
// `fpUploadDoc` keeps its camelCase in the attribute. Lowercasing it here would silently
// match nothing.
export const filePickerSelector = {
  // The widget root: div.file-picker-widget-wrapper. Container styles land as INLINE
  // styles here — borderRadius and boxShadow via dynamicDropzoneStyle
  // (FilePicker.jsx:141,215) and, imperatively, the `--file-picker-text-primary` custom
  // property that dropzoneTitleColor drives (FilePicker.jsx:104).
  widget: (name) => `[data-cy="${name}"]`,
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,

  // The <h3> label. `label` is FilePicker's own title element, NOT a shared _ui/Label —
  // this widget has no side/top alignment and no label-width group at all.
  // Its colour comes from `var(--file-picker-text-primary)` (FilePicker.jsx:230), so a
  // literal-colour assertion must read the COMPUTED value or the root's custom property.
  title: (name) => `[data-cy="${name}-upload-files-label"]`,
  // The mandatory `*` is a <span> inside that <h3> with an inline colour
  // (FilePicker.jsx:235) — assert on this node, never on the title's full text.
  mandatoryIndicator: (name) => `[data-cy="${name}-upload-files-label"] span`,

  // The size/count summary strip. The whole bar returns null when neither half is
  // relevant (ValidationBar.jsx:19); each span has its own gate, so absence is meaningful:
  //   size-info  — minSize > 0 || (maxSize > 0 && maxSize < Infinity)   ValidationBar.jsx:14
  //   count-info — enableMultiple || minFileCount > 0                   ValidationBar.jsx:16
  // Defaults are minSize 50 / maxSize 51200000 / enableMultiple false / minFileCount 0,
  // so out of the box the bar renders with size-info ONLY.
  validationBar: (name) => `[data-cy="${name}-validation-bar"]`,
  sizeInfo: (name) => `[data-cy="${name}-size-validation-info"]`,
  countInfo: (name) => `[data-cy="${name}-count-validation-info"]`,

  // The react-dropzone root. It carries NO data-cy (UploadArea.jsx:54) — it is reached by
  // descending the widget root, and it owns the tab stop (`tabIndex` 0, or -1 when
  // disabled, UploadArea.jsx:58) plus the state classes.
  dropzone: (name) => `[data-cy="${name}"] .file-picker-dropzone`,
  dropzoneDisabled: (name) => `[data-cy="${name}"] .file-picker-dropzone.is-disabled`,
  dropzoneFocused: (name) => `[data-cy="${name}"] .file-picker-dropzone.is-focused`,

  // The real file input — present but visually hidden, and the only carrier of the aria
  // state plus the `accept`/`multiple` attributes the validation block drives.
  inputField: (name) => `[data-cy="${name}-input-field"]`,

  // Dropzone copy. Exactly one of these five renders at a time, and a UI error replaces
  // ALL of them (UploadArea.jsx:72-78).
  //   instructionText disappears once selectedFiles >= maxFileCount (UploadArea.jsx:34),
  //   which is a state a spec can reach without any drag.
  instructionText: (name) => `[data-cy="${name}-drag-drop-instruction-text"]`,
  // The next three need a LIVE react-dropzone drag (isDragActive) — not reachable by
  // selectFile, only by a real dragenter carrying a dataTransfer.
  dragDropMessage: (name) => `[data-cy="${name}-drag-drop-message"]`,
  dropToUploadMessage: (name) => `[data-cy="${name}-drop-file-to-start-uploading-message"]`,
  cannotUploadMessage: (name) => `[data-cy="${name}-cannot-upload-these-files-message"]`,
  // Reachable without a drag: disabled AND at the file cap (UploadArea.jsx:38).
  maxFilesMessage: (name) => `[data-cy="${name}-maximum-files-uploaded-message"]`,

  // Instance-scoped, matching FileButton.jsx:270 and FileInput.jsx:370. Until FP-1 was
  // fixed this was a literal `file-picker-error-message` on every instance and had to be
  // reached by descending the widget root.
  errorMessage: (name) => `[data-cy="${name}-invalid-feedback"]`,

  // Replaces the entire top section while loading (FilePicker.jsx:218) — so the title and
  // dropzone are ABSENT, not merely covered.
  loader: (name) => `[data-cy="${name}"] .tj-widget-loader`,

  // The selected-file list, rendered only when at least one file is held
  // (FilePicker.jsx:273).
  filePane: (name) => `[data-cy="${name}"] .file-picker-files-pane`,
  fileListItem: (name) => `[data-cy="${name}"] .file-list-item`,
  fileListItemError: (name) => `[data-cy="${name}"] .file-list-item.error`,

  // File-list ids are widget-scoped AND name-bearing —
  // `${widget}-${nameWithoutExtension}-<suffix>` (FileListItem.jsx) — so two pickers
  // holding the same file stay separately addressable, and the id matches the label the
  // user sees. Both drop the extension because it is stripped BEFORE
  // generateCypressDataCy; doing it after cannot work, since the helper has already
  // turned "." into "-" (that was FP-2, where the id kept the extension the label lost).
  fileName: (name, fileName) => `[data-cy="${name}-${cyFile(fileName)}-file-name"]`,
  fileMeta: (name, fileName) => `[data-cy="${name}-${cyFile(fileName)}-file-meta"]`,
  fileDeleteButton: (name, fileName) =>
    `[data-cy="${name}-${cyFile(fileName)}-file-delete-button"]`,

  // Accessibility hooks on the file input. Usable as assertions, and as selectors.
  ariaRequired: (name) => `${filePickerSelector.inputField(name)}[aria-required="true"]`,
  ariaBusy: (name) => `${filePickerSelector.inputField(name)}[aria-busy="true"]`,
  ariaDisabled: (name) => `${filePickerSelector.inputField(name)}[aria-disabled="true"]`,
  ariaHidden: (name) => `${filePickerSelector.inputField(name)}[aria-hidden="true"]`,
};

// Mirrors FileListItem.jsx: strip the extension FIRST, then run generateCypressDataCy
// (frontend/src/modules/common/helpers/cypressHelpers.js). Order matters — reversing it is
// what made the id and the label disagree. Applied ONLY to file names; the widget's own
// instance name is used raw, per the note at the top of this file.
function cyFile(fileName) {
  return String(fileName)
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
