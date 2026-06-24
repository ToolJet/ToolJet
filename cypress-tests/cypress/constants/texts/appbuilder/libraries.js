/**
 * Text constants for the App Builder "Import External Library and Preload Script" feature.
 *
 * Scope: App Builder (NOT Workflows).
 * Feature doc: docs/test-cases/import-external-library-and-setup-script-test-cases.md
 *
 * All strings verified against the live instance scouted on 2026-04-18.
 */

export const appBuilderLibrariesText = {
  // Sidebar / drawer labels — verified against frontend/ee/modules/AppLibraries
  leftSidebarTooltip: "Libraries",
  drawerJavascriptHeading: "JavaScript",
  drawerJavascriptAddButtonLabel: "Add new library", // LanguageSection.jsx:39
  // The script button is icon-only with aria-label "Edit preloaded JavaScript script"
  drawerJavascriptScriptButtonAriaLabel: "Edit preloaded JavaScript script",

  // Add Library modal
  addLibraryModalTitle: "Add JavaScript library", // AddLibraryModal.jsx:31 (title)
  variableNamePlaceholder: "e.g. Papa",
  cdnUrlPlaceholderPrefix: "eg. https://cdn.jsdelivr",
  addLibraryConfirmLabel: "Add library", // AddLibraryModal.jsx:38 (confirmBtn title)
  addLibraryCancelLabel: "Cancel",

  // Preload Script modal
  preloadScriptModalTitle: "Preloaded JavaScript", // PreloadedScriptModal.jsx:33
  preloadScriptConfirmLabel: "Save",
  preloadScriptCancelLabel: "Cancel",

  // Toasts — success
  addLibrarySuccessToast: (variableName) => `Library "${variableName}" added`,
  scriptSavedToast: "Script saved",

  // Toasts — error
  httpRejectedToast:
    "Failed to load library: Only HTTPS URLs are allowed for library loading",
  reservedNameToast: '"_" is reserved and cannot be used',
  reservedNameToastFor: (name) => `"${name}" is reserved and cannot be used`,
};

/**
 * Live-verified inputs used as deterministic test data.
 * Keeping these in texts avoids hard-coding magic strings inside spec files.
 */
export const appBuilderLibrariesTestData = {
  lodashCdn:
    "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js",
  lodashVariableName: "lodashLib",
  papaParseCdn:
    "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js",
  papaParseVariableName: "papaLib",
  momentCdn:
    "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/moment.min.js",
  momentVariableName: "momentLib",
  reservedVariableName: "_",
  // Names from frontend/src/AppBuilder/_helpers/libraryConstants.js RESERVED_PARAMS
  reservedNameSamples: ["_", "globals"],
  preloadSampleBody: "function add(a, b) { return a + b; } return { add };",
  runJsLodashBody: "return lodashLib.chunk([1,2,3,4], 2);",
  runJsLodashExpected: [[1, 2], [3, 4]],
  runJsPreloadBody: "return add(2, 3);",
  runJsPreloadExpected: 5,
  httpUrlRejected: "http://example.com/foo.js",
  notFoundCdnUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/__nope__/1.0.0/nope.min.js",

  // Runtime-cleanup helpers (ATC-016). These intentionally use `===` and the
  // ternary `?:` to exercise the catch-all branch of `clearAndTypeOnCodeMirror`
  // (added 2026-04-18). If a future refactor of that helper breaks operator
  // typing, this test will fail and surface the regression.
  preloadAltBody: "function sub(a, b) { return a - b; } return { sub };",
  preloadEmptyBody: "return {};",
  probeLodashLib: "return typeof lodashLib === 'function' ? 'lib-here' : 'lib-gone';",
  probeAddFn: "return typeof add === 'function' ? 'add-here' : 'add-gone';",
  probeSubFn: "return typeof sub === 'function' ? 'sub-here' : 'sub-gone';",
};
