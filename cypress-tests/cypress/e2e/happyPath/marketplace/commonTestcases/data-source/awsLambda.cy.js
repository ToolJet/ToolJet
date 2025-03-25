import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { pluginSelectors } from "Selectors/plugins";
import { postgreSqlText } from "Texts/postgreSql";
import { awsLambdaText } from "Texts/awsLambda";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";

import {
  fillDataSourceTextField,
  selectAndAddDataSource,
} from "Support/utils/postgreSql";

import {
  deleteDatasource,
  closeDSModal,
  addQuery,
  addDsAndAddQuery,
} from "Support/utils/dataSource";

import { openQueryEditor } from "Support/utils/dataSource";
import { dataSourceSelector } from "../../../../../constants/selectors/dataSource";

const data = {};
data.dsName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data source AWS Lambda", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.defaultWorkspaceLogin();
    cy.intercept("POST", "/api/data_queries").as("createQuery");
  });

  it("Should  verify elements on AWS Lambda connection form", () => {
    const Accesskey = Cypress.env("awslamda_access");
    const Secretkey = Cypress.env("awslamda_secret");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    cy.get(postgreSqlSelector.apiLabelAndCount).should(
      "have.text",
      postgreSqlText.allApis
    );
    cy.get(postgreSqlSelector.cloudStorageLabelAndCount).should(
      "have.text",
      postgreSqlText.allCloudStorage
    );

    cy.installMarketplacePlugin("AWS Lambda");

    selectAndAddDataSource("databases", awsLambdaText.awsLambda, data.dsName);

    cy.get(".react-select__dropdown-indicator").eq(1).click();
    cy.get(".react-select__option").contains("US West (N. California)").click();

    cy.get(pluginSelectors.amazonsesAccesKey).click().type(Accesskey);

    fillDataSourceTextField(
      awsLambdaText.labelSecretKey,
      "**************",
      Secretkey
    );

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    deleteDatasource(`cypress-${data.dsName}-aws-lambda`);
  });

  it("Should  verify the functionality of AWS Lambda connection form", () => {
    const Accesskey = Cypress.env("awslamda_access");
    const Secretkey = Cypress.env("awslamda_secret");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    cy.installMarketplacePlugin("AWS Lambda");

    selectAndAddDataSource("databases", awsLambdaText.awsLambda, data.dsName);

    cy.get(".react-select__dropdown-indicator").eq(1).click();
    cy.get(".react-select__option").contains("US West (N. California)").click();

    cy.get(pluginSelectors.amazonsesAccesKey).click().type(Accesskey);

    fillDataSourceTextField(
      awsLambdaText.labelSecretKey,
      "**************",
      Secretkey
    );

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    deleteDatasource(`cypress-${data.dsName}-aws-lambda`);
  });

  it("Should  able to run the query with valid conection", () => {
    const Accesskey = Cypress.env("awslamda_access");
    const Secretkey = Cypress.env("awslamda_secret");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    cy.installMarketplacePlugin("AWS Lambda");

    selectAndAddDataSource("databases", awsLambdaText.awsLambda, data.dsName);

    cy.get(".react-select__dropdown-indicator").eq(1).click();
    cy.get(".react-select__option").contains("US West (N. California)").click();

    cy.get(pluginSelectors.amazonsesAccesKey).click().type(Accesskey);

    fillDataSourceTextField(
      awsLambdaText.labelSecretKey,
      "**************",
      Secretkey
    );

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    cy.get(commonSelectors.dashboardIcon).click();
    cy.get(commonSelectors.appCreateButton).click();
    cy.get(commonSelectors.appNameInput).click().type(data.dsName);
    cy.get(commonSelectors.createAppButton).click();
    cy.skipWalkthrough();

    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get(".css-4e90k9").type(`${data.dsName}`);
    cy.contains(`[id*="react-select-"]`, data.dsName).click();
    cy.get('[data-cy="query-rename-input"]').clear().type(data.dsName);

    cy.get(pluginSelectors.operationDropdown)
      .click()
      .type("Invoke Lambda Function{enter}");

    cy.wait(500);

    cy.get(
      '[data-cy="function-name-section"] .cm-content'
    ).clearAndTypeOnCodeMirror("testAwslambdaPlugin");

    cy.wait(500);

    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      `Query (${data.dsName}) completed.`
    );
  });
});
