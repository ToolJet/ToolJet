import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { filePickerSelector } from "Selectors/appBuilder/components/filePicker";
import { filePickerText } from "Texts/appBuilder/components/filePicker";
import { openEditorSidebar, openAccordion } from "Support/utils/appBuilder/properties";
import {
  openNode,
  openSubNode,
  backFromDetail,
  verifyNodeData,
} from "Support/utils/appBuilder/inspectorTree";

/**
 * MODULE — appBuilder/components/filePicker: File-Picker-specific DOM and quirks.
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
 * DELIBERATELY NOT shared with components/fileButton.js or components/fileInput.js. The
 * three widgets share the custom FilePicker Inspector panel (Inspector.jsx:965-968), so
 * the two file-type dropdown helpers below are near-identical to File Input's — but the
 * RENDERED DOM diverges completely: File Picker is a dropzone with a file LIST, no Browse
 * button, no label-alignment group, and its child data-cy use the instance name raw.
 *
 * The widgetName argument defaults to "filepicker1" throughout, which is safe HERE
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
export const verifyExposedValue = (
  key,
  type,
  value,
  widgetName = filePickerText.defaultWidgetName
) => {
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
 * @tjUsage  attachFile(filePickerFixtures.csvFile)
 * @tjDom    the hidden input[type=file], written directly
 */
// The ordinary selection path. NOTE it writes to the hidden input, which bypasses BOTH
// `noClick` (enablePicker off) and `disablePicker` (disabled, or at maxFileCount) — so it
// will happily "select" into a dropzone the user could not click. For anything asserting
// the picker is BLOCKED use expectPickerBlocked; for enablePicker specifically use
// expectDropzoneOpensPicker, which spies the click react-dropzone would forward.
export const attachFile = (files, widgetName = filePickerText.defaultWidgetName) => {
  cy.get(filePickerSelector.inputField(widgetName))
    .scrollIntoView()
    .selectFile(files, { force: true });
};

/**
 * @tjBlock  properties
 * @tjUsage  attachGeneratedFile({ sizeBytes: 20, name: 'tiny.txt' })
 * @tjDom    the hidden input, written with an in-memory Buffer of an exact byte length
 */
// Synthesises a file of an EXACT size instead of shipping a fixture for every boundary.
// This is the only way to test the size validators honestly: maxSize ships at 51200000
// (~48.8MB, filepicker.js:407), so there is no committable oversize fixture, and the
// alternative — lowering maxSize until an existing fixture trips it — tests the field
// rather than the boundary.
export const attachGeneratedFile = (
  { sizeBytes, name, mimeType = "text/plain" },
  widgetName = filePickerText.defaultWidgetName
) => {
  cy.get(filePickerSelector.inputField(widgetName))
    .scrollIntoView()
    .selectFile(
      {
        contents: Cypress.Buffer.from("x".repeat(sizeBytes)),
        fileName: name,
        mimeType,
      },
      { force: true }
    );
};

/**
 * @tjBlock  properties
 * @tjUsage  expectInlineAndToastError(filePickerErrors.tooSmall('t.txt', 10, 50))
 * @tjDom    the inline error node, then the toast, then dismisses the toast
 */
// Both surfaces carry the SAME string (useFilePicker.js:239-240), so asserting only one
// leaves half the contract untested — and the two have diverged in this family before.
// The message is asserted whole rather than by substring: a `contain.text` on the file
// name would pass for a rejection that happened for the wrong reason.
export const expectInlineAndToastError = (
  message,
  widgetName = filePickerText.defaultWidgetName
) => {
  cy.get(filePickerSelector.errorMessage(widgetName)).should("have.text", message);
  cy.verifyToastMessage(commonSelectors.toastMessage, message, false);
  cy.get("body").then(($b) => {
    if ($b.find(commonSelectors.toastCloseButton).length) {
      cy.get(commonSelectors.toastCloseButton).first().click({ force: true });
    }
  });
};

