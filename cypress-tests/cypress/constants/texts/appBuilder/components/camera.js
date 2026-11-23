// Texts for the Camera widget. Config: packages/widget-definitions/src/widgets/camera.js
// Runtime: frontend/src/AppBuilder/Widgets/Camera/*
export const cameraText = {
  displayName: "Camera", // camera.js:3
  defaultWidgetName: "camera1", // camera.js:2 (name 'Camera' → camera1)
  widgetPrefix: "camera",
  defaultSize: { width: 15, height: 500 }, // camera.js:6-9

  // Footer aria-labels (Footer.jsx:41,43,58)
  aria: {
    capturePhoto: "Capture photo",
    startRecording: "Start recording",
    stopRecording: "Stop recording",
    enterFullscreen: "Enter fullscreen",
    exitFullscreen: "Exit fullscreen",
    flip: "Switch between front and back camera",
  },
  placeholder: "Camera preview will appear here once available.", // Content.jsx:92
  capturedAlt: "Captured frame", // Content.jsx:139

  // Saved definition defaults — merged under every Camera that addCamerasViaApi posts (camera.js:139-160)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // camera.js:141
      showOnMobile: { value: "{{false}}" }, // camera.js:142
    },
    properties: {
      content: { value: "image" }, // camera.js:145
      visibility: { value: "{{true}}" },
      disabledState: { value: "{{false}}" },
      tooltip: { value: "" },
      tooltipFormat: { value: "plainText" }, // camera.js:149
    },
    styles: {
      textColor: { value: "var(--cc-primary-text)" }, // camera.js:153
      accentColor: { value: "var(--cc-primary-brand)" },
      backgroundColor: { value: "var(--cc-surface1-surface)" },
      borderColor: { value: "var(--cc-default-border)" },
      borderRadius: { value: "{{6}}" }, // camera.js:157
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // camera.js:158
    },
  },
};
