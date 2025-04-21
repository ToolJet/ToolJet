import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { commonSelectors } from "Selectors/common";
import { dataSourceSelector } from "Selectors/dataSource";
import {
  fillDataSourceTextField,
  selectAndAddDataSource,
} from "Support/utils/postgreSql";
import { deleteDatasource, closeDSModal } from "Support/utils/dataSource";

const data = {};

describe("Data source SMTP", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.defaultWorkspaceLogin();
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Should verify elements on  SMTP connection form", () => {
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
      `cypress-${data.dataSourceName}-smtp`,
      "smtp",
      [
        { key: "host", value: "localhost", encrypted: false },
        { key: "port", value: 465, encrypted: false },
        { key: "user", value: "", encrypted: false },
        { key: "password", value: "", encrypted: true },
      ]
    );
    cy.reload();
    cy.get(`[data-cy="cypress-${data.dataSourceName}-smtp-button"]`)
      .should("be.visible")
      .click();
    cy.get(dataSourceSelector.dsNameInputField).should(
      "have.value",
      `cypress-${data.dataSourceName}-smtp`
    );

    cy.get(postgreSqlSelector.labelHost).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelHost
    );
    cy.get(postgreSqlSelector.labelPort).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelPort
    );
    cy.get('[data-cy="label-user"]').verifyVisibleElement("have.text", "User");
    cy.get(postgreSqlSelector.labelPassword).verifyVisibleElement(
      "have.text",
      "Password"
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
    cy.get('[data-cy="connection-alert-text"]').should(
      "have.text",
      "Invalid credentials"
    );
    deleteDatasource(`cypress-${data.dataSourceName}-smtp`);
  });

  it("Should verify the functionality of SMTP connection form.", () => {
    selectAndAddDataSource("apis", "SMTP", data.dataSourceName);

    fillDataSourceTextField(
      postgreSqlText.labelHost,
      postgreSqlText.placeholderEnterHost,
      Cypress.env("smtp_host")
    );
    fillDataSourceTextField(
      postgreSqlText.labelPort,
      "Recommended port 465 (Secured)",
      Cypress.env("smtp_port")
    );

    fillDataSourceTextField(
      "User",
      postgreSqlText.placeholderEnterUserName,
      Cypress.env("smtp_user")
    );

    fillDataSourceTextField(
      postgreSqlText.labelPassword,
      "**************",
      Cypress.env("smtp_password")
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 20000,
    }).should("have.text", postgreSqlText.labelConnectionVerified, {
      timeout: 10000,
    });
    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(
      `[data-cy="cypress-${data.dataSourceName}-smtp-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.dataSourceName}-smtp`);
    deleteDatasource(`cypress-${data.dataSourceName}-smtp`);
  });
});
