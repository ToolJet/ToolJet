export const verifyElemtsNoGds = (option) => {
  cy.get('[data-cy="label-select-datasource"]').verifyVisibleElement(
    "have.text",
    "Connect to a data source"
  );
  cy.get('[data-cy="querymanager-description"]').verifyVisibleElement(
    "contain.text",
    "Select a data source to start creating a new query. To know more about queries in ToolJet, you can read our"
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
    " REST API"
  );
  cy.get('[data-cy="runjs-add-query-card"]').verifyVisibleElement(
    "have.text",
    " JavaScript"
  );
  cy.get('[data-cy="runpy-add-query-card"]').verifyVisibleElement(
    "contain.text",
    " Python"
  );
  cy.get('[data-cy="tooljetdb-add-query-card"]').verifyVisibleElement(
    "have.text",
    " ToolJet DB"
  );

  cy.get('[data-cy="label-avilable-ds"]').verifyVisibleElement(
    "have.text",
    "Available data sources 0"
  );
  cy.get('[data-cy="landing-page-add-new-ds-button"]').verifyVisibleElement(
    "have.text",
    "Add new"
  );
  cy.get('[data-cy="label-no-ds-added"]').verifyVisibleElement(
    "have.text",
    "No global data sources have been added yet."
  );
};

export const verifyElemtsWithGds = (name) => {
  cy.apiCreateGDS(
    "http://localhost:3000/api/v2/data_sources",
    name,
    "postgresql",
    [
      { key: "host", value: "localhost" },
      { key: "port", value: 5432 },
      { key: "database", value: "" },
      { key: "username", value: "dev@tooljet.io" },
      { key: "password", value: "password", encrypted: true },
      { key: "ssl_enabled", value: true, encrypted: false },
      { key: "ssl_certificate", value: "none", encrypted: false },
    ]
  );
  cy.reload();
  cy.get('[data-cy="cypress-psql-add-query-card"]').should("be.visible");
  cy.get('[data-cy="label-avilable-ds"]').verifyVisibleElement(
    "have.text",
    "Available data sources (1)"
  );
  cy.get('[data-cy="cypress-psql-add-query-card"]').click();
  cy.get('[data-cy="list-query-postgresql1"]').should("be.visible");
};
