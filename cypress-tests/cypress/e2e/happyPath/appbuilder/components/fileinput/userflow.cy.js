import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonWidgetSelector } from "Selectors/common";
import { fileInputSelector } from "Selectors/appBuilder/components/fileInput";
import { fileInputText, fileInputFixtures } from "Texts/appBuilder/components/fileInput";
import {
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
  dropWidget,
} from "Support/utils/commonWidget";
import {
  commitChange,
  verifyExposedValue,
  attachFile,
  selectParseFileType,
  selectValidationFileType,
  expectRejectionToast,
  openParsedValue,
  closeParsedValue,
} from "Support/utils/appBuilder/components/fileInput";

// Userflow facet — realistic end-to-end journeys rather than one field at a time, so a
// plausible COMBINATION of settings gets exercised.
// Driven in the EDITOR so the Inspector is available and every step can assert the exposed
// contract (files / isValid / isParsing) as well as the DOM. Preview is covered by
// events.cy.js and csa.cy.js.
describe(
  "File Input userflow",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
    const widget = fileInputText.defaultWidgetName;
    const { validFile, csvFile, secondCsvFile, pdfFile, pdfFileName } = fileInputFixtures;

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Fileinput-App`);
      cy.openApp();
      dropWidget(fileInputText.defaultWidgetText, widget, 500, 100);
      cy.waitForElement(fileInputSelector.field(widget));
      closeQueryPanel();
    });

    afterEach(function () {
      if (this.currentTest.state === "passed") cy.apiDeleteApp();
    });

    it("should build a mandatory document upload field and drive it through reject, accept and clear", () => {
      // ── build ──
      openEditorSidebar(widget);
      verifyAndModifyParameter("Label", "Supporting document");
      commitChange();

      openEditorSidebar(widget);
      verifyAndModifyParameter("Placeholder", "Attach a PDF");
      commitChange();

      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Enable clear selection")).click();
      cy.waitForAutoSave();

      openEditorSidebar(widget);
      openAccordion("Validation");
      cy.get(commonWidgetSelector.parameterTogglebutton("Mark as mandatory")).click();
      cy.waitForAutoSave();
      selectValidationFileType("Document files");

      // ── empty and mandatory ──
      cy.get(fileInputSelector.labelText(widget)).should("contain.text", "Supporting document");
      cy.get(fileInputSelector.mandatoryIndicator(widget)).should("be.visible");
      cy.get(fileInputSelector.ariaRequired(widget)).should("exist");
      cy.get(fileInputSelector.summary(widget)).should("have.text", "Attach a PDF");
      verifyExposedValue("isMandatory", "Boolean", "true");
      verifyExposedValue("isValid", "Boolean", "false");
      verifyExposedValue("files", "Array", "[0]");

      // ── wrong type: rejected, nothing kept ──
      attachFile(validFile);
      expectRejectionToast(".pdf");
      cy.get(fileInputSelector.summary(widget)).should("have.text", "Attach a PDF");
      verifyExposedValue("files", "Array", "[0]");
      verifyExposedValue("isValid", "Boolean", "false");

      // ── correcting it works without a reload ──
      attachFile(pdfFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", pdfFileName);
      verifyExposedValue("files", "Array", "[1]");
      verifyExposedValue("isValid", "Boolean", "true");

      // ── clearing returns it to empty ──
      cy.get(fileInputSelector.clearButton(widget)).should("be.visible").click();
      cy.get(fileInputSelector.summary(widget)).should("have.text", "Attach a PDF");
      cy.get(fileInputSelector.mandatoryIndicator(widget)).should("be.visible");
      verifyExposedValue("files", "Array", "[0]");
      verifyExposedValue("isValid", "Boolean", "false");

      // ── still accepts a fresh attachment: a cleared widget that silently stopped
      //    working would satisfy every assertion above ──
      attachFile(pdfFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", pdfFileName);
      verifyExposedValue("files", "Array", "[1]");
    });

    it("should build a multi-file CSV parsing upload and settle after parsing both files", () => {
      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Enable parsing")).click();
      cy.waitForAutoSave();
      selectParseFileType("CSV");

      cy.get(fileInputSelector.inputField(widget)).should("have.attr", "multiple");

      attachFile([csvFile, secondCsvFile]);
      cy.get(fileInputSelector.summary(widget)).should("have.text", fileInputText.multiFileLabel(2));
      verifyExposedValue("files", "Array", "[2]");

      // isParsing must settle back to false — a widget stuck mid-parse looks identical
      // in the DOM
      verifyExposedValue("isParsing", "Boolean", "false");
      verifyExposedValue("isValid", "Boolean", "true");

      openParsedValue(widget);
      cy.get('[data-cy="inspector-parsedvalue-label"]').should("exist");
      closeParsedValue();

      // Re-attaching a held file leaves the selection UNCHANGED: with enableMultiple on a
      // selection adds rather than replaces, and this one is dropped. maxFileCount is 2, so
      // the cap and the duplicate guard would both hold it here — asserts the outcome only.
      attachFile(csvFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", fileInputText.multiFileLabel(2));
      verifyExposedValue("files", "Array", "[2]");
    });
  }
);
