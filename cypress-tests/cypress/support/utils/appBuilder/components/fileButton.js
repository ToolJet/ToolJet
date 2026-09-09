import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/appBuilder/components/fileButton";
import {
  openNode,
  openSubNode,
  backFromDetail,
  verifyNodeData,
} from "Support/utils/appBuilder/inspectorTree";
import { selectReactSelectOption } from "Support/utils/appBuilder/properties";

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
 *   openParsedValue — drills files[0], so it is file-widget-specific, not generic
 *     inspector navigation. It wants a file-widget FAMILY module, which does not exist yet.
 *
 * The widgetName argument defaults to "filebutton1" throughout. That is safe HERE
 * because the module is component-scoped — drop the default on anything promoted, or a
 * caller who omits the argument silently asserts against filebutton1 and passes.
 *//**
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
  selectReactSelectOption('[data-cy="dropdown-file-type"]', option);
};

/**
 * @tjBlock  properties
 * @tjUsage  selectValidationFileType('Image files')
 * @tjDom    filetype-fx-select react-select, options matched in the body portal
 */
// The Validation section's own accepted-file-types field — a different control from
// selectFileType above, which drives parsing. Same portal caveat.
export const selectValidationFileType = (option) => {
  selectReactSelectOption(validationFileTypeWrapper, option);
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
 * @tjUsage  openParsedValue(); ... ; closeInspectorDetail()
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

