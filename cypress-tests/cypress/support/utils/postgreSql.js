import { commonSelectors, commonWidgetSelector } from "Selectors/common";

export const addQuery = (queryName, query) => {
  cy.get('[data-cy="button-add-new-queries"]').click();
  cy.get('[data-cy="cypress-postgresql"]')
    .should("contain", "cypress-postgresql")
    .click();

  cy.get('[data-cy="query-label-input-field"]').clear().type(queryName);
  cy.get('[data-cy="query-input-field"]')
    .should("be.visible")
    .clearAndTypeOnCodeMirror(query);
  cy.get('[data-cy="query-create-and-run-button"]').click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    `Query (${queryName}) completed.`
  );
};