/**
 * @tjBlock  properties
 * @tjUsage  expectPickerBlocked()
 * @tjDom    dropzone is-disabled class, its tabindex, and the input's aria-disabled
 */
// Three independent signals, because the dropzone carries no `disabled` attribute of its
// own — it is a div. The tabindex is the user-facing one: -1 removes it from the tab
// order entirely (UploadArea.jsx:58).
export const expectPickerBlocked = (widgetName = filePickerText.defaultWidgetName) => {
  cy.get(filePickerSelector.dropzoneDisabled(widgetName)).should("exist");
  cy.get(filePickerSelector.dropzone(widgetName)).should("have.attr", "tabindex", "-1");
  cy.get(filePickerSelector.ariaDisabled(widgetName)).should("exist");
};

/**
 * @tjBlock  properties
 * @tjUsage  expectDropzoneOpensPicker('filepicker1', false)
 * @tjDom    spies input.click(), then clicks the dropzone root
 */
// enablePicker maps to react-dropzone's `noClick` (useFilePicker.js:410), which removes a
// HANDLER rather than changing any attribute — so there is nothing in the DOM to assert.
// What is observable: with the picker on, the root's onClick forwards to the hidden
// input's own .click(); with it off, nothing is forwarded. Spying that call is the only
// honest read, and it must always be run in both polarities so a silently broken spy
// cannot pass as "no click".
export const expectDropzoneOpensPicker = (
  widgetName = filePickerText.defaultWidgetName,
  shouldOpen = true
) => {
  spyPickerClick(widgetName);
  cy.get(filePickerSelector.dropzone(widgetName)).click();
  cy.get("@pickerClick").should(shouldOpen ? "have.been.called" : "not.have.been.called");
};

/**
 * @tjBlock  properties
 * @tjUsage  spyPickerClick(); clickDropzone(); expectPickerClickCount(0)
 * @tjDom    installs ONE spy on the hidden input's click, aliased @pickerClick
 */
// Sinon refuses to wrap the same method twice ("Attempted to wrap click which is already
// wrapped"), so a test that checks BOTH polarities cannot call the one-shot helper above
// twice. Spy once, then assert cumulative call COUNTS around each click.
export const spyPickerClick = (widgetName = filePickerText.defaultWidgetName) => {
  cy.get(filePickerSelector.inputField(widgetName)).then(($input) => {
    if (!$input[0].click.isSinonProxy) cy.spy($input[0], "click").as("pickerClick");
  });
};

export const clickDropzone = (widgetName = filePickerText.defaultWidgetName) =>
  cy.get(filePickerSelector.dropzone(widgetName)).click();

export const expectPickerClickCount = (n) =>
  cy.get("@pickerClick").should("have.callCount", n);

/**
 * @tjBlock  properties
 * @tjUsage  dragFilesOver('filepicker1', [{ name: 'a.png', type: 'image/png' }])
 * @tjDom    dragenter + dragover on the dropzone root with a real DataTransfer
 */
// react-dropzone decides isDragActive/isDragAccept/isDragReject from the dataTransfer, so
// a bare .trigger('dragenter') does nothing — the event needs actual items. This is the
// only way to reach the three drag-state messages and the `noDrag` behaviour that
// enableDropzone controls; cy.selectFile cannot produce a drag.
export const dragFilesOver = (widgetName = filePickerText.defaultWidgetName, files = []) => {
  // DataTransfer and File are taken from the APPLICATION window, not the spec frame.
  // react-dropzone inspects the event's dataTransfer against the app realm's own
  // constructors, so cross-realm objects read as an empty drag and isDragActive never
  // flips — the drag would appear to do nothing for a reason unrelated to the widget.
  cy.window().then((win) => {
    const dataTransfer = new win.DataTransfer();
    files.forEach(({ name, type, contents = "x" }) => {
      dataTransfer.items.add(new win.File([contents], name, { type }));
    });
    cy.get(filePickerSelector.dropzone(widgetName))
      .trigger("dragenter", { dataTransfer, force: true })
      .trigger("dragover", { dataTransfer, force: true });
  });
};

