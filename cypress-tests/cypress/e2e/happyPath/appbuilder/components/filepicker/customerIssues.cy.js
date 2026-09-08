import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { filePickerSelector } from "Selectors/appBuilder/components/filePicker";
import {
  filePickerText,
  filePickerFixtures,
  filePickerErrors,
} from "Texts/appBuilder/components/filePicker";
import { commonWidgetSelector } from "Selectors/common";
import {
  dropWidget,
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
} from "Support/utils/commonWidget";
import {
  attachFile,
  expectFileInList,
  deleteFileFromList,
  selectValidationFileType,
  acceptAnyFileType,
  commitChange,
} from "Support/utils/appBuilder/components/filePicker";

// Customer-issues facet — regression guards for defects found while automating this
// widget.
//
// ⚠ EVERY TEST ASSERTS THE **CORRECT** BEHAVIOUR, NOT TODAY'S, so all of them fail
// against the current build and are skipped until their fixes land. Asserting the buggy
// behaviour instead would pass now and break when the bug is fixed — defending the
// defect. Un-skip each one as its fix ships; it should go green immediately.
//
// This facet is the ONLY place a skip is allowed. Bugs found by a normal facet are left
// RED in that facet rather than skipped here.
//
// TODO(issue links): tracker IDs not recorded yet — add the issue URL above each test.

