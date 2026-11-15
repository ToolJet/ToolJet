export const passwordInputText = {
    defaultWidgetName: "passwordinput1",

    // packages/widget-definitions/src/widgets/passwordinput.js:3
    displayName: "Password Input",
    widgetPrefix: "passwordinput",

    // Inspector labels (passwordinput.js property/validation displayNames)
    label: "Label", // passwordinput.js:24
    defaultValue: "Default value", // passwordinput.js:37
    mandatory: "Make this field mandatory", // passwordinput.js:94
    accordionValidation: "Validation",
    widthTypeOfField: "Of the Field", // passwordinput.js:182

    // frontend/src/AppBuilder/_stores/slices/componentsSlice.js validateWidget messages
    errorMandatory: "Field cannot be empty",
    errorMinLength: (n) => `Minimum ${n} characters is needed`,
    errorMaxLength: (n) => `Maximum ${n} characters is allowed`,

    // Tabler icons (frontend/node_modules/@tabler/icons-react v2.47.0 dist/esm/icons/*.js): TablerIcon's
    // className replaces tabler's own `tabler-icon-<name>` class, so icons are identified by a path `d`.
    iconLockPath: 'path[d^="M5 13a2 2 0 0 1 2 -2h10"]', // default left icon IconLock (passwordinput.js:241)
    iconEyePath: 'path[d^="M21 12c-2.4 4 -5.4 6 -9 6"]', // PasswordInput.jsx:16 — value hidden
    iconEyeClosedPath: 'path[d^="M21 9c-2.4 2.667 -5.4 4 -9 4"]', // PasswordInput.jsx:16 — value revealed

    // Pre-revamp saved app (cypress/fixtures/templates/appbuilderApps/passwordInputPreRevamp.json)
    legacyFixture: "templates/appbuilderApps/passwordInputPreRevamp.json",
    legacy: {
        label: "Account password",
        value: "Legacy#Pass42",
        minLength: 10,
        maxLength: 16,
        width: 40, // legacy label width (%) saved before widthType existed
    },
};
