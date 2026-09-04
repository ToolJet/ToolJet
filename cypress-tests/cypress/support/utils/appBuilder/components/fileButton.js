import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/appBuilder/components/fileButton";
import {
  openNode,
  openSubNode,
  backFromDetail,
  verifyNodeData,
} from "Support/utils/appBuilder/inspectorTree";

/**
 * MODULE — appBuilder/components/fileButton: what is genuinely File-Button-specific.
 * FOR AI: helpers here encode FilePicker's own DOM and quirks. Anything component-
 * agnostic has already been promoted OUT (2026-09-04) — look there first:
 *   drop / settle / drive a companion widget  → appBuilder/canvas.js
 *   fx binding, empty a code field, no-fx-button negative, alignment toggles
 *                                             → appBuilder/properties.js
 *   styles tab + accordion, theme swatches, CSS-var and font-weight assertions
 *                                             → appBuilder/styles.js
 *   pick the query for a Run-query event      → appBuilder/events.js
 *   collapse the query panel                  → appBuilder/querymanager/queryPanel.js
 * All of those are re-exported through Support/utils/commonWidget except the last two.
 *
 * STILL HERE and still promotable, blocked on fixing an existing helper rather than
 * adding one (see [[component-facet-model-gaps]]):
 *   verifyExposedValue — the inspector family already has six near-variants; this one's
 *     contribution is symmetric toggle-undo, which belongs IN openAndVerifyNode.
 *   widgetTooltip / hoverInPreview — the shared verifyTooltip + addAndVerifyTooltip are
 *     wrong for Radix widget tooltips (synthetic mouseover, `.tooltip-inner`, editor
 *     surface); fix those rather than add a third.
 *   commitChange — a two-line composition of forceClickOnCanvas + waitForAutoSave; too
 *     thin to be worth shared API surface.
 *
 * The widgetName argument defaults to "filebutton1" throughout. That is safe HERE
 * because the module is component-scoped — drop the default on anything promoted, or a
 * caller who omits the argument silently asserts against filebutton1 and passes.
 *//**
 * @tjBlock  properties
 * @tjUsage  commitChange()
 * @tjDom    canvas click to blur the active field, then the autosave indicator
 */
// Blur whatever field is focused so its value commits, then wait for the save.
export const commitChange = () => {
  cy.forceClickOnCanvas();
  cy.waitForAutoSave();
};

/**
 * @tjBlock  inspector
 * @tjUsage  verifyExposedValue('isLoading', 'Boolean', 'true')
 * @tjDom    inspector sidebar tab → components node → widget subnode → node value
 */
// Asserts the EXPOSED state (components.<widget>.<key>), not just the rendered DOM — a
// separate code path from the visual checks.
// Both the Inspector tab AND the Components expand-button are toggles whose state
// persists in the app's own store even after the panel closes, so each is undone in
// reverse order before returning. Every call then starts from the same known
// tab-closed / components-collapsed state; without this, a second call in the same test
// fails to find the node the first call left expanded.
export const verifyExposedValue = (key, type, value, widgetName = "filebutton1") => {
  cy.get(commonWidgetSelector.sidebarinspector).click();
  cy.hideTooltip();
  openNode("components");
  openSubNode(widgetName);
  verifyNodeData(key, type, value);
  backFromDetail();
  openNode("components");
  cy.get(commonWidgetSelector.sidebarinspector).click();
};

/**
 * @tjBlock  properties
 * @tjUsage  clearSelectedFile()
 * @tjDom    <widget>-clear-button, clicked only when present
 */
// useFilePicker's duplicate guard SILENTLY drops a file it already holds, before
// validation runs — so re-selecting the same file after changing a property is a no-op
// and the next assertion proves nothing. Clear between phases, or use a different file.
export const clearSelectedFile = (widgetName = "filebutton1") => {
  cy.get("body").then(($body) => {
    if ($body.find(fileButtonSelector.clearButton(widgetName)).length) {
      cy.get(fileButtonSelector.clearButton(widgetName)).click();
    }
  });
};

