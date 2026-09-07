import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fileInputSelector } from "Selectors/appBuilder/components/fileInput";
import { fileInputText } from "Texts/appBuilder/components/fileInput";
import {
  openNode,
  openSubNode,
  backFromDetail,
  verifyNodeData,
} from "Support/utils/appBuilder/inspectorTree";

/**
 * MODULE — appBuilder/components/fileInput: File-Input-specific DOM and quirks.
 * FOR AI: anything component-agnostic already lives in the shared layer — look there
 * first before adding here:
 *   drop / settle / drive a companion widget  → appBuilder/canvas.js
 *   fx binding, empty a code field, no-fx-button negative, alignment toggles
 *                                             → appBuilder/properties.js
 *   styles tab + accordion, theme swatches, CSS-var and font-weight assertions
 *                                             → appBuilder/styles.js
 *   pick the query for a Run-query event      → appBuilder/events.js
 *   collapse the query panel                  → appBuilder/querymanager/queryPanel.js
 * All re-exported through Support/utils/commonWidget except the last two.
 *
 * DELIBERATELY NOT shared with components/fileButton.js. The two widgets do share the
 * custom FilePicker Inspector panel (Inspector.jsx:965-968), so a few control selectors
 * coincide — but their RENDERED DOM has nothing in common: File Button builds its
 * children from generateCypressDataCy, File Input emits a single data-cy and leans on
 * Tailwind classes. Keeping the modules separate was a deliberate call; the cost is that
 * a shared-panel selector change has to be applied in each file.
 *
 * The widgetName argument defaults to "fileinput1" throughout, which is safe HERE
 * because the module is component-scoped. Drop the default on anything ever promoted.
 */

/**
 * @tjBlock  properties
 * @tjUsage  commitChange()
 * @tjDom    canvas click to blur the active field, then the autosave indicator
 */
// Blur whatever field is focused so its value commits, then wait for the save.
export const commitChange = () => {
  cy.forceClickOnCanvas();
  cy.waitForAutoSave();
};

// Asserts the EXPOSED state (components.<widget>.<key>), a separate code path from the
// rendered DOM. Both the Inspector tab and the Components expand-button are toggles whose
// state persists in the app's store even after the panel closes, so each is undone in
// reverse order before returning — otherwise a second call in the same test fails to find
// the node the first call left expanded.
/**
 * @tjBlock  inspector
 * @tjUsage  verifyExposedValue('isLoading', 'Boolean', 'true')
 * @tjDom    inspector sidebar tab → components node → widget subnode → node value
 */
export const verifyExposedValue = (key, type, value, widgetName = fileInputText.defaultWidgetName) => {
  cy.get(commonWidgetSelector.sidebarinspector).click();
  cy.hideTooltip();
  openNode("components");
  openSubNode(widgetName);
  verifyNodeData(key, type, value);
  backFromDetail();
  openNode("components");
  cy.get(commonWidgetSelector.sidebarinspector).click();
};

// useFilePicker's duplicate guard SILENTLY drops a file it already holds, BEFORE
// validation runs — so re-selecting the same file after changing a property is a no-op and
// the next assertion proves nothing. Clear between phases, or use a different fixture.
// The clear button only exists while a file is held AND enableClearSelection is on, hence
// the presence check rather than a bare click.
/**
 * @tjBlock  properties
 * @tjUsage  clearSelectedFile()
 * @tjDom    the right cell's only button, clicked only when present
 */
export const clearSelectedFile = (widgetName = fileInputText.defaultWidgetName) => {
  cy.get("body").then(($body) => {
    if ($body.find(fileInputSelector.clearButton(widgetName)).length) {
      cy.get(fileInputSelector.clearButton(widgetName)).click();
    }
  });
};

/**
 * @tjBlock  properties
 * @tjUsage  attachFile(fileInputFixtures.csvFile)
 * @tjDom    the hidden input[type=file], written directly
 */
// The ordinary selection path. NOTE it writes to the hidden input, which bypasses
// `disablePicker` — so it will happily "select" into a widget the user could not click.
// For anything asserting the picker is BLOCKED (disabled, or at maxFileCount), drive
// expectPickerBlocked instead or the test manufactures a false pass.
export const attachFile = (files, widgetName = fileInputText.defaultWidgetName) => {
  cy.get(fileInputSelector.inputField(widgetName)).scrollIntoView().selectFile(files, { force: true });
};

/**
 * @tjBlock  properties
 * @tjUsage  expectPickerBlocked()
 * @tjDom    the Browse button's disabled attr and the wrapper's disabled class
 */
// The real user path: Browse is what a person clicks, and it is the element that actually
// carries `disabled`. Asserting here rather than on the hidden input is what makes a
// disabled/limit test meaningful.
export const expectPickerBlocked = (widgetName = fileInputText.defaultWidgetName) => {
  cy.get(fileInputSelector.browseButton(widgetName)).should("be.disabled");
  cy.get(fileInputSelector.fieldDisabled(widgetName)).should("exist");
};

