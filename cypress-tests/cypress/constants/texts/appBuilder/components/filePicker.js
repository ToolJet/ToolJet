// Texts for the File Picker widget. Config: packages/widget-definitions/src/widgets/filepicker.js
// Runtime: frontend/src/AppBuilder/Widgets/FilePicker/FilePicker.jsx + Components/* + hooks/useFilePicker.js + style.scss
export const filePickerText = {
  componentType: "FilePicker", // filepicker.js:2
  displayName: "File Picker", // filepicker.js:3
  defaultWidgetName: "filepicker1",
  widgetPrefix: "filepicker",
  defaultSize: { width: 15, height: 220 }, // filepicker.js:6-9
  defaultLabel: "Upload files", // filepicker.js:376
  defaultInstruction: "Drag and drop files here or click to select files", // filepicker.js:377

  // UploadArea.jsx:88-99 — drag-over messages
  acceptDropMessage: "Drop file to start uploading", // UploadArea.jsx:94
  rejectDropMessage: "Cannot upload these files", // UploadArea.jsx:99
  // useFilePicker.js onDropRejected 'file-invalid-type' message
  invalidTypeError: (fileName, accept) =>
    `The file "${fileName}" has an unsupported file type. Please upload files of type: ${accept}.`,

  fileRowHeight: 32, // style.scss .file-list-item height
  layoutGap: 20, // gap the seeded layouts leave between a widget and the one below it (px)

  // Saved definition defaults — merged under every File Picker that addFilePickersViaApi posts
  // (filepicker.js:370-411)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // filepicker.js:372
      showOnMobile: { value: "{{false}}" }, // filepicker.js:373
    },
    properties: {
      label: { value: "Upload files" }, // filepicker.js:376
      instructionText: { value: "Drag and drop files here or click to select files" }, // filepicker.js:377
      enableDropzone: { value: "{{true}}", fxActive: false }, // filepicker.js:378
      enablePicker: { value: "{{true}}", fxActive: false }, // filepicker.js:379
      enableMultiple: { value: "{{false}}", fxActive: false }, // filepicker.js:380
      parseContent: { value: "{{false}}" }, // filepicker.js:381
      parseFileType: { value: "auto-detect" }, // filepicker.js:382
      delimiter: { value: "," }, // filepicker.js:383
      loadingState: { value: "{{false}}" }, // filepicker.js:384
      visibility: { value: "{{true}}" }, // filepicker.js:385
      collapseWhenHidden: { value: "{{false}}" }, // filepicker.js:386
      dynamicHeight: { value: "{{false}}" }, // filepicker.js:387
      disabledState: { value: "{{false}}" }, // filepicker.js:388
      tooltip: { value: "" }, // filepicker.js:389
      tooltipFormat: { value: "plainText" }, // filepicker.js:390
    },
    styles: {
      borderRadius: { value: "{{6}}" }, // filepicker.js:394
      dropzoneTitleColor: { value: "var(--cc-primary-text)" }, // filepicker.js:395
      padding: { value: "default" }, // filepicker.js:400
      boxShadow: { value: "0px 1px 3px #0000001A" }, // filepicker.js:401
    },
    validation: {
      enableValidation: { value: "{{false}}" }, // filepicker.js:404
      fileType: { value: "image/*" }, // filepicker.js:405
      minSize: { value: "{{50}}" }, // filepicker.js:406
      maxSize: { value: "{{51200000}}" }, // filepicker.js:407
      minFileCount: { value: "{{0}}" }, // filepicker.js:408
      maxFileCount: { value: "{{2}}" }, // filepicker.js:409
    },
  },
  defaultAccept: "image/*", // filepicker.js:405
  defaultMaxFileCount: 2, // filepicker.js:409
};
