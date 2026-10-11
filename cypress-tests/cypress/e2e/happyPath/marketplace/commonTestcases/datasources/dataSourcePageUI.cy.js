import { commonSelectors } from "Selectors/common";

describe("Data sources page", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/my-workspace/data-sources");
    cy.get('[data-cy="datasource-list-header"]', { timeout: 30000 }).should(
      "be.visible"
    );
  });

  it("1. Data sources page loads successfully", () => {
    cy.get('[data-cy="datasource-list-header"]')
      .invoke("text")
      .should("match", /^All data sources \(\d+\)$/);
    cy.get(commonSelectors.globalDataSourceIcon).should("be.visible");
  });

  it("2. Expected UI elements are displayed", () => {
    cy.get('[data-cy="datasource-list-header"]').should("be.visible");
    cy.get('[data-cy="commonlyused-datasource-button"]')
      .should("be.visible")
      .invoke("text")
      .should("match", /^Commonly used \(\d+\)$/);
    cy.get('[data-cy="databases-datasource-button"]')
      .should("be.visible")
      .invoke("text")
      .should("match", /^Databases \(\d+\)$/);
    cy.get('[data-cy="apis-datasource-button"]')
      .should("be.visible")
      .invoke("text")
      .should("match", /^APIs \(\d+\)$/);
    cy.get('[data-cy="cloudstorage-datasource-button"]')
      .should("be.visible")
      .invoke("text")
      .should("match", /^Cloud Storages \(\d+\)$/);
    cy.get(".datasource-card").should("have.length.greaterThan", 0);
  });

  it("3. Data source details render correctly on each card", () => {
    cy.get(".datasource-card").each(($card) => {
      cy.wrap($card).find(".card-icon").should("exist");
      cy.wrap($card)
        .find(".datasource-card-title")
        .invoke("text")
        .should("not.be.empty");
      cy.wrap($card).find("button").should("contain.text", "Add");
    });
  });
});
