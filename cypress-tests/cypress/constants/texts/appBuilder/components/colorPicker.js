// Texts for the Color Picker widget. Config: packages/widget-definitions/src/widgets/colorPicker.js
// Runtime: frontend/src/AppBuilder/Widgets/ColorPicker/ColorPicker.jsx (+ utils.js, colorpicker.scss)
export const colorPickerText = {
  displayName: "Color Picker", // colorPicker.js:3
  componentType: "ColorPicker", // colorPicker.js:5
  defaultWidgetName: "colorpicker1", // colorPicker.js:2 name → computeComponentName (appCanvasUtils.js:63)
  widgetPrefix: "colorpicker",
  renamedWidgetName: "brandcolor", // dynamic: rename target for the canvas facet
  defaultGridWidth: 9, // colorPicker.js:111
  defaultHeight: 40, // colorPicker.js:112

  // Default value '#4368E3' (colorPicker.js:28 / :299). getExposedColorState (utils.js:9-24) exposes it
  // lowercased through tinycolor; showAlpha off (colorPicker.js:301) → 6-digit hex.
  defaultColor: {
    hex: "#4368e3",
    rgb: "rgb(67, 104, 227)",
    rgba: "rgba(67, 104, 227, 1)",
    r: 67,
    g: 104,
    b: 227,
  },
  defaultFormat: "hex", // colorPicker.js:40

  // Saved definition defaults — the payload addColorPickersViaApi posts (colorPicker.js:287-328)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // colorPicker.js:289
      showOnMobile: { value: "{{false}}" }, // colorPicker.js:290
    },
    validation: {
      mandatory: { value: "{{false}}" }, // colorPicker.js:293
      customRule: { value: null }, // colorPicker.js:294
    },
    properties: {
      label: { value: "Label" }, // colorPicker.js:297
      placeholder: { value: "Select a color" }, // colorPicker.js:298
      defaultColor: { value: "#4368E3" }, // colorPicker.js:299
      format: { value: "hex" }, // colorPicker.js:300
      showAlpha: { value: "{{false}}" }, // colorPicker.js:301
      showClearBtn: { value: "{{false}}" }, // colorPicker.js:302
      loadingState: { value: "{{false}}" }, // colorPicker.js:303
      visibility: { value: "{{true}}" }, // colorPicker.js:304
      collapseWhenHidden: { value: "{{false}}" }, // colorPicker.js:306
      disabledState: { value: "{{false}}" }, // colorPicker.js:307
      tooltip: { value: "" }, // colorPicker.js:308
      tooltipFormat: { value: "plainText" }, // colorPicker.js:309
    },
    styles: {
      color: { value: "var(--cc-primary-text)" }, // colorPicker.js:313
      labelFontSize: { value: "{{12}}" }, // colorPicker.js:314
      alignment: { value: "side" }, // colorPicker.js:315
      direction: { value: "left" }, // colorPicker.js:316
      auto: { value: "{{true}}" }, // colorPicker.js:317
      width: { value: "{{33}}" }, // colorPicker.js:318
      backgroundColor: { value: "var(--cc-surface1-surface)" }, // colorPicker.js:319
      borderColor: { value: "var(--cc-default-border)" }, // colorPicker.js:320
      accentColor: { value: "var(--cc-primary-brand)" }, // colorPicker.js:321
      textColor: { value: "var(--cc-primary-text)" }, // colorPicker.js:322
      errTextColor: { value: "var(--cc-error-systemStatus)" }, // colorPicker.js:323
      borderRadius: { value: "{{6}}" }, // colorPicker.js:324
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // colorPicker.js:325
      padding: { value: "default" }, // colorPicker.js:326
    },
  },
};
