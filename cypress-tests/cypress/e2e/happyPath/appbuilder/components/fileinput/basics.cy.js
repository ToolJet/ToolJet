import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonWidgetSelector } from "Selectors/common";
import { fileInputSelector } from "Selectors/appBuilder/components/fileInput";
import { fileInputText, fileInputAccordion } from "Texts/appBuilder/components/fileInput";
import {
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
  waitForDropSettle,
} from "Support/utils/commonWidget";

// Basics facet — CI-reliable smoke; if this is red, every other facet is noise.
// Covers: definition defaults label:491 · instructionText:492 — source: fileinput.js
//         the icon asserted ABSENT because iconVisibility ships false (fileinput.js:513),
//         the 4 conditional children asserted ABSENT at default (clear button, error text,
//         loader, mandatory marker), and edit-survives-reload.
// Not here: exposed values → inspector.cy.js · drop placement → canvas.cy.js
describe(
  "File Input basics",
  { testIsolation: false },
  () => {
    const widget = fileInputText.defaultWidgetName;

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Fileinput-App`);
      cy.openApp();
      cy.dragAndDropWidget(fileInputText.defaultWidgetText, 500, 100);
      waitForDropSettle(widget);
      closeQueryPanel();
    });

    afterEach(() => {
      cy.apiDeleteApp();
    });

    it("should mount and render the default label, placeholder and Browse trigger", () => {
      cy.get(fileInputSelector.draggableWidget(widget)).should("exist");
      cy.get(fileInputSelector.field(widget)).should("be.visible");
      cy.get(fileInputSelector.inputField(widget)).should("exist");

      cy.get(fileInputSelector.labelText(widget)).should("have.text", fileInputText.defaultLabel);
      cy.get(fileInputSelector.summary(widget)).should("have.text", fileInputText.defaultPlaceholder);
      // "Browse" is hardcoded in the component (FileInput.jsx:316), not a config field —
      // so this asserts the trigger exists and is labelled, not a configurable value.
      cy.get(fileInputSelector.browseButton(widget))
        .should("be.visible")
        .and("have.text", fileInputText.browseButtonText);
    });

    it("should render no icon and no conditional elements at default", () => {
      // iconVisibility carries no schema entry, only a stored default of false
      // (fileinput.js:513), so the configured IconFileSearch never renders until the eye
      // toggle is switched on. This absence IS the shipped default, not a gap in the test.
      cy.get(fileInputSelector.icon(widget)).should("not.exist");

      // Each of these is conditional on a state not yet reached: a held file with clear
      // enabled, a rejection, loading, mandatory.
      cy.get(fileInputSelector.clearButton(widget)).should("not.exist");
      cy.get(fileInputSelector.errorMessage(widget)).should("not.exist");
      cy.get(fileInputSelector.loader(widget)).should("not.exist");
      cy.get(fileInputSelector.mandatoryIndicator(widget)).should("not.exist");
    });

    it("should address every child element by a widget-scoped data-cy", () => {
      // Regression guard. This widget previously emitted ONE data-cy (its root) and
      // nothing else, and its label rendered as `undefined-label` because no `dataCy`
      // prop reached _ui/Label (Label.jsx:47) — a name shared by every widget with that
      // gap, so it could not identify one instance on a page holding several.
      //
      // Asserting the derived names here means removing any of them fails one obvious
      // test rather than scattering breakage across all twelve facets.
      cy.get(fileInputSelector.field(widget)).should("exist");
      cy.get(fileInputSelector.inputField(widget)).should("exist");
      cy.get(fileInputSelector.summary(widget)).should("exist");
      cy.get(fileInputSelector.label(widget)).should("exist");
      cy.get(fileInputSelector.browseButton(widget)).should("exist");
      cy.get('[data-cy="undefined-label"]').should("not.exist");
    });

    it("should keep a property edit after a reload", () => {
      openEditorSidebar(widget);
      verifyAndModifyParameter("Label", "Survives Reload");
      cy.forceClickOnCanvas();
      cy.waitForAutoSave();

      openEditorSidebar(widget);
      openAccordion(fileInputAccordion.additionalActions);
      cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click();
      cy.waitForAutoSave();

      cy.get(fileInputSelector.labelText(widget)).should("have.text", "Survives Reload");
      cy.get(fileInputSelector.browseButton(widget)).should("be.disabled");

      // The pre-reload assertions prove the edits applied, so a post-reload match is
      // persistence rather than a no-op.
      cy.reload();

      cy.get(fileInputSelector.labelText(widget)).should("have.text", "Survives Reload");
      cy.get(fileInputSelector.browseButton(widget)).should("be.disabled");
    });
  }
);
