import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { minioText } from "Texts/minio";
import { harperDbText } from "Texts/harperDb";
import { harperDbSelectors } from "Selectors/Plugins";
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

import { openQueryEditor } from "Support/utils/dataSource";
import { dataSourceSelector } from "../../../../../constants/selectors/dataSource";

const data = {};
data.dsName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.dsName1 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data source HarperDB", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.defaultWorkspaceLogin();
  });

  it("Should verify elements on HarperDB connection form", () => {
    const Host = Cypress.env("harperdb_host");
    const Port = Cypress.env("harperdb_port");
    const Username = Cypress.env("harperdb_username");
    const Password = Cypress.env("harperdb_password");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    cy.get(postgreSqlSelector.commonlyUsedLabelAndCount).should(
      "have.text",
      postgreSqlText.commonlyUsed
    );

    cy.get(postgreSqlSelector.apiLabelAndCount).should(
      "have.text",
      postgreSqlText.allApis
    );

    cy.get(postgreSqlSelector.cloudStorageLabelAndCount).should(
      "have.text",
      postgreSqlText.allCloudStorage
    );

    cy.installMarketplacePlugin("HarperDB");

    selectAndAddDataSource("databases", harperDbText.harperDb, data.dsName);

    fillDataSourceTextField(
      harperDbText.hostLabel,
      harperDbText.hostInputPlaceholder,
      Host
    );

    fillDataSourceTextField(
      harperDbText.portLabel,
      harperDbText.portPlaceholder,
      Port
    );

    fillDataSourceTextField(
      harperDbText.userNameLabel,
      harperDbText.userNamePlaceholder,
      Username
    );

    fillDataSourceTextField(
      harperDbText.passwordlabel,
      harperDbText.passwordPlaceholder,
      Password
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    deleteDatasource(`cypress-${data.dsName}-HarperDB`);
  });

  it("Should verify functionality of HarperDB connection form", () => {
    const Host = Cypress.env("harperdb_host");
    const Port = Cypress.env("harperdb_port");
    const Username = Cypress.env("harperdb_username");
    const Password = Cypress.env("harperdb_password");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();
    cy.installMarketplacePlugin("HarperDB");
    selectAndAddDataSource("databases", harperDbText.harperDb, data.dsName);

    fillDataSourceTextField(
      harperDbText.hostLabel,
      harperDbText.hostInputPlaceholder,
      Host
    );

    fillDataSourceTextField(
      harperDbText.portLabel,
      harperDbText.portPlaceholder,
      Port
    );

    fillDataSourceTextField(
      harperDbText.userNameLabel,
      harperDbText.userNamePlaceholder,
      Username
    );

    fillDataSourceTextField(
      harperDbText.passwordlabel,
      harperDbText.passwordPlaceholder,
      Password
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    deleteDatasource(`cypress-${data.dsName}-HarperDB`);
  });

  it("Should be able to run the query with a valid connection", () => {
    const Host = Cypress.env("harperdb_host");
    const Port = Cypress.env("harperdb_port");
    const Username = Cypress.env("harperdb_username");
    const Password = Cypress.env("harperdb_password");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    cy.installMarketplacePlugin("HarperDB");

    selectAndAddDataSource("databases", harperDbText.harperDb, data.dsName);

    fillDataSourceTextField(
      harperDbText.hostLabel,
      harperDbText.hostInputPlaceholder,
      Host
    );

    fillDataSourceTextField(
      harperDbText.portLabel,
      harperDbText.portPlaceholder,
      Port
    );

    fillDataSourceTextField(
      harperDbText.userNameLabel,
      harperDbText.userNamePlaceholder,
      Username
    );

    fillDataSourceTextField(
      harperDbText.passwordlabel,
      harperDbText.passwordPlaceholder,
      Password
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);

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

    // Verifying NoSQL Operation

    cy.get(".react-select__input")
      .eq(1)
      .click({ force: true })
      .wait(500)
      .type(`NoSQL mode{enter}`, { force: true });

    const operationsDB = [
      "Insert",
      "Update",
      "Search By Hash",
      "Search By Value",
      "Search By Condition",
      "Delete",
    ];

    operationsDB.forEach((operation) => {
      cy.get(".react-select__input")
        .eq(2)
        .click({ force: true })
        .wait(500)
        .type(`${operation}{enter}`, { force: true });

      const commonFields = {
        "schema-input-field": harperDbText.schemaValue,
        "table-input-field": harperDbText.tableValue,
      };

      Object.entries(commonFields).forEach(([field, value]) => {
        cy.get(`[data-cy="${field}"]`).clearAndTypeOnCodeMirror(value);
      });

      if (["Insert", "Update"].includes(operation)) {
        cy.get(harperDbSelectors.recordsInputField).clearAndTypeOnCodeMirror(
          harperDbText.recordsValue
        );
      }

      if (operation === "Search By Hash") {
        cy.get(harperDbSelectors.hashValueInputField).clearAndTypeOnCodeMirror(
          harperDbText.hashValue
        );
        cy.get(harperDbSelectors.attributesInputField).clearAndTypeOnCodeMirror(
          harperDbText.attributesValue
        );
      }

      if (operation === "Search By Value") {
        cy.get(
          harperDbSelectors.searchAttributeInputField
        ).clearAndTypeOnCodeMirror(harperDbText.searchAttributeValue);

        cy.get(
          harperDbSelectors.searchValueInputField
        ).clearAndTypeOnCodeMirror(harperDbText.searchValue);
        cy.get(harperDbSelectors.attributesInputField).clearAndTypeOnCodeMirror(
          harperDbText.attributesValue
        );
      }

      if (operation === "Search By Condition") {
        cy.get(".react-select__input")
          .eq(3)
          .click({ force: true })
          .wait(500)
          .type("Or{enter}", { force: true });

        cy.get(harperDbSelectors.attributesInputField).clearAndTypeOnCodeMirror(
          harperDbText.attributesValue
        );
        cy.get(harperDbSelectors.conditionInputField).clearAndTypeOnCodeMirror(
          harperDbText.condtionValue
        );
      }

      if (operation === "Delete") {
        cy.get(harperDbSelectors.hashValueInputField).clearAndTypeOnCodeMirror(
          harperDbText.hashValue
        );
      }

      cy.get(dataSourceSelector.queryPreviewButton).click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        `Query (${data.dsName}) completed.`
      );
    });

    // Verifying SQL Operation
    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get(".css-4e90k9").type(`${data.dsName}`);
    cy.contains(`[id*="react-select-"]`, data.dsName).click();
    cy.get('[data-cy="query-rename-input"]').clear().type(data.dsName1);

    cy.get(".react-select__input")
      .eq(1)
      .should("be.visible")
      .click({ force: true })
      .wait(500)
      .type(`SQL mode{enter}`, { force: true });

    cy.wait(1000);

    cy.get(harperDbSelectors.sqlQueryInputField).clearAndTypeOnCodeMirror(
      harperDbText.sqlValue
    );

    cy.get(dataSourceSelector.queryPreviewButton).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      `Query (${data.dsName1}) completed.`
    );
  });
});
