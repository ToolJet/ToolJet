// Texts for the Circular Progressbar widget. Config: packages/widget-definitions/src/widgets/circularProgressbar.js
export const circularProgressBarText = {
  displayName: "Circular Progressbar", // circularProgressbar.js:3
  componentType: "CircularProgressBar", // circularProgressbar.js:5
  defaultWidgetName: "circularprogressbar1", // circularProgressbar.js:2 name → computeComponentName (appCanvasUtils.js:322)
  widgetPrefix: "circularprogressbar",

  // Registered default size (circularProgressbar.js:6-9)
  defaultGridWidth: 7, // circularProgressbar.js:7
  defaultHeight: 50, // circularProgressbar.js:8
  gridColumns: 43, // NO_OF_GRIDS (appCanvasConstants.js:1)

  // Saved definition defaults — the payload addCircularProgressBarsViaApi posts (circularProgressbar.js:239-274)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // circularProgressbar.js:241
      showOnMobile: { value: "{{false}}" }, // circularProgressbar.js:242
    },
    properties: {
      labelType: { value: "auto" }, // circularProgressbar.js:245
      text: { value: "" }, // circularProgressbar.js:246-248
      progress: { value: "{{50}}" }, // circularProgressbar.js:249-251
      tooltip: { value: "" }, // circularProgressbar.js:252
      tooltipFormat: { value: "plainText" }, // circularProgressbar.js:253
      loadingState: { value: "{{false}}" }, // circularProgressbar.js:254
      visibility: { value: "{{true}}" }, // circularProgressbar.js:255
      allowNegativeProgress: { value: "{{false}}" }, // circularProgressbar.js:256
    },
    styles: {
      textColor: { value: "var(--cc-primary-text)" }, // circularProgressbar.js:260
      textSize: { value: "{{16}}" }, // circularProgressbar.js:261
      trackColor: { value: "var(--cc-surface3-surface)" }, // circularProgressbar.js:262
      color: { value: "var(--cc-primary-brand)" }, // circularProgressbar.js:263
      negativeColor: { value: "var(--cc-error-systemStatus)" }, // circularProgressbar.js:264
      completionColor: { value: "var(--cc-success-systemStatus)" }, // circularProgressbar.js:265
      strokeWidth: { value: "{{10}}" }, // circularProgressbar.js:266
      circleRatio: { value: "{{1}}" }, // circularProgressbar.js:267
      counterClockwise: { value: "{{false}}" }, // circularProgressbar.js:268
      alignment: { value: "center" }, // circularProgressbar.js:269
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // circularProgressbar.js:270
      padding: { value: "default" }, // circularProgressbar.js:271
    },
  },

  // Option values
  alignLeft: "flex-start", // circularProgressbar.js:180
  alignCenter: "center", // circularProgressbar.js:181
  alignRight: "flex-end", // circularProgressbar.js:182
  paddingDefault: "default", // circularProgressbar.js:210
  paddingNone: "none", // circularProgressbar.js:211
  defaultShadowComputed: "rgba(0, 0, 0, 0.25) 0px 0px 0px 0px", // circularProgressbar.js:270 '0px 0px 0px 0px #00000040'
  defaultLabel: "50%", // circularProgressbar.js:250 progress 50 + Auto label (CirularProgressbar.jsx:43)
  defaultStrokeWidth: 10, // circularProgressbar.js:266

  // Runtime literals
  loadingClass: "rotate-forever", // CirularProgressbar.jsx:133
  loadingAnimation: "spin", // circularProgressbar.scss:1-13 (1.2s linear infinite)
  loadingLabel: " ", // CirularProgressbar.jsx:60 hard-coded blank loading text
  boxPadding: 2, // RenderWidget.jsx:343 BOX_PADDING (appCanvasConstants.js:57)
  svgHeightInset: 4, // RenderWidget.jsx:356 height={widgetHeight - 4} → SVG root height (CirularProgressbar.jsx:140)
  viewBox: 100, // react-circular-progressbar VIEWBOX_WIDTH/HEIGHT (dist/index.js:57-58)
};
