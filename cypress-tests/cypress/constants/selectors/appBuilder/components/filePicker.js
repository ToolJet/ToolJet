// Selectors for the File Picker widget.
// The widget's own data-cy values come from RenderWidget's `dataCy={componentName}` (raw name, not normalised):
//   root wrapper   FilePicker.jsx:216        data-cy="<name>"
//   title          FilePicker.jsx:232        data-cy="<name>-upload-files-label"
//   hidden input   UploadArea.jsx:69         data-cy="<name>-input-field"
//   instruction    UploadArea.jsx:81         data-cy="<name>-drag-drop-instruction-text"
//   drag messages  UploadArea.jsx:87-103     data-cy="<name>-drag-drop-message" / -drop-file-to-start-uploading-message /
//                                            -cannot-upload-these-files-message / -maximum-files-uploaded-message
// data-cy GAPS (class fallbacks, scoped to the widget root): the dropzone root (UploadArea.jsx:54), the files pane
// (FilePicker.jsx:274), each file row (FileListItem.jsx:16); the error text's data-cy is not widget-scoped
// (ErrorMessage.jsx:11 "file-picker-error-message").
const root = (name) => `[data-cy="${name}"]`;

export const filePickerSelector = {
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  widget: (name) => `${root(name)}.file-picker-widget-wrapper`,
  label: (name) => `[data-cy="${name}-upload-files-label"]`,
  inputField: (name) => `[data-cy="${name}-input-field"]`,
  instruction: (name) => `[data-cy="${name}-drag-drop-instruction-text"]`,
  acceptDropMessage: (name) => `[data-cy="${name}-drop-file-to-start-uploading-message"]`,
  rejectDropMessage: (name) => `[data-cy="${name}-cannot-upload-these-files-message"]`,
  // fallbacks — no data-cy on these nodes
  dropzone: (name) => `${root(name)} .file-picker-dropzone`,
  filesPane: (name) => `${root(name)} .file-picker-files-pane`,
  fileRow: (name) => `${root(name)} .file-list-item`,
  fileRowName: (name) => `${root(name)} .file-list-item .file-name`,
  fileRowDelete: (name) => `${root(name)} .file-list-item .delete-button`,
  errorText: (name) => `${root(name)} [data-cy="file-picker-error-message"]`,
};
