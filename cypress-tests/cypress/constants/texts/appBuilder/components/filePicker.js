// Test data for the File Picker facet specs.
//
// Standalone, like the File Button and File Input constants — the three file widgets share
// an Inspector panel but almost nothing else, and a shared fixture set would silently
// mis-test one of them.
//
// Fixture paths are repo-relative — these go through cy.selectFile, not cy.fixture.

export const filePickerText = {
  defaultWidgetName: "filepicker1",
  defaultWidgetText: "File Picker", // the WidgetManager display name, for dragAndDropWidget
  defaultLabel: "Upload files", // source: filepicker.js:376
  defaultInstruction: "Drag and drop files here or click to select files", // source: filepicker.js:377

  // Hardcoded dropzone copy — none of it is configurable (UploadArea.jsx:88-105).
  dragDropMessage: "Drop the files here ...",
  dropToUploadMessage: "Drop file to start uploading",
  cannotUploadMessage: "Cannot upload these files",
  maxFilesMessage: "Maximum files uploaded",

  // The file list renders the name with its EXTENSION STRIPPED (FileListItem.jsx:23),
  // so an assertion built from a fixture filename must go through this. The matching
  // data-cy keeps the extension — see FP-2 in the selectors module.
  fileDisplayName: (fileName) => String(fileName).replace(/\.[^/.]+$/, ""),
};

// ValidationBar text builders. The bar composes its own strings, so these mirror
// ValidationBar.jsx rather than restating a config default.
// formatFileSize is binary (1024) with 2 decimals, trailing zeros trimmed
// (_helpers/utils.js:20-27).
export const filePickerValidationBar = {
  // minSize > 0 && maxSize < Infinity  → "50 Bytes to 48.83 MB"   ValidationBar.jsx:49-51
  sizeRange: (min, max) => `${formatFileSize(min)} to ${formatFileSize(max)}`,
  // only max                          → "Up to 48.83 MB"          ValidationBar.jsx:51-52
  sizeUpTo: (max) => `Up to ${formatFileSize(max)}`,
  // only min                          → "Min 50 Bytes"            ValidationBar.jsx:53
  sizeMin: (min) => `Min ${formatFileSize(min)}`,

  // min and max differ                → "0 (1-2 files)"           ValidationBar.jsx:31
  countRange: (n, min, max) => `${n} (${min}-${max > 0 ? max : "any"} files)`,
  // min only, or min === max          → "0 (Min 2 files)"         ValidationBar.jsx:34
  countMin: (n, min) => `${n} (Min ${min} file${min !== 1 ? "s" : ""})`,
  // max only — the standard case      → "0/2"                     ValidationBar.jsx:37
  countMax: (n, max) => `${n}/${max > 0 ? max : "any"}`,

  // What a freshly dropped widget shows: minSize 50 (filepicker.js:406) and maxSize
  // 51200000 (:407) make size-info render, while enableMultiple false (:380) and
  // minFileCount 0 (:408) leave count-info ABSENT.
  defaultSizeInfo: "50 Bytes to 48.83 MB",
};

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Every rejection reason, verbatim from the switch that builds them
// (useFilePicker.js:210-238). The same string is written to the inline error node AND
// passed to toast.error (:239-240), so each one is assertable twice — see
// expectInlineAndToastError.
//
// Asserting the whole sentence rather than a substring is what distinguishes "rejected for
// the reason under test" from "rejected for some other reason", which a `contain.text` on
// the file name would not.
export const filePickerErrors = {
  invalidType: (name) => `The file "${name}" has an unsupported file type.`,
  // The category clause is appended only when fileType is set and not */* (:212-214).
  invalidTypeFor: (name, category) =>
    `The file "${name}" has an unsupported file type. Please upload files of type: ${category}.`,
  tooSmall: (name, bytes, minBytes) =>
    `The file "${name}" (${formatFileSize(bytes)}) is smaller than the minimum allowed size of ${formatFileSize(
      minBytes
    )}.`,
  tooLarge: (name, bytes, maxBytes) =>
    `The file "${name}" (${formatFileSize(bytes)}) exceeds the maximum allowed size of ${formatFileSize(
      maxBytes
    )}.`,
  // What a user sees at the cap, straight from the validator (useFilePicker.js:281-283).
  //
  // NOT the switch's `too-many-files` string ("You can select a maximum of N files.",
  // :227) — that is react-dropzone's code and `maxFiles` is never passed to useDropzone
  // (:408-419), so the library never emits it and that branch is dead. The cap is enforced
  // only by the custom validator, which returns `max-files-exceeded`, a code the switch
  // does not handle, so the default branch echoes the validator's own message. See FP-11.
  maxFilesExceeded: (maxCount) => `You can only upload up to ${maxCount} files.`,
  // And with Allow picking multiple files OFF, a second selection is REFUSED rather than
  // replacing the held file (useFilePicker.js:273-276) — a different message again.
  onlyOneFile: "Only one file can be uploaded.",
  // File Picker SURFACES its duplicate guard (:229). File Input's drops the file silently,
  // which is why that suite has to clear between phases and this one can assert instead.
  duplicate: (name) => `The file "${name}" has already been selected.`,
  // Set by an EFFECT, not by a rejection: whenever isMandatory && no files && isTouched
  // (useFilePicker.js:532). That effect runs AFTER a rejection has set its own reason, so
  // on a mandatory picker it OVERWRITES the specific message with this generic one — the
  // real reason survives only in the toast (FP-14).
  mandatory: "This field is mandatory. Please select a file.",

  // Not a rejection — the mandatory/min-count shortfall, set on the widget itself (:423).
  minCountShortfall: (minCount) =>
    `Please select at least ${minCount} file${minCount > 1 ? "s" : ""}.`,
};

