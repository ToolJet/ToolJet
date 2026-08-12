import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";

describe("Editor - App History Panel", { testIsolation: false }, () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-App-History`);
    cy.openApp();
    cy.viewport(1800, 1800);
  });

  afterEach(() => {                                         
        cy.apiDeleteApp();                                      
     }); 

  it("should open the app history panel and close it via the close button", () => {
    cy.get(commonWidgetSelector.appHistoryButton).click();
    cy.hideTooltip();

    cy.get(commonWidgetSelector.appHistoryHeaderTitle)
      .should("be.visible")
      .and("have.text", "App history");
 cy.get(commonWidgetSelector.appHistoryCloseButton).should("be.visible");

    cy.get(commonWidgetSelector.appHistoryCloseButton).click();
 cy.get(commonWidgetSelector.appHistoryHeaderTitle).should("not.exist");
  });

   it("should display history entries in the timeline after a canvas change", () => {
   cy.dragAndDropWidget("Button", 500, 300);
    cy.waitForAutoSave();

    cy.get(commonWidgetSelector.appHistoryButton).click();
    cy.hideTooltip();

    cy.get(commonWidgetSelector.appHistoryHeaderTitle)
      .should("be.visible")
      .and("have.text", "App history");

  cy.get(".spinner-center", { timeout: 15000 }).should("not.exist");

    cy.get(commonWidgetSelector.historyTimeline).should("be.visible");

  cy.get(commonWidgetSelector.historyDateGroup)
      .first()
      .should("contain.text", "Today");

  cy.get(commonWidgetSelector.historyEntry).should("have.length.greaterThan", 0);

   cy.get(commonWidgetSelector.historyEntryName)
      .first()
      .should("have.text", "Current version");
  });
});
