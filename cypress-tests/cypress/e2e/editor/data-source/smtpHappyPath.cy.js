import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import {
  fillDataSourceTextField,
  selectAndAddDataSource,
} from "Support/utils/postgreSql";
import { deleteDatasource, closeDSModal } from "Support/utils/dataSource";

const data = {};
data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data source SMTP", () => {
  beforeEach(() => {
    cy.appUILogin();
  });

  it("Should verify elements on  SMTP connection form", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();
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

    selectAndAddDataSource("apis", "SMTP", data.lastName);

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
    deleteDatasource(`cypress-${data.lastName}-smtp`);
  });

  it("Should verify the functionality of SMTP connection form.", () => {
    selectAndAddDataSource("apis", "SMTP", data.lastName);

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
      "Enter password",
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
      `[data-cy="cypress-${data.lastName}-smtp-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.lastName}-smtp`);
    deleteDatasource(`cypress-${data.lastName}-smtp`);
  });
});
