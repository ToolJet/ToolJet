import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { commonWidgetText, commonText } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { deleteDatasource, closeDSModal } from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import { sqlServerSelector } from "Selectors/sqlServer";
import { sqlServerText } from "Texts/sqlServer";

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

describe("Data sources SQL server connection and query", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Should verify elements on connection form with validation", () => {
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
      `cypress-${data.dataSourceName}-sql-server`,
      "mssql",
      [
        { key: "host", value: "localhost" },
        { key: "instanceName", value: "" },
        { key: "port", value: 1433 },
        { key: "database", value: "" },
        { key: "username", value: "" },
        { key: "password", value: "", encrypted: true },
        { key: "azure", value: false, encrypted: false },
      ]
    );
    cy.reload();
    cy.get(`[data-cy="cypress-${data.dataSourceName}-sql-server-button"]`)
      .should("be.visible")
      .click();
    cy.get(dataSourceSelector.dsNameInputField).should(
      "have.value",
      `cypress-${data.dataSourceName}-sql-server`
    );

    const requiredFields = [
      postgreSqlText.labelHost,
      postgreSqlText.labelPort,
      postgreSqlText.labelDbName,
      postgreSqlText.labelUserName,
      postgreSqlText.labelPassword,
    ];
    const sections = [
      postgreSqlText.labelHost,
      postgreSqlText.labelPort,
      postgreSqlText.labelDbName,
      postgreSqlText.labelUserName,
      postgreSqlText.labelPassword,
      postgreSqlText.labelConnectionOptions,
    ];
    sections.forEach((section) => {
      if (section === postgreSqlText.labelConnectionOptions) {
        cy.get(dataSourceSelector.keyInputField(section, 0)).should(
          "be.visible"
        );
        cy.get(dataSourceSelector.valueInputField(section, 0)).should(
          "be.visible"
        );
        cy.get(dataSourceSelector.deleteButton(section, 0)).should(
          "be.visible"
        );
        cy.get(dataSourceSelector.addMoreButton(section)).should("be.visible");
      } else if (requiredFields.includes(section)) {
        cy.get(dataSourceSelector.labelFieldName(section)).verifyVisibleElement(
          "have.text",
          `${section}*`
        );
        cy.get(dataSourceSelector.textField(section)).should("be.visible");
        if (section === postgreSqlText.labelPassword) {
          cy.get(
            dataSourceSelector.button(postgreSqlText.editButtonText)
          ).click();
          cy.verifyRequiredFieldValidation(section, "rgb(215, 45, 57)");
        } else {
          cy.get(dataSourceSelector.textField(section)).click();
          cy.get(commonSelectors.textField(section)).should(
            "have.css",
            "border-color",
            "rgba(0, 0, 0, 0)"
          );
          cy.get(dataSourceSelector.textField(section))
            .type("123")
            .clear()
            .blur();
          cy.verifyRequiredFieldValidation(section, "rgb(215, 45, 57)");
        }
      } else {
        cy.get(dataSourceSelector.labelFieldName(section)).verifyVisibleElement(
          "have.text",
          section
        );
        cy.get(dataSourceSelector.textField(section)).should("be.visible");
      }
    });

    cy.get(sqlServerSelector.labelInstance).verifyVisibleElement(
      "have.text",
      sqlServerText.labelInstance
    );
    cy.get(sqlServerSelector.labelAzureEncryptConnection).verifyVisibleElement(
      "have.text",
      sqlServerText.labelAzureEncryptConnection
    );

    cy.get(postgreSqlSelector.labelSsl).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelSSL
    );
    cy.get(postgreSqlSelector.sslToggleInput).should("be.visible");
    cy.get(postgreSqlSelector.labelSSLCertificate).verifyVisibleElement(
      "have.text",
      postgreSqlText.sslCertificate
    );
    cy.get(dataSourceSelector.toggleInput(sqlServerText.azureText)).should(
      "be.visible"
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
    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .and("be.disabled");
    //verifyCouldnotConnectWithAlert(mySqlText.errorConnectionRefused);
    cy.get(dataSourceSelector.connectionAlertText).verifyVisibleElement(
      "have.text",
      "Failed to connect to localhost:1433 - Could not connect (sequence)"
    );
    deleteDatasource(`cypress-${data.dataSourceName}-sql-server`);
  });

  it("Should verify the functionality of SQL Server connection form.", () => {
    selectAndAddDataSource("databases", "SQL Server", data.dataSourceName);

    fillDataSourceTextField(
      postgreSqlText.labelHost,
      postgreSqlText.placeholderEnterHost,
      Cypress.env("sqlserver_host")
    );
    // fillDataSourceTextField(
    //   "Instance",
    //   "Enter the name of the database instance",
    //   Cypress.env("sqlserver_instance")
    // );
    fillDataSourceTextField(
      postgreSqlText.labelPort,
      postgreSqlText.placeholderEnterPort,
      "1433"
    );
    fillDataSourceTextField(
      "Database Name",
      postgreSqlText.placeholderNameOfDB,
      Cypress.env("sqlserver_db")
    );
    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      Cypress.env("sqlserver_user")
    );

    fillDataSourceTextField(
      postgreSqlText.labelPassword,
      "**************",
      Cypress.env("sqlserver_password")
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

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(
      `[data-cy="cypress-${data.dataSourceName}-sql-server-button"]`
    ).verifyVisibleElement(
      "have.text",
      `cypress-${data.dataSourceName}-sql-server`
    );
    deleteDatasource(`cypress-${data.dataSourceName}-sql-server`);
  });
});
