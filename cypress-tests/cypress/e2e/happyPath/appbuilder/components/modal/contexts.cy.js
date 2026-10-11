import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
  openModalInspector,
  toggleModalProperty,
} from "Support/utils/appBuilder/components/modal";

// Contexts facet — the Modal across device contexts (desktop / mobile layout).
// source: modalV2.js:10-13 (others.showOnDesktop default true, showOnMobile
// default false). testIsolation:false for cypress-real-dnd; each test
// re-creates its own app.
describe("Modal — contexts facet", { testIsolation: false, retries: { runMode: 2, openMode: 0 } }, () => {
  const W = "modal1";

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Modal-Contexts`);
    cy.openApp();
    cy.dragAndDropWidget("Modal");
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  it("device context — Show on desktop / Show on mobile gate the widget", () => {
    openModalInspector("Devices");

    // Turn OFF "Show on desktop" → the modal disappears from the desktop canvas.
    // source: modalV2.js:11,398
    toggleModalProperty("Show on desktop");
    cy.get(commonWidgetSelector.draggableWidget(W)).should("not.exist");
    toggleModalProperty("Show on desktop"); // restore
    cy.get(commonWidgetSelector.draggableWidget(W)).should("exist");

    // Default: not shown on mobile → switching to the mobile layout hides it.
    // source: modalV2.js:12,399
    cy.get(commonWidgetSelector.changeLayoutToMobileButton).click();
    cy.get(commonWidgetSelector.draggableWidget(W)).should("not.exist");
    cy.get(commonWidgetSelector.changeLayoutToDesktopButton).click();

    // Turn ON "Show on mobile", switch to the mobile layout → it renders again.
    openModalInspector("Devices");
    toggleModalProperty("Show on mobile");
    cy.get(commonWidgetSelector.changeLayoutToMobileButton).click();
    cy.get(commonWidgetSelector.draggableWidget(W)).should("exist");
  });
});
