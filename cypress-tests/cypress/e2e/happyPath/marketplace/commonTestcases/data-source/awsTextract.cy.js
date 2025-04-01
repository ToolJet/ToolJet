import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { pluginSelectors } from "Selectors/plugins";
import { awsTextractSelectors } from "Selectors/Plugins";
import { postgreSqlText } from "Texts/postgreSql";
import { awsTextractText } from "Texts/awsTextract";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";

import {
  fillDataSourceTextField,
  selectAndAddDataSource,
} from "Support/utils/postgreSql";

import {
  deleteDatasource,
  closeDSModal,
  deleteAppandDatasourceAfterExecution,
} from "Support/utils/dataSource";

import { dataSourceSelector } from "../../../../../constants/selectors/dataSource";

const data = {};
data.dsName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data source AWS Textract", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.defaultWorkspaceLogin();
    cy.intercept("POST", "/api/data_queries").as("createQuery");
  });

  it("Should  verify elements on AWS Textract connection form", () => {
    const Accesskey = Cypress.env("awstextract_access");
    const Secretkey = Cypress.env("awstextract_secret");

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

    cy.installMarketplacePlugin("AWS Textract");

    selectAndAddDataSource(
      "databases",
      awsTextractText.awsTextract,
      data.dsName
    );

    cy.get(".react-select__dropdown-indicator").eq(1).click();
    cy.get(".react-select__option").contains("US West (N. California)").click();

    cy.get(pluginSelectors.amazonsesAccesKey).click().type(Accesskey);

    fillDataSourceTextField(
      awsTextractText.labelSecretKey,
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

    deleteDatasource(`cypress-${data.dsName}-aws-textract`);
  });

  it("Should  verify functionality of AWS Textract connection form", () => {
    const Accesskey = Cypress.env("awstextract_access");
    const Secretkey = Cypress.env("awstextract_secret");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    cy.installMarketplacePlugin("AWS Textract");

    selectAndAddDataSource(
      "databases",
      awsTextractText.awsTextract,
      data.dsName
    );

    cy.get(".react-select__dropdown-indicator").eq(1).click();
    cy.get(".react-select__option").contains("US West (N. California)").click();

    cy.get(pluginSelectors.amazonsesAccesKey).click().type(Accesskey);

    fillDataSourceTextField(
      awsTextractText.labelSecretKey,
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

    deleteDatasource(`cypress-${data.dsName}-aws-textract`);
  });

  it("Should  able to run the query with valid conection", () => {
    const Accesskey = Cypress.env("awstextract_access");
    const Secretkey = Cypress.env("awstextract_secret");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    cy.installMarketplacePlugin("AWS Textract");

    selectAndAddDataSource(
      "databases",
      awsTextractText.awsTextract,
      data.dsName
    );

    cy.get(".react-select__dropdown-indicator").eq(1).click();
    cy.get(".react-select__option")
      .contains("US West (N. California)")
      .wait(500)
      .click();

    cy.get(pluginSelectors.amazonsesAccesKey).click().type(Accesskey);

    fillDataSourceTextField(
      awsTextractText.labelSecretKey,
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

    // Verifying analyze document operation
    cy.get(pluginSelectors.operationDropdown)
      .click()
      .wait(500)
      .type("Analyze Document{enter}");

    cy.wait(500);

    cy.get(awsTextractSelectors.documentInputField).clearAndTypeOnCodeMirror(
      awsTextractText.documentName
    );

    cy.wait(500);

    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      `Query (${data.dsName}) completed.`
    );
    // Verifying Analyze document stored in AWS S3 operation

    cy.get(pluginSelectors.operationDropdown)
      .click()
      .wait(500)
      .type("Analyze document stored in AWS S3{enter}");

    cy.wait(500);

    cy.get(awsTextractSelectors.bucketNameInputField).clearAndTypeOnCodeMirror(
      awsTextractText.bucketName
    );

    cy.get(awsTextractSelectors.keyNameInputField).clearAndTypeOnCodeMirror(
      awsTextractText.keyName
    );

    cy.wait(500);

    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      `Query (${data.dsName}) completed.`
    );
    deleteAppandDatasourceAfterExecution(
      data.dsName,
      `cypress-${data.dsName}-aws-textract`
    );
    cy.uninstallMarketplacePlugin("AWS Textract");
  });
});