// FilePicker.jsx hand-rolls the Validation section's file-type field, so it has no
// `parameter*` data-cy. Its name comes from paramName (`fileType`), not its
// "File type" label. Exported because the fx facet types into the wrapper directly.
export const validationFileTypeWrapper = '[data-cy="filetype-fx-select"]';

/**
 * @tjBlock  properties
 * @tjUsage  selectFileType('CSV')
 * @tjDom    dropdown-file-type react-select, options matched in the body portal
 */
// The parse File type select portals its menu to document.body, so options cannot be
// found by descending the wrapper. The shared selectFromSidebarDropdown is unusable
// too: it calls .type() on what is a div.
export const selectFileType = (option) => {
  cy.get('[data-cy="dropdown-file-type"]').find(".react-select__control").click();
  // Exact match: .contains("XLS") would also hit "XLSX".
  cy.get(".react-select__option").filter((_i, el) => el.innerText.trim() === option).click();
  cy.waitForAutoSave();
};

/**
 * @tjBlock  properties
 * @tjUsage  selectValidationFileType('Image files')
 * @tjDom    filetype-fx-select react-select, options matched in the body portal
 */
// The Validation section's own accepted-file-types field — a different control from
// selectFileType above, which drives parsing. Same portal caveat.
export const selectValidationFileType = (option) => {
  cy.get(validationFileTypeWrapper).find(".react-select__control").click();
  cy.get(".react-select__option").filter((_i, el) => el.innerText.trim() === option).click();
  cy.waitForAutoSave();
};

/**
 * @tjBlock  properties
 * @tjUsage  expectRejectionToast('image/*')
 * @tjDom    toast message text, then the toast close button when present
 */
// The toast names the accepted patterns — a stronger signal than "nothing was
// selected". Dismissing matters: left alone, toasts stack over the clear button.
export const expectRejectionToast = (types) => {
  cy.get(commonSelectors.toastMessage).should("contain.text", types);
  cy.get("body").then(($b) => {
    if ($b.find(commonSelectors.toastCloseButton).length) {
      cy.closeToastMessage();
    }
  });
};

/**
 * @tjBlock  inspector
 * @tjUsage  openParsedValue(); ... ; closeParsedValue()
 * @tjDom    inspector components → <widget> → files → [0], expanded by LABEL clicks
 */
// Drills components > filebutton1 > files > [0] to reach parsedValue. Nested rows have
// no expand-button data-cy (only -label/-value), so the LABEL is what toggles them.
export const openParsedValue = (widgetName = "filebutton1") => {
  cy.get(commonWidgetSelector.sidebarinspector).click();
  cy.hideTooltip();
  openNode("components");
  openSubNode(widgetName);
  cy.get('[data-cy="inspector-files-label"]').first().click();
  cy.get('[data-cy="inspector-0-label"]').first().click();
};

// Undo both toggles so the next call starts from a known state.
export const closeParsedValue = () => {
  backFromDetail();
  openNode("components");
  cy.get(commonWidgetSelector.sidebarinspector).click();
};

// Radix, not bootstrap: the tooltip renders as [data-cy="widget-tooltip"], never
// `.tooltip-inner`. It also renders its content TWICE (once visibly, once in a
// VisuallyHidden copy), so every match inside it needs .first() — an unscoped
// `have.text` sees the string doubled.
export const widgetTooltip = '[data-cy="widget-tooltip"]';

/**
 * @tjBlock  properties
 * @tjUsage  hoverInPreview(fileButtonSelector.button('filebutton1'))
 * @tjDom    preview, then realHover on the given element past Radix's delay
 */
// A tooltip only opens in PREVIEW: on the editor canvas the drag/resize overlays
// swallow the pointer events Radix needs, and a synthetic `mouseover` never opens it
// in either mode. Configure in the editor, then verify here.
export const hoverInPreview = (selector) => {
  cy.openPreview();
  cy.get(selector).should("be.visible").realHover();
  // Radix mounts the content only after 500ms of sustained hover.
  cy.wait(900);
};
