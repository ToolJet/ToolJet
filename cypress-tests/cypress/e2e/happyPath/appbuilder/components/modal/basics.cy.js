import { fake } from "Fixtures/fake";
import { modalSelector } from "Selectors/modal";
import {
  launchModal,
  closeModal,
  launchButton,
  openModalInspector,
  toggleModalProperty,
} from "Support/utils/appBuilder/components/modal";

// Basics facet — the core open/close lifecycle of ModalV2: default trigger
// render, open via the trigger, close via the close button / Escape, and the
// two dismissal-behaviour toggles (Close on escape key, Close on clicking
// outside). testIsolation:false for cypress-real-dnd (its CDP client is cached
// per spec run); each test re-creates its own app in beforeEach.
describe("Modal — basics facet", { testIsolation: false, retries: { runMode: 2, openMode: 0 } }, () => {
  const W = "modal1";

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Modal-Basics`);
    cy.openApp();
    cy.dragAndDropWidget("Modal");
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  // Default trigger renders + open/close via trigger, close button, Escape.
  // source: modalV2.js:82 (triggerButtonLabel default 'Launch Modal'),
  //         modalV2.js:415 (hideOnEsc default true)
  it("open/close via trigger, close button, and Escape", () => {
    cy.get(launchButton(W))
      .should("be.visible")
      .verifyVisibleElement("have.text", "Launch Modal");

    // Open → all slots + close button visible.
    launchModal(W);
    cy.get(modalSelector.modalHeader).should("be.visible");
    cy.get(modalSelector.modalBody).should("be.visible");
    cy.get(modalSelector.modalFooter).should("be.visible");
    cy.get(modalSelector.modalCloseButton).should("be.visible");

    // Close via the close button → the body unmounts (assert not.exist, not
    // not.be.visible — the body is removed from the DOM on close).
    cy.get(modalSelector.modalCloseButton).realClick();
    cy.get(modalSelector.modalBody).should("not.exist");

    // Re-open, then close via Escape (hideOnEsc is ON by default).
    launchModal(W);
    cy.get(modalSelector.modalBody).should("be.visible");
    cy.realPress("Escape");
    cy.get(modalSelector.modalBody).should("not.exist");
  });

  // Close on escape key (hideOnEsc) — default ON. source: modalV2.js:111,415
  it("Close on escape key — default ON closes; toggled OFF keeps it open", () => {
    // Default ON → Escape closes the modal.
    launchModal(W);
    cy.get(modalSelector.modalBody).should("be.visible");
    cy.realPress("Escape");
    cy.get(modalSelector.modalBody).should("not.exist");

    // Toggle OFF → Escape no longer closes; the close button still works.
    openModalInspector("Additional Actions");
    toggleModalProperty("Close on escape key");
    launchModal(W);
    cy.realPress("Escape");
    cy.get(modalSelector.modalBody).should("be.visible"); // still open
    closeModal(W);
    cy.get(modalSelector.modalBody).should("not.exist");

    openModalInspector("Additional Actions");
    toggleModalProperty("Close on escape key"); // restore
  });

  // Close on clicking outside — default OFF (static backdrop). source: modalV2.js:112,416
  it("Close on clicking outside — default OFF keeps it open; toggled ON closes", () => {
    // Default OFF → clicking the backdrop keeps the modal open.
    launchModal(W);
    cy.get(modalSelector.modalBody).should("be.visible");
    cy.get(modalSelector.modalContainer).click("topLeft");
    cy.get(modalSelector.modalBody).should("be.visible"); // still open
    cy.realPress("Escape");
    cy.get(modalSelector.modalBody).should("not.exist");

    // Toggle ON → a click on the outer `.modal` element closes the modal.
    openModalInspector("Additional Actions");
    toggleModalProperty("Close on clicking outside");
    launchModal(W);
    cy.get(modalSelector.modalBody).should("be.visible");
    cy.get(modalSelector.modalContainer).click("topLeft");
    cy.get(modalSelector.modalBody).should("not.exist");

    openModalInspector("Additional Actions");
    toggleModalProperty("Close on clicking outside"); // restore
  });
});
