// Test data for the File Input facet specs.
//
// Deliberately NOT shared with the File Button constants. The two widgets look alike in
// config but diverge everywhere that matters to a test: File Button renders through the
// custom FilePicker Inspector panel (Inspector.jsx:965-968) while File Input falls through
// to DefaultComponent (Inspector.jsx:1029), so their control selectors differ; and their
// validation defaults differ enough that a shared fixture set would silently mis-test one
// of them (see minSize below).
//
// Fixture paths are repo-relative — these go through cy.selectFile, not cy.fixture.

export const fileInputText = {
  defaultWidgetName: "fileinput1",
  defaultWidgetText: "File input", // the WidgetManager display name, for dragAndDropWidget
  defaultLabel: "Label", // source: fileinput.js:491
  defaultPlaceholder: "Click to select file", // source: fileinput.js:492
  defaultIconName: "IconFileSearch", // source: fileinput.js:512 — but hidden, see below
  browseButtonText: "Browse", // source: FileInput.jsx:316 — hardcoded, not configurable

  // Rendered instead of a filename once more than one file is held.
  // source: FileInput.jsx:234
  multiFileLabel: (n) => `${n} files selected`,
};

// The properties/styles sections as the Inspector renders them, for openAccordion().
// Styles accordions come from each style entry's `accordian` key.
export const fileInputAccordion = {
  additionalActions: "Additional Actions",
  styleLabel: "label", // source: fileinput.js:234-318 (7 entries)
  styleField: "field", // source: fileinput.js:320-402 (10 entries incl. icon)
  styleContainer: "container", // source: fileinput.js:406 (padding only)
};

// File Input's validation defaults differ from File Button's in two ways that change
// how fixtures must be chosen:
//
//   minSize defaults to 50 bytes (fileinput.js:527) — sample.mp3 (27B) and sample.mp4
//   (35B) are BELOW it, so they are rejected on SIZE before file type is ever consulted.
//   Any type-matrix test must neutralise minSize first or it proves nothing.
//
//   maxSize defaults to 51200000 (51.2MB, fileinput.js:528) rather than File Button's
//   1MB, so there is no practical oversize fixture. Lower maxSize in the test instead of
//   generating a 51MB file.
export const fileInputFixtures = {
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

// Accepted-file-type matrix for the Validation section's `fileType` field.
// One row per option of FILE_TYPE_OPTIONS (FilePicker.jsx:14-23), which is the source of
// truth for BOTH strings here: `label` is the dropdown's own text and `value` is the
// pattern the toast echoes back on a rejection. "Any Files" is excluded — it accepts
// everything, so it has no negative case.
//
// Each row pairs an accepted file with a rejected one; the PAIR is what proves the field
// filters by type rather than simply blocking everything.
//
// The audio/video rows use the 27- and 35-byte fixtures, which sit UNDER the 50-byte
// default minSize — so the spec must zero minSize before selecting, or those two rows
// would be rejected on size and the type rule would go untested.
export const acceptedTypeCases = [
  {
    label: "Image files",
    value: "image/*", // source: FilePicker.jsx:16
    accept: fileInputFixtures.validFile,
    acceptName: fileInputFixtures.validFileName,
    reject: fileInputFixtures.csvFile,
  },
  {
    label: "Document files",
    value: ".pdf,.doc,.docx,.ppt,.pptx", // source: FilePicker.jsx:17
    accept: fileInputFixtures.pdfFile,
    acceptName: fileInputFixtures.pdfFileName,
    reject: fileInputFixtures.validFile,
  },
  {
    label: "Spreadsheet files",
    value: ".xls,.xlsx,.csv,.ods", // source: FilePicker.jsx:18
    accept: fileInputFixtures.csvFile,
    acceptName: fileInputFixtures.csvFileName,
    reject: fileInputFixtures.validFile,
  },
  {
    label: "Text files",
    value: "text/*,.md,.json,.xml,.yaml", // source: FilePicker.jsx:19
    accept: fileInputFixtures.jsonFile,
    acceptName: fileInputFixtures.jsonFileName,
    reject: fileInputFixtures.validFile,
  },
  {
    label: "Audio files",
    value: "audio/*", // source: FilePicker.jsx:20
    accept: fileInputFixtures.tinyAudioFile,
    acceptName: "sample.mp3",
    reject: fileInputFixtures.validFile,
  },
  {
    label: "Video files",
    value: "video/*", // source: FilePicker.jsx:21
    accept: fileInputFixtures.tinyVideoFile,
    acceptName: "sample.mp4",
    reject: fileInputFixtures.validFile,
  },
  {
    label: "Archive/Compressed files",
    value: ".zip,.rar,.7z,.tar,.gz", // source: FilePicker.jsx:22
    accept: fileInputFixtures.zipFile,
    acceptName: "sample.zip",
    reject: fileInputFixtures.validFile,
  },
];

// Fields declaring isFxNotRequired:true. SingleLineCodeEditor's renderFx() returns null
// for these (SingleLineCodeEditor.jsx:699), so the fx button is ABSENT FROM THE DOM
// rather than hidden — assert non-existence, never invisibility.
//
// VERIFIED LIVE, not read off the config: a probe run dumped the Inspector after opening
// each gate and confirmed no fx button exists for auto / labelWidth / widthType even once
// they render. That check matters because conditionallyRender-gated fields have been seen
// to lose their fx affordance independently of this flag.
export const fxExemptFields = {
  properties: [
    // Shares the displayName "Tooltip" with the fx-CAPABLE `tooltip` code field, so this
    // one must be located by its control, not by name — `tooltip-fx-button` does exist.
    { key: "tooltipFormat", control: '[data-cy="togglr-button-plainText"]', accordion: "Additional Actions" }, // source: fileinput.js:132
  ],
  styles: [
    { key: "direction", control: '[data-cy="togglr-button-right"]', accordion: "label" }, // source: fileinput.js:267
    { key: "auto", control: '[data-cy="auto-width-checkbox"]', accordion: "label" }, // source: fileinput.js:278
    { key: "labelWidth", control: '[data-cy="width-input-field"]', accordion: "label" }, // source: fileinput.js:294
    { key: "widthType", control: '[data-cy="dropdown-common"]', accordion: "label" }, // source: fileinput.js:308
    { key: "padding", control: '[data-cy="togglr-button-none"]', accordion: "container" }, // source: fileinput.js:416
  ],
};
