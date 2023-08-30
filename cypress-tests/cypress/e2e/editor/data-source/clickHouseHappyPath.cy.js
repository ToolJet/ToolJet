import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { commonWidgetText } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { commonText } from "Texts/common";
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
data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data sources", () => {
  beforeEach(() => {
    cy.appUILogin();
  });

  it("Should verify elements on connection form", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();
    cy.get(commonSelectors.addNewDataSourceButton)
      .verifyVisibleElement("have.text", commonText.addNewDataSourceButton)
      .click();

    cy.get(postgreSqlSelector.allDatasourceLabelAndCount).should(
      "have.text",
      postgreSqlText.allDataSources
    );
    cy.get(postgreSqlSelector.databaseLabelAndCount).should(
      "have.text",
      postgreSqlText.allDatabase
    );
    cy.get(postgreSqlSelector.apiLabelAndCount).should(
      "have.text",
      postgreSqlText.allApis
    );
    cy.get(postgreSqlSelector.cloudStorageLabelAndCount).should(
      "have.text",
      postgreSqlText.allCloudStorage
    );

    cy.get(postgreSqlSelector.dataSourceSearchInputField).type("ClickHouse");
    cy.get("[data-cy*='data-source-']").eq(1).should("contain", "ClickHouse");
    cy.get('[data-cy="data-source-clickhouse"]').click();

    cy.get(postgreSqlSelector.dataSourceNameInputField).should(
      //username,password,host,port,protocol,dbname,usepost, trimquery,gzip,debug,raw
      "have.value",
      "ClickHouse"
    );
    cy.get(postgreSqlSelector.labelUserName).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelUserName
    );
    cy.get(postgreSqlSelector.labelPassword).verifyVisibleElement(
      "have.text",
      "Password"
    );
    cy.get(postgreSqlSelector.labelHost).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelHost
    );
    cy.get(postgreSqlSelector.labelPort).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelPort
    );

    cy.get(postgreSqlSelector.labelDbName).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelDbName
    );
    cy.get('[data-cy="label-protocol"]').verifyVisibleElement(
      "have.text",
      "Protocol"
    );
    cy.get('[data-cy="label-use-post"]').verifyVisibleElement(
      "have.text",
      "Use Post"
    );
    cy.get('[data-cy="label-trim-query"]').verifyVisibleElement(
      "have.text",
      "Trim Query"
    );
    cy.get('[data-cy="label-use-gzip"]').verifyVisibleElement(
      "have.text",
      "Use Gzip"
    );
    cy.get('[data-cy="label-debug"]').verifyVisibleElement(
      "have.text",
      "Debug"
    );
    cy.get('[data-cy="label-raw"]').verifyVisibleElement("have.text", "Raw");
    cy.get(postgreSqlSelector.labelIpWhitelist)
      .scrollIntoView()
      .verifyVisibleElement("have.text", postgreSqlText.whiteListIpText);
    cy.get(postgreSqlSelector.buttonCopyIp)
      .scrollIntoView()
      .verifyVisibleElement("have.text", postgreSqlText.textCopy);

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
    cy.get(postgreSqlSelector.connectionFailedText)
      .scrollIntoView()
      .verifyVisibleElement("have.text", postgreSqlText.couldNotConnect);
    cy.get(postgreSqlSelector.buttonSave).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonTextSave
    );
    cy.get('[data-cy="connection-alert-text"]', { timeout: 60000 })
      .scrollIntoView()
      .verifyVisibleElement("have.text", "getaddrinfo ENOTFOUND undefined");
  });

  it("Should verify the functionality of PostgreSQL connection form.", () => {
    selectAndAddDataSource("ClickHouse");

    cy.clearAndType(
      '[data-cy="data-source-name-input-filed"]',
      `cypress-${data.lastName}-clickhouse`
    );

    fillDataSourceTextField(
      postgreSqlText.labelHost,
      "localhost",
      Cypress.env("pg_host")
    );
    fillDataSourceTextField(postgreSqlText.labelPort, "8123", "8123");
    fillDataSourceTextField(
      postgreSqlText.labelDbName,
      "database name",
      "{del}"
    );
    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      Cypress.env("clickhouse_user")
    );

    cy.get(postgreSqlSelector.passwordTextField).type(
      Cypress.env("clickhouse_password")
    );
    cy.get(".react-select__input-container").click().type(`HTTP{enter}`);

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);
    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSAdded
    );

    cy.get(
      `[data-cy="cypress-${data.lastName}-clickhouse-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.lastName}-clickhouse`);
    deleteDatasource(`cypress-${data.lastName}-clickhouse`);
  });
});
