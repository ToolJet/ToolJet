// Texts for the Email Input widget.
export const emailInputText = {
  // packages/widget-definitions/src/widgets/emailinput.js:3
  displayName: "Email Input",
  defaultWidgetName: "emailinput1",
  widgetPrefix: "emailinput",

  // Inspector labels (emailinput.js property/validation displayNames)
  enableClearButton: "Enable clear button", // emailinput.js:45
  defaultValue: "Default value", // emailinput.js:35
  label: "Label", // emailinput.js:22
  mandatory: "Make this field mandatory", // emailinput.js:100
  accordionAdditionalActions: "Additional Actions",
  accordionValidation: "Validation",
  widthTypeOfField: "Of the Field", // emailinput.js:184

  // frontend/src/AppBuilder/_stores/slices/componentsSlice.js validateWidget messages
  errorMandatory: "Field cannot be empty",
  errorInvalidEmail: "Input should be a valid email",
  errorMinLength: (n) => `Minimum ${n} characters is needed`,

  // Tabler icons: TablerIcon passes className through, which REPLACES tabler's own `tabler-icon-<name>`
  // class, so an icon is identified by its first path's `d` (frontend/node_modules/@tabler/icons-react
  // v2.47.0 dist/esm/icons/IconMail.js / IconMailFilled.js).
  iconMailPath: 'path[d^="M3 7a2 2 0 0 1 2 -2h14"]', // current default IconMail (emailinput.js:364)
  iconMailFilledPath: 'path[d^="M22 7.535v9.465"]', // pre-f130abf2c7 default IconMailFilled

  // Pre-revamp saved app (cypress/fixtures/templates/appbuilderApps/emailInputPreRevamp.json)
  legacyFixture: "templates/appbuilderApps/emailInputPreRevamp.json",
  legacy: {
    label: "Work email",
    value: "legacy.user@example.com",
    minLength: 12,
    width: 40, // legacy label width (%) saved before widthType existed
  },
};
