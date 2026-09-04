// Test data for the File Button facet specs.
//
// Split out of the specs when properties.cy.js was divided into properties +
// propertiesFx: both halves need the same fixture paths and the same accepted-type
// matrix, and a second copy would drift the moment one side gained a case.
//
// Fixture paths are repo-relative (what cy.selectFile expects), not cypress/fixtures
// relative — these go through selectFile, not cy.fixture.

export const fileButtonText = {
  defaultWidgetName: "filebutton1",
  defaultWidgetText: "File button", // the WidgetManager display name, for dragAndDropWidget
  defaultLabel: "Upload file", // source: FileButton.jsx — rendered when no file is held
  defaultIconClass: "tabler-icon-file-search", // source: fileButton.js:181-187 (icon default)

  // Rendered instead of a filename once more than one file is held.
  multiFileLabel: (n) => `${n} files selected`,
};

// tooljet.png is 1934 bytes — every size threshold in the specs sits deliberately
// either side of that, so each phase is a real transition rather than a repeat.
export const fileButtonFixtures = {
  validFile: "cypress/fixtures/Image/tooljet.png",
  validFileName: "tooljet.png",
  validFileSize: 1934,

  csvFile: "cypress/fixtures/files/sample-a.csv",
  csvFileName: "sample-a.csv",
  secondCsvFile: "cypress/fixtures/files/sample-b.csv",
  semicolonCsvFile: "cypress/fixtures/files/sample-semicolon.csv",
  jsonFile: "cypress/fixtures/files/sample.json",
  pdfFile: "cypress/fixtures/files/sample.pdf",
  mp3File: "cypress/fixtures/files/sample.mp3",
  mp4File: "cypress/fixtures/files/sample.mp4",
  zipFile: "cypress/fixtures/files/sample.zip",

  // Generated at spec runtime rather than committed: the only way to trip the
  // widget's default 1MB maxSize is a file larger than it, and a >1MB binary does
  // not belong in the repo.
  oversizeFile: "cypress/downloads/filebutton-oversize.txt",
  oversizeFileBytes: 1200000,
};

// One row per option of FILE_TYPE_OPTIONS (FilePicker.jsx). `option` is the dropdown
// label; `value` is the pattern the fx path sets AND the text the rejection toast
// echoes back. "Any Files" is excluded — it has no negative case.
//
// Each row pairs an accepted file with a rejected one: the PAIR is what proves the
// field filters by type rather than simply blocking everything.
export const acceptedTypeCases = [
  {
    option: "Image files",
    value: "image/*",
    accept: fileButtonFixtures.validFile,
    acceptName: fileButtonFixtures.validFileName,
    reject: fileButtonFixtures.csvFile,
  },
  {
    option: "Document files",
    value: ".pdf,.doc,.docx,.ppt,.pptx",
    accept: fileButtonFixtures.pdfFile,
    acceptName: "sample.pdf",
    reject: fileButtonFixtures.validFile,
  },
  {
    option: "Spreadsheet files",
    value: ".xls,.xlsx,.csv,.ods",
    accept: fileButtonFixtures.csvFile,
    acceptName: fileButtonFixtures.csvFileName,
    reject: fileButtonFixtures.validFile,
  },
  {
    option: "Text files",
    value: "text/*,.md,.json,.xml,.yaml",
    accept: fileButtonFixtures.jsonFile,
    acceptName: "sample.json",
    reject: fileButtonFixtures.validFile,
  },
  {
    option: "Audio files",
    value: "audio/*",
    accept: fileButtonFixtures.mp3File,
    acceptName: "sample.mp3",
    reject: fileButtonFixtures.validFile,
  },
  {
    option: "Video files",
    value: "video/*",
    accept: fileButtonFixtures.mp4File,
    acceptName: "sample.mp4",
    reject: fileButtonFixtures.validFile,
  },
  {
    option: "Archive/Compressed files",
    value: ".zip,.rar,.7z,.tar,.gz",
    accept: fileButtonFixtures.zipFile,
    acceptName: "sample.zip",
    reject: fileButtonFixtures.validFile,
  },
];

// Fields declaring isFxNotRequired:true — SingleLineCodeEditor gates FxButton to null
// for these, so the fx facets assert the button is ABSENT rather than binding them.
// Keep in step with the config; a field losing the flag should start failing here.
export const fxExemptFields = {
  // source: fileButton.js:89
  properties: [{ paramName: "Tooltip", key: "tooltipFormat", accordion: "Additional Actions" }],
  styles: [
    { paramName: "", key: "iconDirection", accordion: "label and icon" }, // source: fileButton.js:201 (renders no label)
    { paramName: "Content alignment", key: "contentAlignment", accordion: "label and icon" }, // source: fileButton.js:218
    { paramName: "Button type", key: "buttonType", accordion: "button" }, // source: fileButton.js:229
    { paramName: "Padding", key: "padding", accordion: "button" }, // source: fileButton.js:278
  ],
};
