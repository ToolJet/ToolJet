/**
 * Selectors for the App Builder "Import External Library and Preload Script" feature.
 *
 * Scope: App Builder (NOT Workflows).
 * Feature doc:  docs/test-cases/import-external-library-and-setup-script-test-cases.md
 * Gaps tracker: docs/test-cases/data-cy-gaps-tracking.md
 *
 * All `data-cy` values in `appBuilderLibrariesSelector` were verified live by the
 * scout agent on 2026-04-18. Selectors that proxy a missing `data-cy` attribute
 * live in `appBuilderLibrariesGapFallbacks` (CSS-based) and each carry an
 * AI-parseable marker block (`// @data-cy-gap:GAP-NNN`) so a future agent can
 * find and replace them when the upstream frontend PR lands.
 */

export const appBuilderLibrariesSelector = {
  // Left sidebar entry point
  leftSidebarLibrariesButton: '[data-cy="left-sidebar-libraries-button"]',

  // Libraries drawer
  appLibrariesCloseButton: '[data-cy="app-libraries-close-button"]',
  appLibrariesJavascriptAddButton: '[data-cy="app-libraries-javascript-add-button"]',
  appLibrariesJavascriptScriptButton: '[data-cy="app-libraries-javascript-script-button"]',

  // Installed library rows — dynamic
  appLibrariesItem: (variableName) =>
    `[data-cy="app-libraries-item-${variableName}"]`,
  appLibrariesItemRemove: (variableName) =>
    `[data-cy="app-libraries-item-${variableName}-remove"]`,

  // Shared modal chrome (reused by Add Library modal and Preload JS modal)
  modalTitle: '[data-cy="modal-title"]',
  modalCloseButton: '[data-cy="modal-close-button"]',
  modalBody: '[data-cy="modal-body"]',
  modalCancelButton: '[data-cy="cancel-button"]',
  modalConfirmButton: '[data-cy="confirm-button"]',

  // Preload-script editor (inside Preload JS modal)
  preloadedScriptEditorInputField: '[data-cy="preloaded-script-editor-input-field"]',
};

/**
 * CSS fallbacks for missing `data-cy` attributes.
 *
 * Each entry has an AI-parseable marker block. When the matching frontend PR
 * lands, find the marker by gap ID, replace the value with the new
 * `[data-cy="..."]` selector, and (optionally) remove the marker block per the
 * `cleanup_after_merge` flag in `docs/test-cases/data-cy-gaps-tracking.md`.
 *
 * DO NOT inline these CSS strings inside specs — always reference this file so
 * the swap is single-point.
 */
export const appBuilderLibrariesGapFallbacks = {
  // @data-cy-gap:GAP-001
  // @proposed: app-libraries-variable-name-input
  // @target: frontend/src/AppBuilder/Libraries/AddLibraryModal.jsx
  variableNameInput: '[placeholder="e.g. Papa"]',

  // @data-cy-gap:GAP-002
  // @proposed: app-libraries-cdn-url-input
  // @target: frontend/src/AppBuilder/Libraries/AddLibraryModal.jsx
  cdnUrlInput: '[placeholder^="eg. https://cdn.jsdelivr"]',

  // @data-cy-gap:GAP-005
  // @proposed: preloaded-script-editor-search-button
  // @target: frontend/src/_components/CodeHinter/CodeHinter.jsx
  editorSearchButton:
    '[data-cy="preloaded-script-editor-input-field"] .codehinter-search-btn',

  // @data-cy-gap:GAP-006
  // @proposed: toast-close-button (global, prefer commonSelectors after merge)
  // @target: react-toastify wrapper component
  toastCloseButton: ".Toastify__close-button",

  // GAP-007 RESOLVED 2026-04-18 — source uses `cyLabel="runjs"` in
  // frontend/src/AppBuilder/QueryManager/QueryEditors/Runjs/Runjs.jsx, which
  // SingleLineCodeEditor.jsx renders as `data-cy="runjs-input-field"`.
  // No source change required; ATC-009/010 unblocked.
  runJsQueryBody: '[data-cy="runjs-input-field"]',

  // @data-cy-gap:GAP-010
  // @proposed: data-cy-state="loading" attribute on existing confirm-button
  // @target: frontend/src/_ui/Modal/ModalFooter.jsx
  confirmButtonLoading: '[data-cy="confirm-button"]:disabled',

  // Static CSS classes captured by scout — useful for scoping. Not gaps per se,
  // but documented here so specs use the same constants.
  appLibrariesList: ".app-libraries-list",
  appLibrariesItemAny: ".app-libraries-item",
  appLibrariesItemUrl: ".app-libraries-item-url",
  appLibrariesItemName: ".app-libraries-item-name",
  appLibrariesItemRemoveAny: ".app-libraries-item-remove",
};

/**
 * Backwards-compat alias — older code references `appBuilderLibrariesPlaceholders`.
 * Prefer `appBuilderLibrariesGapFallbacks` in new code; this alias forwards to it
 * so a one-shot rename PR is unnecessary today.
 */
export const appBuilderLibrariesPlaceholders = {
  variableNameInput: appBuilderLibrariesGapFallbacks.variableNameInput,
  cdnUrlInput: appBuilderLibrariesGapFallbacks.cdnUrlInput,
};
