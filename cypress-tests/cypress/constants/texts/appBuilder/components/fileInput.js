// Texts for the File Input widget. Config: packages/widget-definitions/src/widgets/fileinput.js
export const fileInputText = {
  displayName: "File input", // fileinput.js:3
  defaultWidgetName: "fileinput1",
  widgetPrefix: "fileinput",
  defaultSize: { width: 10, height: 60 }, // fileinput.js:6-9
  defaultLabel: "Label", // fileinput.js:20
  defaultPlaceholder: "Click to select file", // fileinput.js:29
  browseText: "Browse", // FileInput.jsx:323
  multiFileSummary: (n) => `${n} files selected`, // FileInput.jsx:236

  // Saved definition defaults — merged under every FileInput that addFileInputsViaApi posts (fileinput.js:485-531)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // fileinput.js:487
      showOnMobile: { value: "{{false}}" }, // fileinput.js:488
    },
    properties: {
      label: { value: "Label" }, // fileinput.js:491
      instructionText: { value: "Click to select file" }, // fileinput.js:492
      enableMultiple: { value: "{{true}}", fxActive: false }, // fileinput.js:493
      parseContent: { value: "{{false}}" }, // fileinput.js:494
      enableClearSelection: { value: "{{false}}" }, // fileinput.js:495
      parseFileType: { value: "auto-detect" }, // fileinput.js:496
      loadingState: { value: "{{false}}" }, // fileinput.js:497
      visibility: { value: "{{true}}" }, // fileinput.js:498
      disabledState: { value: "{{false}}" }, // fileinput.js:499
      tooltip: { value: "" }, // fileinput.js:500
      tooltipFormat: { value: "plainText" }, // fileinput.js:501
    },
    styles: {
      labelColor: { value: "var(--cc-primary-text)" }, // fileinput.js:505
      labelFontSize: { value: "{{12}}" },
      labelWidth: { value: "33" },
      auto: { value: "{{true}}" },
      direction: { value: "left" },
      alignment: { value: "top" },
      widthType: { value: "ofComponent" },
      icon: { value: "IconFileSearch" },
      iconVisibility: { value: false },
      iconColor: { value: "var(--cc-default-icon)" },
      backgroundColor: { value: "var(--cc-surface1-surface)" },
      borderColor: { value: "var(--cc-default-border)" },
      accentColor: { value: "var(--cc-primary-brand)" },
      textColor: { value: "var(--cc-primary-text)" },
      errTextColor: { value: "var(--cc-error-systemStatus)" },
      borderRadius: { value: "{{6}}" },
      padding: { value: "default" },
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // fileinput.js:522
    },
    validation: {
      enableValidation: { value: "{{false}}" }, // fileinput.js:525
      fileType: { value: "*/*" }, // fileinput.js:526
      minSize: { value: "{{50}}" }, // fileinput.js:527
      maxSize: { value: "{{51200000}}" }, // fileinput.js:528
      minFileCount: { value: "{{0}}" }, // fileinput.js:529
      maxFileCount: { value: "{{2}}" }, // fileinput.js:530
    },
  },
};

// Repo-relative fixture paths (what cy.selectFile expects).
export const fileInputFixtures = {
  pngFile: "cypress/fixtures/Image/tooljet.png",
  pngFileName: "tooljet.png",
  pngFileSize: 1934,
  csvFile: "cypress/fixtures/files/sample-a.csv",
  csvFileName: "sample-a.csv",
};
