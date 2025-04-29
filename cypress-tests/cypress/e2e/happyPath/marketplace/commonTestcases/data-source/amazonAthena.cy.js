import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { pluginSelectors } from "Selectors/plugins";
import { postgreSqlText } from "Texts/postgreSql";
import { amazonSesText } from "Texts/amazonSes";
import { amazonAthenaText } from "Texts/amazonAthena";
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

describe("Data source amazon athena", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
  });

  it("Should verify elements on amazon athena connection form", () => {
    const Accesskey = Cypress.env("amazonathena_accessKey");
    const Secretkey = Cypress.env("amazonathena_secretKey");
    const DbName = Cypress.env("amazonathena_DbName");

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

    selectAndAddDataSource(
      "databases",
      amazonAthenaText.AmazonAthena,
      data.dsName
    );

    cy.get(pluginSelectors.amazonAthenaDbName).click().type(DbName);

    cy.get(pluginSelectors.amazonsesAccesKey).click().type(" ");

    fillDataSourceTextField(
      amazonSesText.labelSecretKey,
      amazonAthenaText.placeholderSecretKey,
      Secretkey
    );

    cy.get(".react-select__dropdown-indicator").eq(1).click();
    cy.get(".react-select__option").contains("US West (N. California)").click();

    cy.get(postgreSqlSelector.buttonTestConnection)
      .verifyVisibleElement(
        "have.text",
        postgreSqlText.buttonTextTestConnection
      )
      .click();
    cy.get(postgreSqlSelector.connectionFailedText).verifyVisibleElement(
      "have.text",
      postgreSqlText.couldNotConnect
    );
    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    deleteDatasource(`cypress-${data.dsName}-Amazon-Athena`);
  });

  it("Should verify the functionality of amazon athena connection form.", () => {
    const Accesskey = Cypress.env("amazonathena_accessKey");
    const Secretkey = Cypress.env("amazonathena_secretKey");
    const DbName = Cypress.env("amazonathena_DbName");
    selectAndAddDataSource(
      "databases",
      amazonAthenaText.AmazonAthena,
      data.dsName
    );

    cy.get(pluginSelectors.amazonAthenaDbName).click().type(DbName);

    cy.get(pluginSelectors.amazonsesAccesKey).click().type(Accesskey);

    fillDataSourceTextField(
      amazonSesText.labelSecretKey,
      amazonAthenaText.placeholderSecretKey,
      Secretkey
    );

    cy.get(".react-select__dropdown-indicator").eq(1).click();
    cy.get(".react-select__option").contains("US West (N. California)").click();

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);
    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    deleteDatasource(`cypress-${data.dsName}-amazon-Athena`);
  });

  it("Should able to run the query with valid conection", () => {
    const Accesskey = Cypress.env("amazonathena_accessKey");
    const Secretkey = Cypress.env("amazonathena_secretKey");
    const DbName = Cypress.env("amazonathena_DbName");
    selectAndAddDataSource(
      "databases",
      amazonAthenaText.AmazonAthena,
      data.dsName
    );

    cy.get(pluginSelectors.amazonAthenaDbName).click().type(DbName);

    fillDataSourceTextField(
      amazonAthenaText.labelAccesskey,
      amazonAthenaText.placeholderEnteraAccessKey,
      Cypress.env("amazonathena_accessKey")
    );
    fillDataSourceTextField(
      amazonAthenaText.labelSecretKey,
      amazonAthenaText.placeholderSecretKey,
      Cypress.env("amazonathena_secretKey")
    );

    cy.get(".react-select__dropdown-indicator").eq(1).click();
    cy.get(".react-select__option").contains("US West (N. California)").click();

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);

    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(
      `[data-cy="cypress-${data.dsName}-amazon-athena-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.dsName}-amazon-athena`);
    cy.wait(1000);

    cy.get(commonSelectors.dashboardIcon).click();
    cy.get(commonSelectors.appCreateButton).click();
    cy.get(commonSelectors.appNameInput).click().type(data.dsName);
    cy.get(commonSelectors.createAppButton).click();
    cy.skipWalkthrough();

    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get(".css-4e90k9").type(`${data.dsName}`);
    cy.contains(`[id*="react-select-"]`, data.dsName).click();
    cy.get('[data-cy="query-rename-input"]').clear().type(data.dsName);
    cy.get(`[data-cy="list-query-${data.dsName}"]`).should("be.visible");
    cy.get('[data-cy="query-input-field"]').clearAndTypeOnCodeMirror(
      "SHOW DATABASES;"
    );
    cy.get(
      '[data-cy="query-input-field"] >>> .cm-editor >> .cm-content > .cm-line'
    ).should("have.text", "SHOW DATABASES;");
    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      `Query (${data.dsName}) completed.`
    );
    deleteAppandDatasourceAfterExecution(
      data.dsName,
      `cypress-${data.dsName}-amazon-Athena`
    );
  });
});
