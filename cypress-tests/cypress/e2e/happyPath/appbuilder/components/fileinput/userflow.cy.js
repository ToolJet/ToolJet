import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonWidgetSelector } from "Selectors/common";
import { fileInputSelector } from "Selectors/appBuilder/components/fileInput";
import { fileInputText, fileInputFixtures } from "Texts/appBuilder/components/fileInput";
import {
  verifyExposedValue,
  commitChange,
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
  dropWidget,
} from "Support/utils/commonWidget";
import {
  attachFile,
  selectParseFileType,
  selectValidationFileType,
  expectRejectionToast,
} from "Support/utils/appBuilder/components/fileInput";

// Userflow facet — realistic end-to-end journeys rather than one field at a time, so a
// plausible COMBINATION of settings gets exercised.
// Driven in the EDITOR so the Inspector is available and every step can assert the exposed
// contract (files / isValid / isParsing) as well as the DOM. Preview is covered by
// events.cy.js and csa.cy.js.
describe(
  "File Input userflow",
  { testIsolation: false },
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

    afterEach(() => {
      cy.apiDeleteApp();
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
      verifyExposedValue("isMandatory", "Boolean", "true", widget);
      verifyExposedValue("isValid", "Boolean", "false", widget);
      verifyExposedValue("files", "Array", "[0]", widget);

      // ── wrong type: rejected, nothing kept ──
      attachFile(validFile);
      expectRejectionToast(".pdf");
      cy.get(fileInputSelector.summary(widget)).should("have.text", "Attach a PDF");
      verifyExposedValue("files", "Array", "[0]", widget);
      verifyExposedValue("isValid", "Boolean", "false", widget);

      // ── correcting it works without a reload ──
      attachFile(pdfFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", pdfFileName);
      verifyExposedValue("files", "Array", "[1]", widget);
      verifyExposedValue("isValid", "Boolean", "true", widget);

      // ── clearing returns it to empty ──
      cy.get(fileInputSelector.clearButton(widget)).should("be.visible").click();
      cy.get(fileInputSelector.summary(widget)).should("have.text", "Attach a PDF");
      cy.get(fileInputSelector.mandatoryIndicator(widget)).should("be.visible");
      verifyExposedValue("files", "Array", "[0]", widget);
      verifyExposedValue("isValid", "Boolean", "false", widget);

      // ── still accepts a fresh attachment: a cleared widget that silently stopped
      //    working would satisfy every assertion above ──
      attachFile(pdfFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", pdfFileName);
      verifyExposedValue("files", "Array", "[1]", widget);
    });

    it("should build a multi-file CSV parsing upload and settle after parsing both files", () => {
      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Enable parsing")).click();
      cy.waitForAutoSave();
      selectParseFileType("CSV");

      cy.get(fileInputSelector.inputField(widget)).should("have.attr", "multiple");

      attachFile([csvFile, secondCsvFile]);
      cy.get(fileInputSelector.summary(widget)).should("have.text", fileInputText.multiFileLabel(2));
      verifyExposedValue("files", "Array", "[2]", widget);

      // isParsing must settle back to false — a widget stuck mid-parse looks identical
      // in the DOM
      verifyExposedValue("isParsing", "Boolean", "false", widget);
      verifyExposedValue("isValid", "Boolean", "true", widget);

      // files[0] is sample-a.csv (id,name,role), so each parsed row must report 3 keys.
      verifyExposedValue(["files", "0", "parsedValue", "1"], "Object", "{3}", widget);

      // Re-attaching a held file leaves the selection UNCHANGED: with enableMultiple on a
      // selection adds rather than replaces, and this one is dropped. maxFileCount is 2, so
      // the cap and the duplicate guard would both hold it here — asserts the outcome only.
      attachFile(csvFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", fileInputText.multiFileLabel(2));
      verifyExposedValue("files", "Array", "[2]", widget);
    });
  }
);
