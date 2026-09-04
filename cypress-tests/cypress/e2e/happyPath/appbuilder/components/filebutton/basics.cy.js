import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/appBuilder/components/fileButton";
import { fileButtonText } from "Texts/appBuilder/components/fileButton";
import {
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
  waitForDropSettle,
} from "Support/utils/commonWidget";

// Basics facet — CI-reliable smoke; if this is red, every other facet is noise.
// Covers: definition defaults buttonText:15 · icon:181 — source: fileButton.js
//         the 4 conditional children asserted ABSENT at default (clear-button,
//         invalid-feedback, loader, mandatory-indicator), and edit-survives-reload.
// Not here: exposed values → inspector.cy.js · drop placement → canvas.cy.js
describe(
  "File Button basics",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
  const widget = fileButtonText.defaultWidgetName;

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filebutton-App`);
    cy.openApp();
    cy.dragAndDropWidget(fileButtonText.defaultWidgetText, 500, 100);
    waitForDropSettle(widget);
    closeQueryPanel();
  });

  afterEach(function () {
    if (this.currentTest.state === "passed") cy.apiDeleteApp();
  });

  it("should mount and render the default label and icon, with no optional elements", () => {
    cy.get(fileButtonSelector.draggableWidget(widget)).should("exist");
    cy.get(fileButtonSelector.button(widget)).should("be.visible");
    cy.get(fileButtonSelector.inputField(widget)).should("exist");

    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonText.defaultLabel);
    cy.get(fileButtonSelector.icon(widget)).should("be.visible");
    // Each is conditional on state not yet reached: a held file, mandatory, a
    // rejection, loading. Their absence IS the default.
    cy.get(fileButtonSelector.clearButton(widget)).should("not.exist");
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("not.exist");
    cy.get(fileButtonSelector.loader(widget)).should("not.exist");
    cy.get(fileButtonSelector.mandatoryIndicator(widget)).should("not.exist");
  });

  it("should keep a property edit after a reload", () => {
    openEditorSidebar(widget);
    verifyAndModifyParameter("Button text", "Survives Reload");
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();

    openEditorSidebar(widget);
    openAccordion("Additional Actions");
    cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click();
    cy.waitForAutoSave();

    cy.get(fileButtonSelector.label(widget)).should("have.text", "Survives Reload");
    cy.get(fileButtonSelector.button(widget)).should("be.disabled");

    // The pre-reload assertions prove the edits applied, so a post-reload match is
    // persistence rather than a no-op.
    cy.reload();

    cy.get(fileButtonSelector.label(widget)).should("have.text", "Survives Reload");
    cy.get(fileButtonSelector.button(widget)).should("be.disabled");
  });
});
