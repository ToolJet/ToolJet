import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import {
  launchModal,
  closeModal,
} from "Support/utils/appBuilder/components/modal";
import { openEditorSidebar, openAccordion } from "Support/utils/commonWidget";
import { selectEvent } from "Support/utils/appBuilder/events";

// Events facet — the Modal's two lifecycle events. source: modalV2.js:137-140
//   onOpen  → "On open"
//   onClose → "On close"
// Both are wired to Show Alert and asserted via the toast on open/close.
// testIsolation:false for cypress-real-dnd; each test re-creates its own app.
describe("Modal — events facet", { testIsolation: false, retries: { runMode: 2, openMode: 0 } }, () => {
  const W = "modal1";

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Modal-Events`);
    cy.openApp();
    cy.dragAndDropWidget("Modal");
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  it("On open + On close — each fires a Show Alert toast", () => {
    openEditorSidebar(W);
    openAccordion(commonWidgetText.accordionEvents);

    // On open → Show Alert. source: modalV2.js:138
    selectEvent("On open", "Show Alert");
    // On close → Show Alert (second handler on the same component).
    // source: modalV2.js:139
    selectEvent(
      "On close",
      "Show Alert",
      0,
      commonSelectors.addMoreEventHandlerLink,
      1
    );

    // On open fires when the modal opens.
    launchModal(W);
    cy.verifyToastMessage(commonSelectors.toastMessage, "Hello world!");

    // On close fires when the modal closes.
    closeModal(W);
    cy.verifyToastMessage(commonSelectors.toastMessage, "Hello world!");
  });
});
