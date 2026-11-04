import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { modalSelector } from "Selectors/modal";
import {
  launchModal,
  closeModal,
  launchButton,
  openModalInspector,
} from "Support/utils/appBuilder/components/modal";
import { openEditorSidebar, openAccordion } from "Support/utils/commonWidget";
import { selectEvent } from "Support/utils/appBuilder/events";

// Userflow facet — an end-to-end builder journey for the Modal: place it,
// customise the trigger label, open it as a fullscreen dialog, wire an On-open
// alert, and confirm the whole flow works from the trigger through to close.
// testIsolation:false for cypress-real-dnd; each test re-creates its own app.
describe("Modal — userflow facet", { testIsolation: false, retries: { runMode: 2, openMode: 0 } }, () => {
  const W = "modal1";

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Modal-Userflow`);
    cy.openApp();
    cy.dragAndDropWidget("Modal");
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  it("customise trigger + fullscreen width + On-open alert → open and close", () => {
    // 1) Default trigger renders with the default label.
    cy.get(launchButton(W))
      .should("be.visible")
      .verifyVisibleElement("have.text", "Launch Modal"); // source: modalV2.js:82

    // 2) Rename the trigger button label → the button text follows it.
    openModalInspector("Trigger");
    cy.get(commonWidgetSelector.parameterInputField("Trigger button label"))
      .clearAndTypeOnCodeMirror("View report");
    cy.waitForAutoSave();
    cy.get(commonSelectors.canvas).click("topRight", { force: true });
    cy.get(launchButton(W)).verifyVisibleElement("have.text", "View report");

    // 3) Set Width → fullscreen. source: modalV2.js:90-104
    openModalInspector("Data");
    cy.get(modalSelector.widthDropdown)
      .find("input")
      .first()
      .type("fullscreen{enter}", { force: true });
    cy.waitForAutoSave();

    // 4) Wire an On-open Show Alert. source: modalV2.js:138
    openEditorSidebar(W);
    openAccordion(commonWidgetText.accordionEvents);
    selectEvent("On open", "Show Alert");

    // 5) Open → fullscreen dialog renders + the On-open alert fires.
    launchModal(W);
    cy.get(modalSelector.fullscreenModal).should("exist");
    cy.get(modalSelector.modalBody).should("be.visible");
    cy.verifyToastMessage(commonSelectors.toastMessage, "Hello world!");

    // 6) Close via the close button → the modal unmounts.
    closeModal(W);
    cy.get(modalSelector.modalBody).should("not.exist");
  });
});
