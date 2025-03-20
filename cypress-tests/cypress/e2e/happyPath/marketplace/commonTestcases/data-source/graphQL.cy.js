import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { pluginSelectors } from "Selectors/plugins";
import { postgreSqlText } from "Texts/postgreSql";
import { GraphQLText } from "Texts/graphQL";
import { amazonAthenaText } from "Texts/amazonAthena";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";

import {
  fillDataSourceTextField,
  selectAndAddDataSource,
} from "Support/utils/postgreSql";

import {
  verifyCouldnotConnectWithAlert,
  deleteDatasource,
  closeDSModal,
  addQuery,
  addDsAndAddQuery,
} from "Support/utils/dataSource";

import { dataSourceSelector } from "../../../../../constants/selectors/dataSource";

const data = {};
data.dsName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data source GraphQL", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.defaultWorkspaceLogin();
  });

  it("Should verify elements on GraphQL connection form", () => {
    const Url = Cypress.env("GraphQl_Url");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    cy.get(postgreSqlSelector.allDatasourceLabelAndCount).should(
      "have.text",
      postgreSqlText.allDataSources()
    );
    cy.get(postgreSqlSelector.commonlyUsedLabelAndCount).should(
      "have.text",
      postgreSqlText.commonlyUsed
    );
    cy.get(postgreSqlSelector.databaseLabelAndCount).should(
      "have.text",
      postgreSqlText.allDatabase()
    );
    cy.get(postgreSqlSelector.apiLabelAndCount).should(
      "have.text",
      postgreSqlText.allApis
    );
    cy.get(postgreSqlSelector.cloudStorageLabelAndCount).should(
      "have.text",
      postgreSqlText.allCloudStorage
    );

    selectAndAddDataSource("databases", GraphQLText.GraphQL, data.dsName);

    fillDataSourceTextField(
      GraphQLText.urlInputLabel,
      GraphQLText.urlInputPlaceholder,
      Url
    );

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    deleteDatasource(`cypress-${data.dsName}-GraphQL`);
  });

  it("Should verify the functionality of GraphQL connection form", () => {
    const Url = Cypress.env("GraphQl_Url");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    selectAndAddDataSource("databases", GraphQLText.GraphQL, data.dsName);

    fillDataSourceTextField(
      GraphQLText.urlInputLabel,
      GraphQLText.urlInputPlaceholder,
      Url
    );

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    deleteDatasource(`cypress-${data.dsName}-GraphQL`);
  });

  it("Should able to run the query with valid conection", () => {
    const Url = Cypress.env("GraphQl_Url");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    selectAndAddDataSource("databases", GraphQLText.GraphQL, data.dsName);

    fillDataSourceTextField(
      GraphQLText.urlInputLabel,
      GraphQLText.urlInputPlaceholder,
      Url
    );

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    cy.get(commonSelectors.globalDataSourceIcon).click();

    cy.get(commonSelectors.dashboardIcon).click();
    cy.get(commonSelectors.appCreateButton).click();
    cy.get(commonSelectors.appNameInput).click().type(data.dsName);
    cy.get(commonSelectors.createAppButton).click();
    cy.skipWalkthrough();

    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get(".css-4e90k9").type(`${data.dsName}`);
    cy.contains(`[id*="react-select-"]`, data.dsName).click();
    cy.get('[data-cy="query-rename-input"]').clear().type(data.dsName);

    cy.get('[data-cy="query-input-field"]').clearAndTypeOnCodeMirror(
      `{
  allFilms {
    films { title director }
    }
    }`
    );
    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      `Query (${data.dsName}) completed.`
    );
  });
});
