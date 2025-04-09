import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { pluginSelectors } from "Selectors/plugins";
import { postgreSqlText } from "Texts/postgreSql";
import { amazonSesText } from "Texts/amazonSes";
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

describe("Data source amazon ses", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.defaultWorkspaceLogin();
    cy.intercept("POST", "/api/data_queries").as("createQuery");
  });

  it("Should verify elements on amazonses connection form", () => {
    const Accesskey = Cypress.env("amazonSes_accessKey");
    const Secretkey = Cypress.env("amazonSes_secretKey");

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

    selectAndAddDataSource("databases", amazonSesText.AmazonSES, data.dsName);

    cy.get(".react-select__dropdown-indicator").eq(1).click();
    cy.get(".react-select__option").contains("US West (N. California)").click();

    cy.get(pluginSelectors.amazonsesAccesKey).click().type(Accesskey);

    fillDataSourceTextField(
      amazonSesText.labelSecretKey,
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

    deleteDatasource(`cypress-${data.dsName}-Amazon-ses`);
  });

  it("Should verify the functionality of amazonses connection form.", () => {
    selectAndAddDataSource("databases", amazonSesText.AmazonSES, data.dsName);

    cy.get(".react-select__dropdown-indicator").eq(1).click();
    cy.get(".react-select__option").contains("US West (N. California)").click();

    fillDataSourceTextField(
      amazonSesText.labelAccesskey,
      amazonSesText.placeholderAccessKey,
      Cypress.env("amazonSes_accessKey")
    );
    fillDataSourceTextField(
      amazonSesText.labelSecretKey,
      amazonSesText.placeholderSecretKey,
      Cypress.env("amazonSes_secretKey")
    );

    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(
      `[data-cy="cypress-${data.dsName}-amazon-ses-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.dsName}-amazon-ses`);

    deleteDatasource(`cypress-${data.dsName}-amazon-ses`);
  });

  it("Should able to run the query with valid conection", () => {
    const email = "adish" + "@" + "tooljet.com";
    selectAndAddDataSource("databases", amazonSesText.AmazonSES, data.dsName);

    cy.get(".react-select__dropdown-indicator").eq(1).click();
    cy.get(".react-select__option").contains("US West (N. California)").click();

    fillDataSourceTextField(
      amazonSesText.labelAccesskey,
      amazonSesText.placeholderAccessKey,
      Cypress.env("amazonSes_accessKey")
    );
    fillDataSourceTextField(
      amazonSesText.labelSecretKey,
      amazonSesText.placeholderSecretKey,
      Cypress.env("amazonSes_secretKey")
    );

    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(
      `[data-cy="cypress-${data.dsName}-amazon-ses-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.dsName}-amazon-ses`);
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

    cy.get(pluginSelectors.operationDropdown)
      .click()
      .type("Email service{enter}");

    cy.wait(500);

    cy.get(pluginSelectors.sendEmailInputField)
      .realClick()
      .realType('{{["', { force: true, delay: 0 })
      .realType("mekhla@tooljet.com", { force: true, delay: 0 });

    cy.get(pluginSelectors.ccEmailInputField)
      .realClick()
      .realType('{{["', { force: true, delay: 0 })
      .realType("mani@tooljet.com", { force: true, delay: 0 });

    cy.get(pluginSelectors.bccEmailInputField)
      .realClick()
      .realType('{{["', { force: true, delay: 0 })
      .realType("midhun@tooljet.com", { force: true, delay: 0 });

    cy.get(pluginSelectors.sendEmailFromInputField)
      .realClick()
      .realType("adish", { force: true, delay: 0 })
      .realType("@", { force: true, delay: 0 })
      .realType("tooljet.com", { force: true, delay: 0 });

    cy.get(pluginSelectors.emailSubjetInputField).clearAndTypeOnCodeMirror(
      "Testmail for amazon ses"
    );

    cy.get(pluginSelectors.emailbodyInputField).clearAndTypeOnCodeMirror(
      "Body text for amazon ses"
    );

    cy.wait(1000);

    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      `Query (${data.dsName}) completed.`
    );
    deleteAppandDatasourceAfterExecution(
      data.dsName,
      `cypress-${data.dsName}-amazon-ses`
    );
  });
});
