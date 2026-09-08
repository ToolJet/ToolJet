import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonWidgetSelector } from "Selectors/common";
import { filePickerSelector } from "Selectors/appBuilder/components/filePicker";
import {
  filePickerText,
  filePickerAccordion,
  filePickerValidationBar,
  filePickerFixtures,
} from "Texts/appBuilder/components/filePicker";
import {
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
  waitForDropSettle,
} from "Support/utils/commonWidget";
import { attachFile, expectFileInList } from "Support/utils/appBuilder/components/filePicker";

// Basics facet — CI-reliable smoke; if this is red, every other facet is noise.
// Covers: definition defaults label:376 · instructionText:377 — source: filepicker.js
//         the ValidationBar's default composition (size half present, count half ABSENT),
//         the conditional children asserted absent at default (error text, loader, file
//         pane, mandatory marker), the dropzone tab stop, and edit-survives-reload.
// Not here: exposed values → inspector.cy.js · drop placement → canvas.cy.js
describe(
  "File Picker basics",
  { testIsolation: false, retries: { runMode: Number(Cypress.env("TJ_RETRIES") ?? 3), openMode: 0 } },
  () => {
    const widget = filePickerText.defaultWidgetName;
    const { validFile, validFileName, csvFile } = filePickerFixtures;

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filepicker-App`);
      cy.openApp();
      cy.dragAndDropWidget(filePickerText.defaultWidgetText, 500, 100);
      waitForDropSettle(widget);
      closeQueryPanel();
    });

    afterEach(function () {
      if (this.currentTest.state === "passed") cy.apiDeleteApp();
    });

    it("should mount and render the default title and dropzone instruction", () => {
      cy.get(filePickerSelector.draggableWidget(widget)).should("exist");
      cy.get(filePickerSelector.widget(widget)).should("be.visible");
      cy.get(filePickerSelector.inputField(widget)).should("exist");

      cy.get(filePickerSelector.title(widget)).should("have.text", filePickerText.defaultLabel);
      cy.get(filePickerSelector.instructionText(widget)).should(
        "have.text",
        filePickerText.defaultInstruction
      );
    });

    it("should render the size half of the validation bar and omit the count half", () => {
      // Both halves are independently gated (ValidationBar.jsx:14,16) and the shipped
      // defaults land on opposite sides: minSize 50 (filepicker.js:406) makes size-info
      // render, while enableMultiple false (:380) with minFileCount 0 (:408) leaves
      // count-info out. Asserting the absence is what proves the gate works rather than
      // the bar simply rendering everything.
      cy.get(filePickerSelector.validationBar(widget)).should("be.visible");
      cy.get(filePickerSelector.sizeInfo(widget)).should(
        "have.text",
        filePickerValidationBar.defaultSizeInfo
      );
      cy.get(filePickerSelector.countInfo(widget)).should("not.exist");
    });

    it("should render no conditional elements at default", () => {
      // Each is conditional on a state not yet reached: a rejection, loading, a held
      // file, mandatory.
      cy.get(filePickerSelector.errorMessage(widget)).should("not.exist");
      cy.get(filePickerSelector.loader(widget)).should("not.exist");
      cy.get(filePickerSelector.filePane(widget)).should("not.exist");
      cy.get(filePickerSelector.mandatoryIndicator(widget)).should("not.exist");

      // The three drag-state messages need a live drag; only the disabled-at-cap one is
      // reachable from here, and it should be absent too.
      cy.get(filePickerSelector.dragDropMessage(widget)).should("not.exist");
      cy.get(filePickerSelector.maxFilesMessage(widget)).should("not.exist");
    });

    it("should put the dropzone in the tab order while it is enabled", () => {
      // tabIndex is 0 / -1 off `isDisabled` (UploadArea.jsx:58) and is the only keyboard
      // affordance the dropzone has — it is a div, so it carries no `disabled` attribute.
      // NOTE the widget hardcodes `noKeyboard: true` (useFilePicker.js:412), so this tab
      // stop cannot be ACTIVATED by keyboard; see FP-3. This asserts only what the
      // component sets.
      cy.get(filePickerSelector.dropzone(widget)).should("have.attr", "tabindex", "0");
      cy.get(filePickerSelector.ariaDisabled(widget)).should("not.exist");
      cy.get(filePickerSelector.ariaRequired(widget)).should("not.exist");
    });

    it("should ship an image-only accept filter that refuses other types", () => {
      // The shipped validation.fileType is 'image/*' (filepicker.js:234, :405), so a
      // FRESH widget accepts images and nothing else. Neither File Button nor File Input
      // defaults this way, and it is the reason every other facet neutralises the filter
      // in its beforeEach — asserted here, in the one facet that keeps default state, so
      // the default is covered exactly once.
      attachFile(csvFile);
      cy.get(filePickerSelector.filePane(widget)).should("not.exist");

      attachFile(validFile);
      expectFileInList(validFileName);
    });

    it("should keep a property edit after a reload", () => {
      openEditorSidebar(widget);
      verifyAndModifyParameter("Label", "Survives Reload"); // source: filepicker.js:44
      cy.forceClickOnCanvas();
      cy.waitForAutoSave();

      openEditorSidebar(widget);
      openAccordion(filePickerAccordion.additionalActions);
      cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click(); // source: filepicker.js:174
      cy.waitForAutoSave();

      cy.get(filePickerSelector.title(widget)).should("have.text", "Survives Reload");
      cy.get(filePickerSelector.dropzoneDisabled(widget)).should("exist");

      // The pre-reload assertions prove the edits applied, so a post-reload match is
      // persistence rather than a no-op.
      cy.reload();

      cy.get(filePickerSelector.title(widget)).should("have.text", "Survives Reload");
      cy.get(filePickerSelector.dropzoneDisabled(widget)).should("exist");
    });
  }
);