// Accordions as the Inspector renders them, for openAccordion() / openStyleAccordion().
// Property sections come from each entry's `section`; style accordions from `accordian`.
export const filePickerAccordion = {
  additionalActions: "Additional Actions", // source: filepicker.js:148-177 (6 entries)
  styleDropArea: "File Drop Area", // source: filepicker.js:301 (dropzoneTitleColor only)
  styleContainer: "Container", // source: filepicker.js:331-357 (borderRadius, boxShadow, padding)
};

// File Picker's validation defaults, and why they pick the fixtures below:
//
//   minSize defaults to 50 bytes (filepicker.js:406), so sample.mp3 (27B) and sample.mp4
//   (35B) are rejected on SIZE before file type is ever consulted. A type matrix must
//   neutralise minSize first or it proves nothing.
//
//   maxSize defaults to 51200000 (~48.8MB, filepicker.js:407) — there is no practical
//   oversize fixture, so lower maxSize in the test rather than generating a 49MB file.
//
//   maxFileCount defaults to 2 (filepicker.js:409) but is HIDDEN until
//   properties.enableMultiple is on (:287-293, parentObjectKey 'properties'). The cap
//   still applies while hidden, so two files fill the picker even in the default state.
export const filePickerFixtures = {
  validFile: "cypress/fixtures/Image/tooljet.png",
  validFileName: "tooljet.png",
  validFileSize: 1934,

  csvFile: "cypress/fixtures/files/sample-a.csv",
  csvFileName: "sample-a.csv",
  secondCsvFile: "cypress/fixtures/files/sample-b.csv",
  secondCsvFileName: "sample-b.csv",
  jsonFile: "cypress/fixtures/files/sample.json",
  jsonFileName: "sample.json",
  pdfFile: "cypress/fixtures/files/sample.pdf",
  pdfFileName: "sample.pdf",

  // Under the 50-byte default minSize — used to PROVE the min-size rejection, and the
  // reason they are unusable as accept-cases in the type matrix.
  tinyAudioFile: "cypress/fixtures/files/sample.mp3", // 27 bytes
  tinyVideoFile: "cypress/fixtures/files/sample.mp4", // 35 bytes
  zipFile: "cypress/fixtures/files/sample.zip",
};

