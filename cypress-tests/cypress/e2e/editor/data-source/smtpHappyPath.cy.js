import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { commonSelectors } from "Selectors/common";
import {
  fillDataSourceTextField,
  selectDataSource,
} from "Support/utils/postgreSql";

describe("Data source SMTP", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
  });

  it("Should verify elements on  SMTP connection form", () => {
    cy.get(postgreSqlSelector.leftSidebarDatasourceButton).click();
    cy.get(postgreSqlSelector.labelDataSources).should(
      "have.text",
      postgreSqlText.labelDataSources
    );

    cy.get(postgreSqlSelector.addDatasourceLink)
      .should("have.text", postgreSqlText.labelAddDataSource)
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

    cy.get(postgreSqlSelector.dataSourceSearchInputField).type("SMTP");
    cy.get("[data-cy*='data-source-']").eq(0).should("contain", "SMTP");
    cy.get('[data-cy="data-source-smtp"]').click();

    cy.get(postgreSqlSelector.dataSourceNameInputField).should(
      "have.value",
      "SMTP"
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
    cy.get(postgreSqlSelector.dangerAlertNotSupportSSL).verifyVisibleElement(
      "have.text",
      "Invalid credentials"
    );
  });

  it("Should verify the functionality of SMTP connection form.", () => {
    selectDataSource("SMTP");

    cy.clearAndType(
      postgreSqlSelector.dataSourceNameInputField,
      "cypress-smtp"
    );

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

    cy.get(postgreSqlSelector.passwordTextField).type(
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
      postgreSqlText.toastDSAdded
    );

    cy.get(postgreSqlSelector.leftSidebarDatasourceButton).click();
    cy.get(postgreSqlSelector.datasourceLabelOnList)
      .should("have.text", "cypress-smtp")
      .should("be.visible");
  });
});
