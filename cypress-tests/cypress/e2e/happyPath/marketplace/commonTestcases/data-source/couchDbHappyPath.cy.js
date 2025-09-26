import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { commonWidgetText } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { dataSourceSelector } from "Selectors/dataSource";
import { closeDSModal, deleteDatasource } from "Support/utils/dataSource";

import {
  addQuery,
  fillDataSourceTextField,
  fillConnectionForm,
  selectAndAddDataSource,
  openQueryEditor,
  selectQueryMode,
  addGuiQuery,
  addWidgetsToAddUser,
} from "Support/utils/postgreSql";

const data = {};

describe("Data sources", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Should verify elements on CouchDB connection form", () => {
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

    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dataSourceName}-couchdb`,
      "couchdb",
      [
        { key: "username", value: "", encrypted: false },
        { key: "password", value: "", encrypted: true },
        { key: "database", value: "" },
        { key: "port", value: "5984" },
        { key: "host", value: "" },
        { key: "protocol" },
      ]
    );
    cy.reload();
    cy.get(`[data-cy="cypress-${data.dataSourceName}-couchdb-button"]`)
      .should("be.visible")
      .click();
    cy.get(dataSourceSelector.dsNameInputField).should(
      "have.value",
      `cypress-${data.dataSourceName}-couchdb`
    );

    cy.get(postgreSqlSelector.labelHost).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelHost
    );
    cy.get(postgreSqlSelector.labelPort).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelPort
    );
    cy.get(postgreSqlSelector.labelUserName).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelUserName
    );
    cy.get(postgreSqlSelector.labelPassword).verifyVisibleElement(
      "have.text",
      "Password"
    );
    cy.get(postgreSqlSelector.labelDbName).verifyVisibleElement(
      "have.text",
      "Database Name"
    );

    cy.get('[data-cy="label-protocol"]').verifyVisibleElement(
      "have.text",
      "Protocol"
    );
    cy.get(postgreSqlSelector.labelIpWhitelist).verifyVisibleElement(
      "have.text",
      postgreSqlText.whiteListIpText
    );
    cy.get(postgreSqlSelector.buttonCopyIp).verifyVisibleElement(
      "have.text",
      postgreSqlText.textCopy
    );

    cy.get(postgreSqlSelector.linkReadDocumentation).verifyVisibleElement(
      "have.text",
      postgreSqlText.readDocumentation
    );
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
    cy.get(postgreSqlSelector.buttonSave).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonTextSave
    );
    cy.get(dataSourceSelector.connectionAlertText).verifyVisibleElement(
      "have.text",
      "Invalid URL"
    );
    deleteDatasource(`cypress-${data.dataSourceName}-couchdb`);
  });

  it("Should verify the functionality of CouchDB connection form.", () => {
    selectAndAddDataSource("databases", "CouchDB", data.dataSourceName);

    fillDataSourceTextField(
      postgreSqlText.labelHost,
      "",
      Cypress.env("couchdb_host")
    );
    fillDataSourceTextField(postgreSqlText.labelPort, "5984 ", "5984");
    fillDataSourceTextField("Database Name", "database name", "{del}");
    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      "username for couchDB",
      Cypress.env("couchdb_user")
    );
    cy.get(".react-select__input-container").type("HTTP{enter}");
    cy.get(".datasource-edit-btn").should("be.visible").click();
    cy.get(postgreSqlSelector.passwordTextField).type(
      Cypress.env("couchdb_password"),
      { log: false }
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);
    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    cy.get(
      `[data-cy="cypress-${data.dataSourceName}-couchdb-button"]`
    ).verifyVisibleElement(
      "have.text",
      `cypress-${data.dataSourceName}-couchdb`
    );
    deleteDatasource(`cypress-${data.dataSourceName}-couchdb`);
  });
});
