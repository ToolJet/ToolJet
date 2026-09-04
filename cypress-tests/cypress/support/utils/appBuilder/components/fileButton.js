import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/appBuilder/components/fileButton";
import { verifyAndModifyParameter } from "Support/utils/commonWidget";
import { selectSearchableOption } from "Support/utils/appBuilder/events";
import {
  openNode,
  openSubNode,
  backFromDetail,
  verifyNodeData,
} from "Support/utils/appBuilder/inspectorTree";

/**
 * MODULE — appBuilder/components/fileButton: helpers extracted from the File Button
 * facet specs, so splitting one spec into many does not multiply copies of them.
 * FOR AI: every helper here was duplicated across 2–5 hand-written File Button specs
 * before extraction (waitForDropSettle was in all five). Import from here rather than
 * re-declaring locally.
 * NOT here: generic property/style/event drivers → appBuilder/properties.js · styles.js ·
 * events.js. Inspector tree navigation → appBuilder/inspectorTree.js (inspector.js is a
 * barrel over it).
 *
 * PROMOTION NOTE: only clearSelectedFile is genuinely File-Button-specific. The rest are
 * component-agnostic and are colocated here only because these specs are their sole
 * consumers today — waitForDropSettle/dropWidget belong in appBuilder/canvas.js,
 * enableFxAndBind/commitChange in appBuilder/properties.js, closeQueryPanel in
 * appBuilder/querymanager/queryPanel.js, verifyExposedValue in inspectorTree.js.
 * Move them the moment a second component needs them.
 *
 * The widgetName argument defaults to "filebutton1" throughout so the extraction was a
 * pure lift — no call site in the existing specs had to change.
 */

// Only exists while the Components panel is expanded, so it doubles as a probe
// for whether that panel is open.
const widgetSearchBar = '[data-cy="widget-search-box-search-bar"]';

/**
 * @tjBlock  canvas
 * @tjUsage  waitForDropSettle('filebutton1')
 * @tjDom    draggable-widget-<name> bounding rect, polled until stable
 */
// The canvas keeps settling after a drop: a position assertion right after one can
// miss, and content dropped near the top can end up scrolled out of view for the rest
// of the test. Poll the dropped widget's top edge across ~150ms reads until it stops
// moving. Note the golden checkbox specs have no equivalent — this is File Button's.
export const waitForDropSettle = (widgetName = "filebutton1", attemptsLeft = 6) => {
  cy.get(`[data-cy="draggable-widget-${widgetName}"]`).then(($el) => {
    const top = $el[0].getBoundingClientRect().top;
    cy.wrap(null).then(() => {
      cy.wait(150);
      cy.get(`[data-cy="draggable-widget-${widgetName}"]`).then(($el2) => {
        const top2 = $el2[0].getBoundingClientRect().top;
        if (Math.abs(top2 - top) > 1 && attemptsLeft > 0) {
          waitForDropSettle(widgetName, attemptsLeft - 1);
        }
      });
    });
  });
};

/**
 * @tjBlock  canvas
 * @tjUsage  dropWidget('Text Input', 'textinput1', 500, 300)
 * @tjDom    right-sidebar-components-button toggle + widget-search-box-search-bar
 */
// cy.dragAndDropWidget opens the Components panel by clicking a button that TOGGLES it
// (commands.js), so it only works from a CLOSED panel. A drop straight after another
// drop clicks it shut and then times out on the search box. Collapse first so a drop
// works from either state. The instance name is passed, not derived, because callers
// reference it in binding expressions.
export const dropWidget = (widgetName, instanceName, x = 500, y = 300) => {
  cy.get("body").then(($body) => {
    if ($body.find(`${widgetSearchBar}:visible`).length) {
      cy.get('[data-cy="right-sidebar-components-button"]').click();
    }
  });
  cy.dragAndDropWidget(widgetName, x, y);
  waitForDropSettle(instanceName);
};

/**
 * @tjBlock  canvas
 * @tjUsage  dropCompanionToggle(500, 300)
 * @tjDom    drops a Toggle Switch as toggleswitch1
 */
// Toggle Switch is the standard fx-binding source in these specs (a boolean the test can
// flip to prove a binding is live), so it keeps a named shortcut.
export const dropCompanionToggle = (x, y) =>
  dropWidget("Toggle Switch", "toggleswitch1", x, y);

