// Selectors for the QR Scanner widget (frontend/src/AppBuilder/Widgets/QrScanner/QrScanner.jsx + ErrorModal.jsx).
// Pass the runtime name (e.g. "qrscanner1"). RenderWidget passes dataCy = componentName (RenderWidget.jsx:367).
// Only the container carries a data-cy; everything inside it (camera lib DOM, ErrorModal) is class/tag scoped.
export const qrScannerSelector = {
  // RenderWidget.jsx — the RenderWidget box
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // QrScanner.jsx:22 — container: data-disabled + display:none when hidden
  root: (name) => `[data-cy="${name}"]`,
  // react-qr-reader render(): <section><section style="padding-top:100%"><div viewfinder/><video/><canvas hidden/>
  video: (name) => `[data-cy="${name}"] video`,
  // ErrorModal.jsx:11-36 — inline "modal" (no portal, no backdrop)
  errorDialog: (name) => `[data-cy="${name}"] .modal-dialog`,
  errorTitle: (name) => `[data-cy="${name}"] .modal-title`, // ErrorModal.jsx:15
  errorBody: (name) => `[data-cy="${name}"] .modal-body`, // ErrorModal.jsx:24-27
  errorCloseX: (name) => `[data-cy="${name}"] .modal-header .btn-close`, // ErrorModal.jsx:16-22
  errorCloseButton: (name) => `[data-cy="${name}"] .modal-footer button`, // ErrorModal.jsx:29-31
};
