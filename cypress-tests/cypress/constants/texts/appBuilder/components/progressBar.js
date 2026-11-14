// Texts for the ProgressBar widget. Config: packages/widget-definitions/src/widgets/progressbar.js
export const progressBarText = {
  displayName: "Progressbar", // progressbar.js:3
  componentType: "ProgressBar", // progressbar.js:5
  defaultWidgetName: "progressbar1", // progressbar.js:2 name → computeComponentName (appCanvasUtils.js:63)
  widgetPrefix: "progressbar",

  // Saved definition defaults — the payload addProgressBarsViaApi posts (progressbar.js:241-274)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // progressbar.js:243
      showOnMobile: { value: "{{false}}" }, // progressbar.js:244
    },
    properties: {
      labelType: { value: "auto" }, // progressbar.js:247
      label: { value: "" }, // progressbar.js:248-250
      progress: { value: "{{50}}" }, // progressbar.js:251-253
      tooltip: { value: "" }, // progressbar.js:254
      tooltipFormat: { value: "plainText" }, // progressbar.js:255
      visibility: { value: "{{true}}" }, // progressbar.js:256
      loadingState: { value: "{{false}}" }, // progressbar.js:257
    },
    styles: {
      textColor: { value: "var(--cc-primary-text)" }, // progressbar.js:261
      textSize: { value: "{{30}}" }, // progressbar.js:262
      alignment: { value: "side" }, // progressbar.js:263
      direction: { value: "left" }, // progressbar.js:264
      width: { value: "{{33}}" }, // progressbar.js:265
      auto: { value: "{{true}}" }, // progressbar.js:266
      trackColor: { value: "var(--cc-surface3-surface)" }, // progressbar.js:267
      progressTrackColor: { value: "var(--cc-primary-brand)" }, // progressbar.js:268
      completionColor: { value: "var(--cc-success-systemStatus)" }, // progressbar.js:269
      progressBarThickness: { value: "{{20}}" }, // progressbar.js:270
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // progressbar.js:271
      padding: { value: "default" }, // progressbar.js:272
    },
  },

  // Defaults used by the geometry formulas
  defaultProgress: 50, // progressbar.js:252
  defaultTextSize: 30, // progressbar.js:262
  defaultThickness: 20, // progressbar.js:270
  defaultBoxShadowComputed: "rgba(0, 0, 0, 0.25) 0px 0px 0px 0px", // progressbar.js:271 as computed by the browser

  // Option values
  alignSide: "side", // progressbar.js:102
  alignTop: "top", // progressbar.js:103
  directionLeft: "left", // progressbar.js:114
  directionRight: "right", // progressbar.js:115
  paddingDefault: "default", // progressbar.js:212
  paddingNone: "none", // progressbar.js:213

  // Runtime literals
  boxPadding: 2, // appCanvasConstants.js:57 BOX_PADDING (RenderWidget.jsx:343 inner padding)
  renderWidgetHeightInset: 4, // RenderWidget.jsx:356 height={widgetHeight - 4}
  loadingAnimation: "progressLoading", // Progressbar.jsx:203 / progressbar.scss:1
  loadingDurationMs: 1500, // Progressbar.jsx:203 "1.5s"
  loadingEasing: "ease-in-out", // Progressbar.jsx:203
  loadingStripShare: 0.21, // Progressbar.jsx:199 width '21%'
  loadingKeyframeFrom: "-21%", // progressbar.scss:3
  loadingKeyframeTo: "100%", // progressbar.scss:6
};