describe(
  "File Picker customer issues",
  { testIsolation: false, retries: { runMode: Number(Cypress.env("TJ_RETRIES") ?? 3), openMode: 0 } },
  () => {
    const widget = filePickerText.defaultWidgetName;
    const { validFile, validFileName, csvFile, secondCsvFile, secondCsvFileName } =
      filePickerFixtures;

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filepicker-App`);
      cy.openApp();
      dropWidget(filePickerText.defaultWidgetText, widget, 500, 100);
      cy.waitForElement(filePickerSelector.widget(widget));
      closeQueryPanel();
    });

    afterEach(function () {
      if (this.currentTest.state === "passed") cy.apiDeleteApp();
    });

    // FP-1 — FIXED. ErrorMessage emitted a LITERAL data-cy="file-picker-error-message" and
    // was never passed dataCy at all, where both siblings emit `${cyBase}-invalid-feedback`
    // (FileButton.jsx:270, FileInput.jsx:370) — so two pickers on one page carried the same
    // id and nothing could address one instance's error. ErrorMessage now takes dataCy and
    // UploadArea passes it down. Un-skipped: this is the guard that keeps it that way.
    it("should scope the error message data-cy to the widget instance", () => {
      dropWidget(filePickerText.defaultWidgetText, "filepicker2", 500, 400);
      cy.waitForElement(filePickerSelector.widget("filepicker2"));

      // Under the shipped 50-byte floor, so both widgets can be put in an error state.
      cy.get(filePickerSelector.inputField(widget)).selectFile(
        { contents: Cypress.Buffer.from("x"), fileName: "tiny.txt", mimeType: "text/plain" },
        { force: true }
      );

      // The correct behaviour: one error node per instance, addressable by instance.
      cy.get(`[data-cy="${widget}-invalid-feedback"]`).should("be.visible");
      cy.get('[data-cy="filepicker2-invalid-feedback"]').should("not.exist");
    });

    // FP-2 — FIXED. The id ran `generateCypressDataCy(fileName).replace(/\.[^/.]+$/, '')`,
    // but the helper had already turned "." into "-" so the regex never matched: the id
    // kept the extension the visible label dropped (`tooljet-png-file-name` labelled
    // "tooljet"). The strip now happens BEFORE the helper, and the id is prefixed with the
    // widget name so two pickers holding the same file stay distinguishable.
    it("should give the file-list id the same name as its label, scoped to the widget", () => {
      attachFile(validFile);
      expectFileInList(validFileName);

      // id and label agree, and the id names its widget.
      cy.get(`[data-cy="${widget}-tooljet-file-name"]`).should("have.text", "tooljet");
      // The pre-fix id is gone rather than merely duplicated.
      cy.get('[data-cy="tooljet-png-file-name"]').should("not.exist");
    });

    // FP-7 — a keyboard user cannot remove a selected file.
    // `.delete-button` ships `opacity: 0; visibility: hidden` and is revealed only by the
    // list item's `:hover` rule (style.scss:69-74 and :31-34). `visibility: hidden` also
    // removes it from the tab order, so the only path to deselecting a file is a mouse
    // hover. Compounded by FP-3: the dropzone hardcodes `noKeyboard: true`
    // (useFilePicker.js:412) while still taking a tabIndex of 0, so neither selecting nor
    // removing a file has a keyboard route. WCAG 2.1.1.
    // TODO(issue links)
    it.skip("should let a keyboard user reach and activate the file delete button", () => {
      attachFile(validFile);
      expectFileInList(validFileName);

      // The correct behaviour: the control is focusable without a pointer.
      cy.get(filePickerSelector.fileDeleteButton(widget, validFileName)).focus().should("have.focus");
      cy.focused().type("{enter}");
      cy.get(filePickerSelector.fileName(widget, validFileName)).should("not.exist");
    });
    // FP-13 — a refusal past the cap tells the user nothing.
    // Once full the picker disables itself (useFilePicker.js:656-660), so react-dropzone
    // never runs the validator and onDropRejected never fires: selecting another file
    // produces no inline error and no toast. Verified by hand in the browser — rows 1 -> 1,
    // no message anywhere. Every OTHER rejection on this widget shows both.
    // The facet specs assert the refusal by STATE, because a message assertion there would
    // fail today; this guard is what will notice when a message starts appearing.
    // TODO(issue links)
    it.skip("should tell the user why a file was refused once the picker is full", () => {
      attachFile(validFile);
      expectFileInList(validFileName);

      // Correct behaviour: the refusal is explained, as every other rejection is.
      attachFile(csvFile);
      cy.get(filePickerSelector.errorMessage(widget)).should("be.visible").and("not.have.text", "");
      cy.get(filePickerSelector.fileListItem(widget)).should("have.length", 1);
    });

    // FP-14 — on a mandatory picker the rejection reason is overwritten.
    // An effect (useFilePicker.js:532) rewrites uiErrorMessage to the generic mandatory
    // string whenever isMandatory && no files && isTouched — all true right after a
    // rejection that kept nothing. So the user is told the field is required rather than
    // that the type was wrong. The real reason survives only in the toast.
    // TODO(issue links)
    it.skip("should keep the rejection reason on a mandatory picker instead of replacing it", () => {
      openEditorSidebar(widget);
      openAccordion("Validation");
      cy.get(commonWidgetSelector.parameterTogglebutton("Make this field mandatory")).click();
      cy.waitForAutoSave();
      selectValidationFileType("Spreadsheet files");

      attachFile(validFile); // a .png against a spreadsheet filter

      // Correct behaviour: the inline message explains the TYPE, matching the toast.
      cy.get(filePickerSelector.errorMessage(widget)).should(
        "have.text",
        filePickerErrors.invalidTypeFor(validFileName, ".xls,.xlsx,.csv,.ods")
      );
    });

    // FP-9 (second route) — removing a file below the floor gives no reason at all.
    // The shortfall string is set only from onDropAccepted (useFilePicker.js:421-425); the
    // removal path (handleRemoveFile, :445-461) never sets it. So deleting a file leaves
    // isValid false with nothing on screen, from the first moment — no timer involved.
    // TODO(issue links)
    it.skip("should explain the shortfall after a file is removed, not just after one is added", () => {
      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Allow picking multiple files")).click();
      cy.waitForAutoSave();
      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Min file count", "{{2}}");
      commitChange();

      acceptAnyFileType(widget);
      attachFile([csvFile, secondCsvFile]);
      cy.get(filePickerSelector.fileListItem(widget)).should("have.length", 2);

      deleteFileFromList(secondCsvFileName);

      // Correct behaviour: dropping below the floor states the reason, however it happened.
      cy.get(filePickerSelector.errorMessage(widget)).should(
        "have.text",
        filePickerErrors.minCountShortfall(2)
      );
    });

  }
);