/**
 * @tjBlock  properties
 * @tjUsage  endDrag('filepicker1')
 * @tjDom    dragleave on the dropzone root
 */
// Leaves the drag state so the next assertion starts from a known baseline — an
// abandoned isDragActive keeps the instruction text hidden and makes the following test
// look broken.
export const endDrag = (widgetName = filePickerText.defaultWidgetName) => {
  cy.get(filePickerSelector.dropzone(widgetName)).trigger("dragleave", { force: true });
};

/**
 * @tjBlock  properties
 * @tjUsage  expectFileInList(filePickerFixtures.csvFileName)
 * @tjDom    the file-list item's name node, text and id asserted separately
 */
// The rendered text and the data-cy DISAGREE about the extension: the text strips it
// (FileListItem.jsx:23), the id keeps it because the dot has already become a dash by
// then (FP-2, FileListItem.jsx:20). Asserting both is what pins that down.
// scrollIntoView first: the widget ships 220px tall and the file pane sits BELOW the title,
// validation bar and dropzone, so with two or more files the later rows fall outside the
// widget's own scroll box and `be.visible` fails on a row that is present and correct.
export const expectFileInList = (fileName, widgetName = filePickerText.defaultWidgetName) => {
  cy.get(filePickerSelector.fileName(widgetName, fileName))
    .scrollIntoView()
    .should("be.visible")
    .and("have.text", filePickerText.fileDisplayName(fileName));
};

/**
 * @tjBlock  properties
 * @tjUsage  deleteFileFromList(filePickerFixtures.csvFileName)
 * @tjDom    the per-item trash button
 */
// The only user path to a deselection, and therefore the only trigger for
// onFileDeselected. The button is absent while a file is still uploading
// (FileListItem.jsx:33), so the visibility check is part of the contract.
//
// The HOVER is mandatory, not defensive: `.delete-button` ships
// `opacity: 0; visibility: hidden` and is revealed only by the item's `:hover` rule
// (style.scss:69-74 and :31-34). `visibility: hidden` makes Cypress treat it as not
// visible, so a click without hovering first fails. Deliberately NOT `{ force: true }` —
// forcing through would also pass if the button became permanently unreachable, which is
// the regression this is most likely to catch. See FP-7: the same rule leaves no keyboard
// path to remove a file.
export const deleteFileFromList = (fileName, widgetName = filePickerText.defaultWidgetName) => {
  cy.get(filePickerSelector.fileName(widgetName, fileName))
    .parents(".file-list-item")
    .first()
    .scrollIntoView()
    .realHover();
  cy.get(filePickerSelector.fileDeleteButton(widgetName, fileName)).should("be.visible").click();
  cy.get(filePickerSelector.fileName(widgetName, fileName)).should("not.exist");
};

// The PARSING file-type dropdown, gated behind parseContent. FilePicker's Inspector panel
// hand-rolls it, so it has no `parameter*` data-cy and the shared selectFromSidebarDropdown
// is unusable — that helper calls .type() on what is a div. Its data-cy comes from the
// DISPLAY name ("File type" → file-type), unlike the validation one below.
/**
 * @tjBlock  properties
 * @tjUsage  selectParseFileType('CSV')
 * @tjDom    dropdown-file-type react-select, options matched in the body portal
 */
export const selectParseFileType = (option) => {
  cy.get('[data-cy="dropdown-file-type"]').find(".react-select__control").click();
  // Exact match: .contains("CSV") would also hit "TSV"-adjacent labels, and
  // "Microsoft Excel - xls" is a prefix of "Microsoft Excel - xlsx".
  cy.get(".react-select__option")
    .filter((_i, el) => el.innerText.trim() === option)
    .click();
  cy.waitForAutoSave();
};

