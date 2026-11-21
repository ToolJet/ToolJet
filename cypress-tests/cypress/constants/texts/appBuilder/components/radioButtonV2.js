// Texts for the Radio Button (V2) widget. Config: packages/widget-definitions/src/widgets/radioButtonV2.js
// Runtime: frontend/src/AppBuilder/Widgets/RadioButtonV2/RadioButtonV2.jsx + radioButtonV2.scss
const option = (label, value, isDefault = false, disable = false) => ({
  label,
  value,
  disable: { value: disable },
  visible: { value: true },
  default: { value: isDefault },
});

export const radioButtonV2Text = {
  displayName: "Radio Button", // radioButtonV2.js:3
  componentType: "RadioButtonV2", // radioButtonV2.js:5
  defaultWidgetName: "radiobutton1", // radioButtonV2.js:2 name → computeComponentName (appCanvasUtils.js:63)
  widgetPrefix: "radiobutton",
  defaultGridWidth: 12, // radioButtonV2.js:7
  defaultHeight: 43, // radioButtonV2.js:8
  gridColumns: 43, // WidgetWrapper grid: 43 columns per row
  boxPadding: 2, // RenderWidget.jsx:343 BOX_PADDING (padding 'default')

  option,

  // Saved definition defaults — the payload addRadioButtonsViaApi posts (radioButtonV2.js:310-379)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // radioButtonV2.js:312
      showOnMobile: { value: "{{false}}" }, // radioButtonV2.js:313
    },
    properties: {
      label: { value: "Select" }, // radioButtonV2.js:319
      advanced: { value: "{{false}}" }, // radioButtonV2.js:321
      options: {
        // radioButtonV2.js:322-346
        value: [option("option1", "1"), option("option2", "2", true), option("option3", "3")],
      },
      visibility: { value: "{{true}}" }, // radioButtonV2.js:347
      collapseWhenHidden: { value: "{{false}}" }, // radioButtonV2.js:349
      disabledState: { value: "{{false}}" }, // radioButtonV2.js:350
      loadingState: { value: "{{false}}" }, // radioButtonV2.js:351
      dynamicHeight: { value: "{{false}}" }, // radioButtonV2.js:352
      layout: { value: "row" }, // radioButtonV2.js:353
      optionsLoadingState: { value: "{{false}}" }, // radioButtonV2.js:354
      tooltipFormat: { value: "plainText" }, // radioButtonV2.js:361
      tooltip: { value: "" }, // radioButtonV2.js:362
    },
    styles: {
      labelColor: { value: "var(--cc-primary-text)" }, // radioButtonV2.js:366
      labelFontSize: { value: "{{12}}" }, // radioButtonV2.js:367
      direction: { value: "left" }, // radioButtonV2.js:368
      alignment: { value: "side" }, // radioButtonV2.js:369
      auto: { value: "{{true}}" }, // radioButtonV2.js:370
      labelWidth: { value: "33" }, // radioButtonV2.js:371
      borderColor: { value: "var(--cc-default-border)" }, // radioButtonV2.js:372
      switchOffBackgroundColor: { value: "var(--cc-surface1-surface)" }, // radioButtonV2.js:373
      switchOnBackgroundColor: { value: "var(--cc-primary-brand)" }, // radioButtonV2.js:374
      handleColor: { value: "var(--cc-surface1-surface)" }, // radioButtonV2.js:375
      optionsTextColor: { value: "var(--cc-primary-text)" }, // radioButtonV2.js:376
      padding: { value: "default" }, // radioButtonV2.js:377
      widthType: { value: "ofComponent" }, // radioButtonV2.js:378
    },
  },
  defaultValue: "2", // radioButtonV2.js:336 option2 is the default
  defaultOptionCount: 3, // radioButtonV2.js:322-346

  // Layout values (radioButtonV2.js:61-62)
  layoutRow: "row",
  layoutColumn: "column",
  // RadioButtonV2.jsx:234 options-container overflow: row scrolls sideways, column scrolls down
  rowOverflowX: "auto",
  rowOverflowY: "hidden",

  // Tooltip formats (radioButtonV2.js:107-109)
  formatPlain: "plainText",
  formatMarkdown: "markdown",
  formatHtml: "html",
  tooltipDelayMs: 500, // WidgetTooltip.jsx:49 delayDuration

  // Padding values (radioButtonV2.js:267-268)
  paddingDefault: "default",
  paddingNone: "none",

  // Theme tokens behind the default style values (radioButtonV2.js:366-376) and the disabled-option paint
  // (RadioButtonV2.jsx:336-345)
  tokenLabel: "--cc-primary-text",
  tokenBorder: "--cc-default-border",
  tokenOff: "--cc-surface1-surface",
  tokenOn: "--cc-primary-brand",
  tokenHandle: "--cc-surface1-surface",
  tokenDisabledFill: "--surfaces-surface-03",
  tokenDisabledHandle: "--icons-default",
  tokenFocusOutline: "--interactive-focus-outline", // tailwind.config.js:77 tw-ring-interactive-focus-outline

  // Runtime literals
  checkmarkSize: 16, // radioButtonV2.scss .checkmark 16×16
  handleSize: 8, // radioButtonV2.scss .checkmark:after 8×8
  focusRingSpread: 3, // tw-ring-offset-1 + tw-ring-2 (RadioButtonV2.jsx:333)
};
