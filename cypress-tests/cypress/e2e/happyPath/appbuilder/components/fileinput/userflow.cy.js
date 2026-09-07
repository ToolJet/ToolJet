import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonWidgetSelector } from "Selectors/common";
import { fileInputSelector } from "Selectors/appBuilder/components/fileInput";
import { fileInputText, fileInputFixtures } from "Texts/appBuilder/components/fileInput";
import {
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
  waitForDropSettle,
} from "Support/utils/commonWidget";
import {
  commitChange,
  attachFile,
  selectValidationFileType,
  expectRejectionToast,
} from "Support/utils/appBuilder/components/fileInput";

// Userflow facet — one realistic end-to-end journey, driven in PREVIEW rather than on the
// canvas. The other facets each verify one field in isolation; this one checks that a
// plausible combination of them still behaves when composed, which is the failure mode
// per-field tests cannot see.
//
// The flow: a builder configures a mandatory "supporting document" field restricted to
// documents, with clearing enabled. Then a real user attaches the wrong file type, gets
// rejected, attaches a valid one, sees it accepted, clears it, and re-attaches.
describe(
  "File Input userflow",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
    const widget = fileInputText.defaultWidgetName;
    const { validFile, pdfFile, pdfFileName } = fileInputFixtures;

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Fileinput-App`);
      cy.openApp();
      cy.dragAndDropWidget(fileInputText.defaultWidgetText, 500, 100);
      waitForDropSettle(widget);
      closeQueryPanel();
    });

    afterEach(function () {
      if (this.currentTest.state === "passed") cy.apiDeleteApp();
    });

    it("a user attaches, is rejected, corrects, and clears a mandatory document field", () => {
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

      // ── use, as a real user would ──
      cy.openPreview(fileInputSelector.field(widget));

      // The field announces itself as required before anything is attached.
      cy.get(fileInputSelector.labelText(widget)).should("contain.text", "Supporting document");
      cy.get(fileInputSelector.mandatoryIndicator(widget)).should("be.visible");
      cy.get(fileInputSelector.ariaRequired(widget)).should("exist");
      cy.get(fileInputSelector.summary(widget)).should("have.text", "Attach a PDF");

      // Wrong type first — the user is told what is accepted, and nothing is kept.
      attachFile(validFile);
      expectRejectionToast(".pdf");
      cy.get(fileInputSelector.summary(widget)).should("have.text", "Attach a PDF");

      // Correcting the mistake works without a reload — the widget stayed usable.
      attachFile(pdfFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", pdfFileName);

      // Clearing returns the field to its empty state, mandatory marker intact.
      cy.get(fileInputSelector.clearButton(widget)).should("be.visible").click();
      cy.get(fileInputSelector.summary(widget)).should("have.text", "Attach a PDF");
      cy.get(fileInputSelector.mandatoryIndicator(widget)).should("be.visible");

      // And the field still accepts a fresh attachment afterwards — a cleared widget that
      // silently stops working would pass every assertion above.
      attachFile(pdfFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", pdfFileName);
    });
  }
);
