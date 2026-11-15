export const textInputText = {
  defaultWidgetName: "textinput1",
  textInputDocumentationLink: "Read documentation for TextInput",

  // packages/widget-definitions/src/widgets/textinput.js:3
  displayName: "Text Input",
  componentType: "TextInput", // textinput.js:2
  widgetPrefix: "textinput",

  // Inspector labels (textinput.js property/validation displayNames)
  label: "Label", // textinput.js:24
  defaultValue: "Default value", // textinput.js:37
  enableClearButton: "Enable clear button", // textinput.js:47
  mandatory: "Make this field mandatory", // textinput.js:100
  accordionAdditionalActions: "Additional Actions",
  accordionValidation: "Validation",
  widthTypeOfField: "Of the Field", // textinput.js:185

  // frontend/src/AppBuilder/_stores/slices/componentsSlice.js validateWidget messages
  errorMandatory: "Field cannot be empty",
  errorMinLength: (n) => `Minimum ${n} characters is needed`,
  errorMaxLength: (n) => `Maximum ${n} characters is allowed`,

  // frontend/src/AppBuilder/AppCanvas/appCanvasConstants.js:83 TOP_ALIGNMENT_HEIGHT_INCREMENT
  topAlignmentHeightIncrement: 20,

  // Pre-revamp saved app (cypress/fixtures/templates/appbuilderApps/textInputPreRevamp.json)
  legacyFixture: "templates/appbuilderApps/textInputPreRevamp.json",
  legacy: {
    label: "Full name",
    value: "Legacy value",
    minLength: 5,
    maxLength: 20,
    width: 40, // legacy label width (%) saved before widthType existed
    topLabel: "Notes",
    topValue: "Top aligned",
    disableButton: "Disable via deprecated",
    hideButton: "Hide via deprecated",
  },
};