/**
 * @tjBlock  properties
 * @tjUsage  enableFxAndBind('Loading state', '{{components.toggleswitch1.value}}')
 * @tjDom    parameter fx toggle button, then the CodeMirror field it swaps in
 */
// A toggle property must have fx turned on before it becomes a code field.
export const enableFxAndBind = (paramName, expression) => {
  cy.get(commonWidgetSelector.parameterFxButton(paramName)).click();
  verifyAndModifyParameter(paramName, expression);
};

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

/**
 * @tjBlock  querymanager
 * @tjUsage  closeQueryPanel()
 * @tjDom    .query-pane collapsed class + query-manager-toggle-button
 */
// The panel's open state persists in localStorage across tests, so check before
// clicking — an unguarded toggle RE-OPENS it on the second test.
export const closeQueryPanel = () => {
  cy.get(".query-pane").then(($panel) => {
    if (!$panel.hasClass("collapsed")) {
      cy.get('[data-cy="query-manager-toggle-button"]').click();
    }
  });
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

// ─────────────────────────────────────────────────────────────────────────────
// Extracted in the properties→properties+propertiesFx / styles→styles+stylesFx
// split: each of the following is used by BOTH halves, so a local copy in each
// would be a fork waiting to drift.
// ─────────────────────────────────────────────────────────────────────────────

// FilePicker.jsx hand-rolls the Validation section's file-type field, so it has no
// `parameter*` data-cy. Its name comes from paramName (`fileType`), not its
// "File type" label. Exported because the fx facet types into the wrapper directly.
export const validationFileTypeWrapper = '[data-cy="filetype-fx-select"]';

/**
 * @tjBlock  properties
 * @tjUsage  clearParameter('Min size (bytes)')
 * @tjDom    parameter-<name> CodeMirror content, asserted digit-free
 */
// Leaves a `type:'code'` field truly EMPTY. verifyAndModifyParameter cannot: it types
// " " before the value, and a space is a non-empty string, which the widget reads
// differently from nothing. Passing "" types nothing after the backspaces, since the
// tokenizer matches nothing (commands.js:206).
export const clearParameter = (paramName) => {
  cy.get(commonWidgetSelector.parameterLabel(paramName)).scrollIntoView().should("have.text", paramName);
  cy.get(commonWidgetSelector.parameterInputField(paramName)).clearAndTypeOnCodeMirror("");
  // No digits left, rather than have.text "": an empty CodeMirror can render a
  // .cm-placeholder whose text would count. Any leftover value has a digit.
  cy.get(commonWidgetSelector.parameterInputField(paramName))
    .find(".cm-content")
    .invoke("text")
    .should("not.match", /\d/);
};

/**
 * @tjBlock  canvas
 * @tjUsage  clickWidgetInput('toggleswitch1')
 * @tjDom    <name> widget root → nested <input>, force-clicked
 */
// Flips a companion source widget (Toggle Switch) from the canvas. Driving the SOURCE
// rather than the bound field is what proves a binding stays live instead of having
// resolved once at bind time.
export const clickWidgetInput = (name) => {
  cy.get(`[data-cy="${name}"]`).find("input").click({ force: true });
  cy.waitForAutoSave();
};

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
 * @tjUsage  hoverTriggerInPreview('filebutton1')
 * @tjDom    preview button → <widget>-button, realHover held past Radix's delay
 */
// A tooltip only opens in PREVIEW: on the editor canvas the drag/resize overlays
// swallow the pointer events Radix needs, and a synthetic `mouseover` never opens it
// in either mode. Configure in the editor, then verify here.
export const hoverTriggerInPreview = (widgetName = "filebutton1") => {
  cy.openInCurrentTab(commonWidgetSelector.previewButton);
  cy.get(fileButtonSelector.button(widgetName)).should("be.visible").realHover();
  // Radix mounts the content only after 500ms of sustained hover.
  cy.wait(900);
};

/**
 * @tjBlock  styles
 * @tjUsage  expectBgVar(fileButtonSelector.button('filebutton1'), '#ff0000')
 * @tjDom    inline --button-primary custom property on the trigger
 */
// Reads the CONFIGURED background from `--button-primary` (FileButton.jsx:157), never
// the rendered background-color: the widget derives a hover shade from it (:143), so a
// cursor resting over the trigger passes headless and fails in open mode.
export const expectBgVar = (selector, expected) => {
  cy.get(selector).should(($btn) => {
    expect($btn[0].style.getPropertyValue("--button-primary").trim()).to.equal(expected);
  });
};

/**
 * @tjBlock  events
 * @tjUsage  selectEvent('On click', 'Run Query'); selectQueryForEvent('csarunjs')
 * @tjDom    query-selection-field input → portalled [data-slot="combobox-item"]
 */
// Picks the query for a "Run query" event action.
//
// Delegates to the EXISTING shared selectSearchableOption rather than hand-rolling the
// combobox drive. That helper already encodes two things this control needs and a
// naive implementation gets wrong: the query picker is an @base-ui/react Combobox with
// a real text input (ActionConfigurationPanels/shared.jsx:50), NOT the Radix Select
// that `action-selection` uses — and its ComboboxInput nests more than one <input>, so
// a plain .find("input").click() throws "can only be called on a single element".
//
// The trailing assertion is the control: selectSearchableOption clicks an option but
// asserts nothing about the result, so without this a mis-click would leave the event
// pointing at no query and the test would fail later, somewhere less obvious.
export const selectQueryForEvent = (queryName) => {
  selectSearchableOption('[data-cy="query-selection-field"]', queryName);
  cy.get('[data-cy="query-selection-field"] input')
    .filter(":visible")
    .first()
    .should("have.value", queryName);
  cy.waitForAutoSave();
};

// One field's whole row. SingleLineCodeEditor wraps every parameter in this (:781),
// with the label div (`.field`), the fx button and the control itself as siblings
// INSIDE it — so `.field` is the label alone, never the row. Walking up to `.field`
// from a control finds nothing; walk up to this instead.
const fieldRow = ".wrapper-div-code-editor";

/**
 * @tjBlock  properties
 * @tjUsage  expectNoFxButton(() => cy.get('[data-cy="togglr-button-none"]'), 'Border radius')
 * @tjDom    the located field's row, asserted to contain no .fx-button
 */
// The negative case for isFxNotRequired fields. renderFx() returns null outright when
// isFxNotRequired is defined (SingleLineCodeEditor.jsx:699), so the button is ABSENT
// FROM THE DOM, not merely hidden — the .fx-button-container opacity rule
// (theme.scss:15124) only dims buttons that do render, so no hover is needed.
//
// Located by a CALLBACK returning the field's own control, not by param name, because
// name is unusable for two of the five exempt fields: iconDirection declares
// displayName:'' (fileButton.js:198) so it has no label at all, and tooltipFormat shares
// the displayName "Tooltip" with the fx-CAPABLE `tooltip` code field, so
// `tooltip-fx-button` genuinely exists and a by-name "not.exist" could never pass.
// (This is the ambiguity the golden checkbox spec skipped rather than solved.)
//
// controlParamName is not decoration: a bare "not.exist" also passes when the selector
// is simply wrong or the accordion is shut, which would assert nothing at all. The
// control is an fx-CAPABLE field in the same open accordion and MUST resolve — proving
// the panel really is open and fx buttons really do render here, so that the absence
// beside it is a real absence.
export const expectNoFxButton = (locateField, controlParamName) => {
  cy.get(commonWidgetSelector.parameterFxButton(controlParamName)).should("exist");
  // Assert the row RESOLVED before asserting what is not inside it. If the field were
  // rendered by something other than SingleLineCodeEditor, .closest() would yield an
  // empty set, .find() would too, and "not.exist" would pass having examined nothing —
  // the same vacuous pass controlParamName exists to rule out.
  locateField().closest(fieldRow).should("have.length", 1).find(".fx-button").should("not.exist");
};

// iconDirection and contentAlignment render the SAME togglr-button-left/right data-cy
// values. They are told apart by the third option: contentAlignment has a `center`,
// iconDirection has only left/right. Pass hasCenter to pick which one you mean.
export const locateAlignmentToggle = (hasCenter) => () =>
  cy
    .get('[data-cy="togglr-button-left"]')
    .filter(
      (_i, el) =>
        (Cypress.$(el).closest(".ToggleGroup").find('[data-cy="togglr-button-center"]').length > 0) === hasCenter
    );
