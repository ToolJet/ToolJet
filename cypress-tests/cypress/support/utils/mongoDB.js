import {
  fillDataSourceTextField,
  selectDataSource,
} from "Support/utils/postgreSql";
import { mongoDbText } from "Texts/mongoDb";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";

export const connectMongo = () => {
  selectDataSource(mongoDbText.mongoDb);

  cy.clearAndType(
    '[data-cy="data-source-name-input-filed"]',
    mongoDbText.cypressMongoDb
  );

  cy.get('[data-cy="query-select-dropdown"]').type(
    mongoDbText.optionConnectUsingConnectionString
  );

  fillDataSourceTextField(
    mongoDbText.labelConnectionString,
    mongoDbText.connectionStringPlaceholder,
    Cypress.env("mongodb_connString"),
    "contain",
    { parseSpecialCharSequences: false, delay: 0 }
  );
  cy.get(postgreSqlSelector.buttonTestConnection).click();
  cy.get(postgreSqlSelector.textConnectionVerified, {
    timeout: 10000,
  }).should("have.text", postgreSqlText.labelConnectionVerified);
  cy.get(postgreSqlSelector.buttonSave).click();

  cy.get(postgreSqlSelector.leftSidebarDatasourceButton).click();
  cy.get(postgreSqlSelector.datasourceLabelOnList)
    .should("have.text", mongoDbText.cypressMongoDb)
    .find("button")
    .invoke("show")
    .should("be.visible");
};

export const openMongoQueryEditor = (dbName = mongoDbText.cypressMongoDb) => {
  cy.get(postgreSqlSelector.buttonAddNewQueries).click();
  cy.get(`[data-cy="${dbName}-add-query-card"]`)
    .should("contain", dbName)
    .click();
};

export const selectQueryType = (type) => {
  cy.get('[data-cy="query-select-dropdown"]').click().type(`${type}{enter}`);
};
