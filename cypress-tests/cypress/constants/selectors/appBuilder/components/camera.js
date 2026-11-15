// Selectors for the Camera widget (frontend/src/AppBuilder/Widgets/Camera/*).
// Config: packages/widget-definitions/src/widgets/camera.js
//
// The widget renders NO data-cy of its own (Camera.jsx:25 never reads `dataCy`; TESTING.md D-04); everything below is
// scoped under RenderWidget's `draggable-widget-<name>` wrapper and falls back to the widget's classes / aria-labels.
const root = (name) => `[data-cy="draggable-widget-${name}"]`;

export const cameraSelector = {
  draggableWidget: root,
  container: (name) => `${root(name)} .camera-container`, // Camera.jsx:510-515 (carries data-permission-error)
  video: (name) => `${root(name)} video.camera-content-video`, // Content.jsx:141-148
  capturedImage: (name) => `${root(name)} img.camera-content-image`, // Content.jsx:139
  placeholder: (name) => `${root(name)} .camera-content-placeholder`, // Content.jsx:152
  // capture / record button (Footer.jsx:100-120); aria-label = Capture photo | Start recording | Stop recording
  captureButton: (name) => `${root(name)} .camera-capture-button-trigger`,
  captureButtonByAria: (name, aria) => `${root(name)} button[aria-label="${aria}"]`,
  saveButton: (name) => `${root(name)} .camera-save-button`, // Footer.jsx:86 (check icon, no aria-label)
  discardButton: (name) => `${root(name)} .camera-discard-button`, // Footer.jsx:89-96 (X icon, no aria-label)
  fullscreenButton: (name) => `${root(name)} .camera-fullscreen-button-trigger`, // Footer.jsx:124-133
  flipButton: (name) => `${root(name)} .camera-flip-button`, // Footer.jsx:53-62 (mobile only)
  // DeviceSelect triggers (DeviceSelect.jsx:41-49) — aria-label per kind
  cameraSelect: (name) => `${root(name)} button[aria-label="Select camera device"]`,
  microphoneSelect: (name) => `${root(name)} button[aria-label="Select microphone device"]`,
  // the device popover is portalled to <body> (DeviceSelect.jsx:50-84); only one is open at a time
  deviceOption: '.camera-device-popover-content [role="option"]',
};
