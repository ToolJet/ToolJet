// Texts for the Steps widget. Config: packages/widget-definitions/src/widgets/steps.js
// Runtime: frontend/src/AppBuilder/Widgets/Steps.jsx + Steps.scss
const defaultSteps = [1, 2, 3, 4, 5].map((i) => ({
  name: `step ${i}`, // steps.js:219-223
  tooltip: "",
  id: i,
  visible: { value: true },
  disabled: { value: false },
}));

export const stepsText = {
  displayName: "Steps", // steps.js:3
  componentType: "Steps", // steps.js:5
  defaultWidgetName: "steps1", // steps.js:2 name → computeComponentName (appCanvasUtils.js:63)
  widgetPrefix: "steps",

  // Saved definition defaults — the payload addStepsViaApi posts (steps.js:211-247)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // steps.js:213
      showOnMobile: { value: "{{false}}" }, // steps.js:214
    },
    properties: {
      steps: { value: defaultSteps }, // steps.js:217-224
      disabledState: { value: "{{false}}" }, // steps.js:229
      variant: { value: "titles" }, // steps.js:230
      currentStep: { value: "{{3}}" }, // steps.js:231
      stepsSelectable: { value: true }, // steps.js:232
      advanced: { value: "{{false}}" }, // steps.js:233
      visibility: { value: "{{true}}" }, // steps.js:234
    },
    styles: {
      visibility: { value: "{{true}}" }, // steps.js:238
      padding: { value: "default" }, // steps.js:241
      incompletedAccent: { value: "var(--cc-surface3-surface)" }, // steps.js:242
      incompletedLabel: { value: "var(--cc-primary-text)" }, // steps.js:243
      completedAccent: { value: "var(--cc-primary-brand)" }, // steps.js:244
      completedLabel: { value: "var(--cc-primary-text)" }, // steps.js:245
      currentStepLabel: { value: "var(--cc-primary-text)" }, // steps.js:246
    },
  },
  defaultStepCount: 5, // steps.js:219-223
  defaultCurrentStep: 3, // steps.js:231

  // Variant values (steps.js:12-14)
  variantLabel: "titles",
  variantNumber: "numbers",
  variantPlain: "plain",

  // Theme tokens behind the default style values (steps.js:242-246)
  tokenIncompletedAccent: "--cc-surface3-surface",
  tokenLabel: "--cc-primary-text",
  tokenCompletedAccent: "--cc-primary-brand",
  tokenFocusOutline: "--interactive-focus-outline", // tailwind.config.js:77 tw-ring-interactive-focus-outline

  // Runtime literals
  dotSize: 12, // Steps.scss:79-83 .dot 0.5rem + 2×2px border (content-box)
  numberSize: 28, // Steps.scss:35-40 .milestone.numbers 24px + 2×2px border (content-box)
  connectorGap: 2, // Steps.scss:18 .progress-line-container gap: 2px
  connectorHeight: 2, // Steps.scss:132 .step-connector height: 2px
  labelGap: 2, // Steps.scss:107 .label margin-top: 2px
  disabledOpacity: 0.5, // Steps.scss:8 .steps-container.disabled / Steps.scss:61 .milestone.disabled
  enabledCursor: "pointer", // Steps.scss:32
  disabledCursor: "not-allowed", // Steps.scss:62
  ellipsis: "ellipsis", // Steps.scss:114 .label text-overflow
  noWrap: "nowrap", // Steps.scss:112 .label white-space
  ariaCurrentStep: "step", // Steps.jsx:208
  tooltipPlacementClass: "bs-tooltip-top", // ToolTip.jsx:10 placement 'top' (react-bootstrap class)
  focusRingOffset: 1, // Steps.jsx:213 focus-visible:tw-ring-offset-1
  focusRingSpread: 3, // Steps.jsx:213 tw-ring-2 drawn outside a 1px offset → 3px total spread
  transitionMs: 300, // Steps.scss:31 transition: all 0.3s
};
