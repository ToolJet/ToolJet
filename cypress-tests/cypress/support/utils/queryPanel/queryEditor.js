export const verifyElemtsNoGds = (option) => {
  cy.get('[data-cy="label-select-datasource"]').verifyVisibleElement(
    "have.text",
    "Connect to a Data Source"
  );
  cy.get('[data-cy="querymanager-description"]').verifyVisibleElement(
    "contain.text",
    "Select a Data Source to start creating a new query. To know more about queries in ToolJet, you can read our"
  );
  cy.get('[data-cy="querymanager-doc-link"]').verifyVisibleElement(
    "have.text",
    "documentation"
  );

  cy.get('[data-cy="landing-page-label-default"]').verifyVisibleElement(
    "have.text",
    "Default"
  );
  cy.get('[data-cy="restapi-add-query-card"]').verifyVisibleElement(
    "have.text",
    "REST API"
  );
  cy.get('[data-cy="runjs-add-query-card"]').verifyVisibleElement(
    "have.text",
    "JavaScript"
  );
  cy.get('[data-cy="runpy-add-query-card"]').verifyVisibleElement(
    "have.text",
    "Python"
  );
  cy.get('[data-cy="tooljetdb-add-query-card"]').verifyVisibleElement(
    "have.text",
    "ToolJet DB"
  );

  cy.get('[data-cy="label-avilable-ds"]').verifyVisibleElement(
    "have.text",
    "Available Datasources 0"
  );
  cy.get('[data-cy="landing-page-add-new-ds-button"]').verifyVisibleElement(
    "have.text",
    "Add new"
  );
  cy.get('[data-cy="empty-banner-queryManager"]').verifyVisibleElement(
    "have.text",
    "No global datasources have been added yet. Add new datasources to connect to your app! 🚀"
  );
};

export const verifyElemtsWithGds = (option) => { };
