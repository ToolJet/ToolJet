export const buttonText = {
  defaultWidgetText: "Button",
  defaultWidgetName: "button1",
  buttonTextLabel: "Button text",
  loadingState: "Loading state",
  buttonDocumentationLink: "Read documentation for Button",
  backgroundColor: "Background",
  textColor: "Text color",
  loaderColor: "Loader color",
  defaultBackgroundColor: "#375FCF",
  defaultTextColor: "#fff",
  defaultLoaderColor: "#fff",
  borderRadiusInput: "20",

  // ── Browser-scenario facets (canvas / contexts / styles / userflow). Config:
  //    packages/widget-definitions/src/widgets/button.js
  displayName: "Button", // button.js:3
  widgetPrefix: "button",

  // Saved definition defaults — the payload addButtonsViaApi posts (button.js:293-327)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // button.js:295
      showOnMobile: { value: "{{false}}" }, // button.js:296
    },
    properties: {
      text: { value: "Button" }, // button.js:299
      visibility: { value: "{{true}}" }, // button.js:300
      collapseWhenHidden: { value: "{{false}}" }, // button.js:301
      disabledState: { value: "{{false}}" }, // button.js:302
      loadingState: { value: "{{false}}" }, // button.js:303
      tooltip: { value: "" }, // button.js:304
      tooltipFormat: { value: "plainText" }, // button.js:305
    },
    styles: {
      textSize: { value: "{{14}}" }, // button.js:309
      fontWeight: { value: "normal" }, // button.js:310
      textColor: { value: "var(--cc-surface1-surface)" }, // button.js:312
      borderColor: { value: "var(--cc-primary-brand)" }, // button.js:313
      loaderColor: { value: "var(--cc-surface1-surface)" }, // button.js:314
      contentAlignment: { value: "center" }, // button.js:315
      borderRadius: { value: "{{6}}" }, // button.js:316
      backgroundColor: { value: "var(--cc-primary-brand)" }, // button.js:317
      hoverBackgroundMode: { value: "auto" }, // button.js:318
      hoverBackgroundColor: { value: "var(--cc-primary-brand)" }, // button.js:319
      iconColor: { value: "var(--cc-surface1-surface)" }, // button.js:320
      direction: { value: "left" }, // button.js:321
      padding: { value: "default" }, // button.js:322
      boxShadow: { value: "0px 0px 0px 0px #00000090" }, // button.js:323
      icon: { value: "IconAlignBoxBottomLeft" }, // button.js:324
      iconVisibility: { value: false }, // button.js:325
      type: { value: "primary" }, // button.js:326
    },
  },
  defaultSize: { width: 4, height: 40 }, // button.js:6-9

  // Option values
  typeSolid: "primary", // button.js:79
  typeOutline: "outline", // button.js:80
  hoverAuto: "auto", // button.js:102
  hoverManual: "manual", // button.js:103
  paddingDefault: "default", // button.js:240
  paddingNone: "none", // button.js:241
  alignLeft: "left", // Button.jsx:99 contentAlignment map
  alignCenter: "center", // button.js:185 default
  alignRight: "right", // Button.jsx:101
  directionLeft: "left", // button.js:213 (icon before the label: row-reverse, Button.jsx:245)
  directionRight: "right", // button.js:214
  fontWeights: { normal: "400", medium: "500", bold: "700" }, // button.js:153-155; Button.jsx:94 medium → 500
  defaultTextSize: 14, // button.js:309
  lineHeightRatio: 1.42, // Button.jsx:92
  iconSizeRatio: 0.8, // Button.jsx:93 (of the line height)

  // Theme tokens the defaults resolve through (#16637 moved text + icon to surface1)
  brandTokenVar: "--cc-primary-brand", // button.js:313,317
  surfaceTokenVar: "--cc-surface1-surface", // button.js:312,314,320

  // Runtime literals
  boxPadding: 2, // appCanvasConstants.js:57 BOX_PADDING (RenderWidget.jsx:343)
  horizontalPadding: 12, // Button.jsx:115 padding '0px 12px'
  borderWidth: 1, // theme.scss:3061 .jet-btn border: 1px solid
  hoverDarkenPercent: 8, // utils.js:31 getModifiedColor 'hover'
  eventOnClick: "onClick", // button.js:70
  transparent: "rgba(0, 0, 0, 0)", // Button.jsx:79 outline → 'transparent'
};
