import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";

describe("Editor title", () => {
  const data = {};
  beforeEach(() => {
    data.appName = fake.companyName;
    cy.apiLogin();
    cy.apiCreateApp(data.appName);
    cy.visit("/");
  });

  afterEach(() => {
    cy.apiDeleteApp();
  });
  it.skip("should verify titles", () => {
    cy.url().should("include", "/tooljets-workspace");
    cy.title().should("eq", "Dashboard | ToolJet");
    // cy.title().should("eq", "ToolJet");

    cy.log(data.appName);

    cy.openApp();
    cy.url().should("include", Cypress.env("appId"));
    cy.title().should("eq", `${data.appName} | ToolJet`);

    cy.openInCurrentTab(commonWidgetSelector.previewButton);

    cy.url().should("include", `/applications/${Cypress.env("appId")}`);
    // cy.title().should("eq", `${data.appName} | ToolJet`);
    cy.title().should("eq", `Preview - ${data.appName} | ToolJet`);

    cy.go("back");
    cy.releaseApp();
    cy.url().then((url) => {
      const appId = url.split("/").filter(Boolean).pop();
      cy.log(appId);
      cy.visit(`/applications/${appId}`);
    });

    cy.url().should("include", `/applications/${Cypress.env("appId")}`);
    cy.title().should("eq", `${data.appName} | ToolJet`);
    // cy.title().should("eq", `${data.appName}`);
  });
});

