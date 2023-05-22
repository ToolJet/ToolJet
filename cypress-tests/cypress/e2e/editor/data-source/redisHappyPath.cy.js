import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { redisText } from "Texts/redis";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import {
  fillDataSourceTextField,
  selectDataSource,
} from "Support/utils/postgreSql";
import {
  verifyCouldnotConnectWithAlert,
  deleteDatasource,
  closeDSModal,
} from "Support/utils/dataSource";

const data = {};
data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data source Redis", () => {
  beforeEach(() => {
    cy.appUILogin();
  });

  it("Should verify elements on connecti Redison form", () => {
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

    cy.get(postgreSqlSelector.dataSourceSearchInputField).type(redisText.redis);
    cy.get("[data-cy*='data-source-']")
      .eq(1)
      .should("contain", redisText.redis);
    cy.get('[data-cy="data-source-redis"]').click();

    cy.get(postgreSqlSelector.dataSourceNameInputField).should(
      "have.value",
      redisText.redis
    );
    cy.get(postgreSqlSelector.labelHost).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelHost
    );
    fillDataSourceTextField(
      postgreSqlText.labelHost,
      postgreSqlText.placeholderEnterHost,
      "redis_host"
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
    cy.get(postgreSqlSelector.buttonSave).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonTextSave
    );
    cy.get('[data-cy="connection-alert-text"]').should(
      "have.text",
      redisText.errorMaxRetries
    );
  });
  it("Should verify the functionality of Redis connection form.", () => {
    selectDataSource(redisText.redis);

    cy.clearAndType(
      '[data-cy="data-source-name-input-filed"]',
      `cypress-${data.lastName}-redis`
    );

    fillDataSourceTextField(
      postgreSqlText.labelHost,
      postgreSqlText.placeholderEnterHost,
      Cypress.env("redis_host")
    );
    fillDataSourceTextField(
      postgreSqlText.labelPort,
      postgreSqlText.placeholderEnterPort,
      Cypress.env("redis_port")
    );

    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      "dev@tooljet.io"
    );
    cy.get(postgreSqlSelector.passwordTextField).type(
      Cypress.env("redis_password")
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get('[data-cy="connection-alert-text"]').should(
      "have.text",
      "WRONGPASS invalid username-password pair or user is disabled."
    );
    fillDataSourceTextField(
      postgreSqlText.labelHost,
      postgreSqlText.placeholderEnterHost,
      Cypress.env("redis_host")
    );
    fillDataSourceTextField(
      postgreSqlText.labelPort,
      postgreSqlText.placeholderEnterPort,
      "108299"
    );
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get('[data-cy="connection-alert-text"]').should(
      "have.text",
      redisText.errorPort
    );

    fillDataSourceTextField(
      postgreSqlText.labelPort,
      postgreSqlText.placeholderEnterPort,
      Cypress.env("redis_port")
    );
    cy.get(postgreSqlSelector.passwordTextField).type(
      `{selectAll}{backspace}"redis_password"`
    );
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get('[data-cy="connection-alert-text"]').should(
      "have.text",
      "WRONGPASS invalid username-password pair or user is disabled."
    );

    cy.get(postgreSqlSelector.passwordTextField).type(
      `{selectAll}{backspace}${Cypress.env("redis_password")}`
    );
    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      "redis"
    );
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get('[data-cy="connection-alert-text"]').should(
      "have.text",
      "WRONGPASS invalid username-password pair or user is disabled."
    );

    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      "{del}"
    );
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);
    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSAdded
    );

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(
      `[data-cy="cypress-${data.lastName}-redis-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.lastName}-redis`);

    deleteDatasource(`cypress-${data.lastName}-redis`);
  });
});