// Options of the `parseFileType` dropdown — the PARSING one, gated behind parseContent.
// Config-declared (filepicker.js:103-112), unlike the validation dropdown below whose
// options live in the Inspector component. Excel values are full MIME strings.
export const parseFileTypeOptions = [
  { label: "Autodetect from extension", value: "auto-detect" }, // source: filepicker.js:104
  { label: "CSV", value: "csv" }, // source: filepicker.js:105
  { label: "TSV", value: "tsv" }, // source: filepicker.js:106
  { label: "Microsoft Excel - xls", value: "vnd.ms-excel" }, // source: filepicker.js:107
  {
    label: "Microsoft Excel - xlsx",
    value: "vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }, // source: filepicker.js:109-110
];

// Accepted-file-type matrix for the Validation block's `fileType`.
//
// The config declares this field as `type: 'code'` (filepicker.js:227), but the custom
// Inspector panel that serves all three file widgets renders it as a react-select fed by
// FILE_TYPE_OPTIONS (Inspector/Components/FilePicker.jsx:14,174). Both strings below come
// from there: `label` is the dropdown's own text, `value` is the pattern the rejection
// toast echoes back. "Any Files" is excluded — it accepts everything, so it has no
// negative case.
//
// Each row pairs an accepted file with a rejected one; the PAIR is what proves the field
// filters by type rather than simply blocking everything. The audio and video rows use
// the 27- and 35-byte fixtures, so the spec must zero minSize before selecting or those
// two rows would be rejected on size and the type rule would go untested.
export const acceptedTypeCases = [
  {
    label: "Image files",
    value: "image/*", // source: Inspector/Components/FilePicker.jsx:16
    accept: filePickerFixtures.validFile,
    acceptName: filePickerFixtures.validFileName,
    reject: filePickerFixtures.csvFile,
  },
  {
    label: "Document files",
    value: ".pdf,.doc,.docx,.ppt,.pptx", // source: Inspector/Components/FilePicker.jsx:17
    accept: filePickerFixtures.pdfFile,
    acceptName: filePickerFixtures.pdfFileName,
    reject: filePickerFixtures.validFile,
  },
  {
    label: "Spreadsheet files",
    value: ".xls,.xlsx,.csv,.ods", // source: Inspector/Components/FilePicker.jsx:18
    accept: filePickerFixtures.csvFile,
    acceptName: filePickerFixtures.csvFileName,
    reject: filePickerFixtures.validFile,
  },
  {
    label: "Text files",
    value: "text/*,.md,.json,.xml,.yaml", // source: Inspector/Components/FilePicker.jsx:19
    accept: filePickerFixtures.jsonFile,
    acceptName: filePickerFixtures.jsonFileName,
    reject: filePickerFixtures.validFile,
  },
  {
    label: "Audio files",
    value: "audio/*", // source: Inspector/Components/FilePicker.jsx:20
    accept: filePickerFixtures.tinyAudioFile,
    acceptName: "sample.mp3",
    reject: filePickerFixtures.validFile,
  },
  {
    label: "Video files",
    value: "video/*", // source: Inspector/Components/FilePicker.jsx:21
    accept: filePickerFixtures.tinyVideoFile,
    acceptName: "sample.mp4",
    reject: filePickerFixtures.validFile,
  },
  {
    label: "Archive/Compressed files",
    value: ".zip,.rar,.7z,.tar,.gz", // source: Inspector/Components/FilePicker.jsx:22
    accept: filePickerFixtures.zipFile,
    acceptName: "sample.zip",
    reject: filePickerFixtures.validFile,
  },
];

// Fields declaring isFxNotRequired:true. SingleLineCodeEditor's renderFx() returns null
// for these (SingleLineCodeEditor.jsx:699), so the fx button is ABSENT FROM THE DOM
// rather than hidden — assert non-existence, never invisibility.
//
// Only two on this widget, against File Input's six: File Picker has no label
// alignment/width group at all, which is where five of File Input's exemptions live.
export const fxExemptFields = {
  properties: [
    // Shares the visible "Tooltip" label with the fx-CAPABLE `tooltip` code field, which
    // sets showLabel:false (filepicker.js:208) — so this one must be located by its
    // control, not by name, because `tooltip-fx-button` genuinely exists.
    {
      key: "tooltipFormat",
      control: '[data-cy="togglr-button-plainText"]',
      accordion: "Additional Actions",
    }, // source: filepicker.js:194
  ],
  styles: [
    { key: "padding", control: '[data-cy="togglr-button-none"]', accordion: "Container" }, // source: filepicker.js:352
  ],
};

// Entries present in the config but COMMENTED OUT (filepicker.js:303-326, 339-344, with
// four matching definition.styles lines at :396-399). They are not on the surface: the
// live "File Drop Area" accordion should expose dropzoneTitleColor only, and "Container"
// only borderRadius / boxShadow / padding. Listed so a coverage audit records them as
// deliberately absent rather than missing.
export const commentedOutStyles = [
  "dropzoneActiveColor", // source: filepicker.js:303-308
  "dropzoneErrorColor", // source: filepicker.js:309-314
  "containerBackgroundColor", // source: filepicker.js:315-320
  "containerBorder", // source: filepicker.js:321-326
  "containerPadding", // source: filepicker.js:339-344
];