// Exported because the fx facet types into the wrapper directly.
// source: Inspector/Components/FilePicker.jsx:39 — cyName is derived from paramName
// (`fileType` → `filetype`) precisely so it cannot collide with the parse dropdown above.
export const validationFileTypeWrapper = '[data-cy="filetype-fx-select"]';

// The Validation block's accepted-file-types field. The CONFIG declares it `type: 'code'`
// (filepicker.js:227), but the custom Inspector panel renders a react-select fed by
// FILE_TYPE_OPTIONS (Inspector/Components/FilePicker.jsx:14,174) — so a config-only
// reading would reach for verifyAndModifyParameter and never find a code field.
/**
 * @tjBlock  properties
 * @tjUsage  selectValidationFileType('Image files')
 * @tjDom    filetype-fx-select react-select, options matched in the body portal
 */
export const selectValidationFileType = (option) => {
  cy.get(validationFileTypeWrapper).find(".react-select__control").click();
  cy.get(".react-select__option")
    .filter((_i, el) => el.innerText.trim() === option)
    .click();
  cy.waitForAutoSave();
};

/**
 * @tjBlock  properties
 * @tjUsage  acceptAnyFileType()
 * @tjDom    Validation accordion → filetype react-select → "Any Files"
 */
// File Picker ships `fileType: 'image/*'` (filepicker.js:234, :405), so OUT OF THE BOX it
// rejects every non-image — a CSV or TXT never reaches the size, count or parsing logic.
// Neither sibling defaults this way, so a test copied across silently proves nothing: the
// file is refused on TYPE and the assertion under test never runs.
//
// Call this in any test that attaches a non-image and is not itself about file types.
// Tests that ARE about file types set their own value instead.
export const acceptAnyFileType = (widgetName = filePickerText.defaultWidgetName) => {
  openEditorSidebar(widgetName);
  openAccordion("Validation");
  selectValidationFileType("Any Files"); // source: Inspector/Components/FilePicker.jsx:15
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
      cy.get(commonSelectors.toastCloseButton).first().click({ force: true });
    }
  });
};

/**
 * @tjBlock  inspector
 * @tjUsage  openParsedValue()
 * @tjDom    inspector → components → widget → `file` node → index 0
 */
// Drills into `files`, NOT the config-declared `file` (FP-12). Both exist at runtime, and
// they carry DIFFERENT parsed keys:
//   file  — legacy, hand-picked fields (useFilePicker.js:567-574), carries `parsedData`,
//           produced by DEPRECATED_processFileContent (:156)
//   files — the current shape (:565, a spread of the processed file), carries `parsedValue`
//           from processFileContent (:152)
// The config declares `file[].parsedValue` (filepicker.js:361) — a combination that exists
// nowhere: the declared array exposes the deprecated key, and the current key sits on an
// array the config never declares.
export const openParsedValue = (widgetName = filePickerText.defaultWidgetName) => {
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

/**
 * @tjBlock  styles
 * @tjUsage  getWidgetHeight('filepicker1').then((h) => ...)
 * @tjDom    the draggable wrapper's rendered height
 */
// Read from the WRAPPER, not the widget root: padding is applied by the shared canvas
// wrapper (RenderWidget.jsx:320), so the root's own height does not move when it changes.
export const getWidgetHeight = (widgetName = filePickerText.defaultWidgetName) =>
  cy.get(filePickerSelector.draggableWidget(widgetName)).invoke("outerHeight");

// The shared tooltip node. One per open tooltip, portalled to the body, so it is NOT
// scoped to the widget.
export const widgetTooltip = '[data-cy="widget-tooltip"]';

/**
 * @tjBlock  properties
 * @tjUsage  hoverInPreview(filePickerSelector.title('filepicker1'))
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