// The parse "File type" select portals its menu to document.body, so options cannot be
// found by descending the wrapper, and the shared selectFromSidebarDropdown is unusable
// because it calls .type() on what is a div. Gated behind parseContent — turn parsing on
// before calling. Distinct from selectValidationFileType below: THIS one drives parsing.
/**
 * @tjBlock  properties
 * @tjUsage  selectParseFileType('CSV')
 * @tjDom    dropdown-file-type react-select, options matched in the body portal
 */
export const selectParseFileType = (option) => {
  cy.get('[data-cy="dropdown-file-type"]').find(".react-select__control").click();
  // Exact match: .contains("XLS") would also hit "XLSX".
  cy.get(".react-select__option").filter((_i, el) => el.innerText.trim() === option).click();
  cy.waitForAutoSave();
};

// FilePicker.jsx hand-rolls this field, so it has no `parameter*` data-cy. Exported
// because the fx facet types into the wrapper directly. source: FilePicker.jsx:49
export const validationFileTypeWrapper = '[data-cy="filetype-fx-select"]';

// The Validation section's accepted-file-types field — a DIFFERENT control from
// selectParseFileType, and confusingly close in name: this one's data-cy comes from the
// config key (`fileType` → `filetype-*`) while the parse one comes from its display name
// ("File type" → `file-type-*`). Same body-portal caveat.
/**
 * @tjBlock  properties
 * @tjUsage  selectValidationFileType('Image files')
 * @tjDom    filetype-fx-select react-select, options matched in the body portal
 */
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
// The toast names the accepted patterns — a stronger signal than "nothing was selected".
// Dismissing matters: left alone, toasts stack over the widget.
export const expectRejectionToast = (types) => {
  cy.get(commonSelectors.toastMessage).should("contain.text", types);
  cy.get("body").then(($b) => {
    if ($b.find(commonSelectors.toastCloseButton).length) {
      cy.closeToastMessage();
    }
  });
};

// labelWidth and widthType sit behind a TWO-level gate (fileinput.js:284-293, 309-318):
// they render only when alignment is `side` AND auto is off. alignment ships as `top`
// (fileinput.js:510), so BOTH switches are required — flipping only one leaves the
// controls absent and any assertion against them fails for the wrong reason.
/**
 * @tjBlock  styles
 * @tjUsage  unlockLabelWidth()   // after openStyleAccordion(widget, 'label')
 * @tjDom    togglr-button-side, then the auto-width checkbox
 */
export const unlockLabelWidth = () => {
  cy.get('[data-cy="togglr-button-side"]').click();
  cy.waitForAutoSave();
  cy.get('[data-cy="auto-width-checkbox"]').uncheck({ force: true });
  cy.waitForAutoSave();
};

/**
 * @tjBlock  styles
 * @tjUsage  getWidgetHeight().then((h) => ...)
 * @tjDom    the field box's measured bounding height
 */
// Returns the rendered height so a before/after comparison can prove a dimensional
// change. Measured on the FIELD box, not the draggable wrapper — the wrapper's height is
// the canvas row and stays fixed regardless of the widget's own styling, so measuring it
// would report "no change" for every style and quietly pass a broken assertion.
export const getWidgetHeight = (widgetName = fileInputText.defaultWidgetName) =>
  cy.get(fileInputSelector.field(widgetName)).then(($el) => $el[0].getBoundingClientRect().height);

// iconVisibility has NO schema entry in config.styles — only a stored default in
// definition.styles (fileinput.js:513) — yet it is a real, user-reachable eye toggle on
// the icon control. It ships OFF, so the widget renders no icon until this is clicked.
/**
 * @tjBlock  styles
 * @tjUsage  toggleIconVisibility()
 * @tjDom    the icon control's visibility (eye) button
 */
export const toggleIconVisibility = () => {
  cy.get('[data-cy="icon-visibility-button"]').click();
  cy.waitForAutoSave();
};

/**
 * @tjBlock  inspector
 * @tjUsage  openParsedValue(); ... ; closeParsedValue()
 * @tjDom    inspector components → <widget> → files → [0], expanded by LABEL clicks
 */
// Drills components > fileinput1 > files > [0] to reach parsedValue. Nested rows have no
// expand-button data-cy (only -label/-value), so the LABEL is what toggles them.
export const openParsedValue = (widgetName = fileInputText.defaultWidgetName) => {
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
 * @tjUsage  hoverInPreview(fileInputSelector.field('fileinput1'))
 * @tjDom    preview, then realHover on the given element past Radix's delay
 */
// A tooltip only opens in PREVIEW: on the editor canvas the drag/resize overlays swallow
// the pointer events Radix needs, and a synthetic `mouseover` never opens it in either
// mode. Configure in the editor, then verify here.
export const hoverInPreview = (selector) => {
  cy.openPreview();
  cy.get(selector).should("be.visible").realHover();
  // Radix mounts the content only after 500ms of sustained hover.
  cy.wait(900);
};
