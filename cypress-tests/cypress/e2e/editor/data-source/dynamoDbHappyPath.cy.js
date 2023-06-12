import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { dynamoDbText } from "Texts/dynamodb";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";

import {
  fillDataSourceTextField,
  selectDataSource,
} from "Support/utils/postgreSql";
import {
  closeDSModal,
  verifyCouldnotConnectWithAlert,
  deleteDatasource,
} from "Support/utils/dataSource";

const data = {};
data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data source DynamoDB", () => {
  beforeEach(() => {
    cy.appUILogin();
  });

  it("Should verify elements on DynamoDB connection form", () => {
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

    cy.get(postgreSqlSelector.dataSourceSearchInputField).type(
      dynamoDbText.dynamoDb
    );
    cy.get("[data-cy*='data-source-']")
      .eq(1)
      .should("contain", dynamoDbText.dynamoDb);
    cy.get('[data-cy="data-source-dynamodb"]').click();

    cy.get(postgreSqlSelector.dataSourceNameInputField).should(
      "have.value",
      dynamoDbText.dynamoDb
    );
    cy.get('[data-cy="label-region"]').verifyVisibleElement(
      "have.text",
      dynamoDbText.region
    );
    cy.get('[data-cy="label-access-key"]').verifyVisibleElement(
      "have.text",
      dynamoDbText.accessKey
    );
    cy.get('[data-cy="label-secret-key"]').verifyVisibleElement(
      "have.text",
      dynamoDbText.secretKey
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
    cy.get('[data-cy="connection-alert-text"]').verifyVisibleElement(
      "have.text",
      dynamoDbText.errorMissingRegion
    );
  });

  it("Should verify the functionality of DynamoDB connection form.", () => {
    selectDataSource(dynamoDbText.dynamoDb);

    cy.clearAndType(
      postgreSqlSelector.dataSourceNameInputField,
      `cypress-${data.lastName}-dynamodb`
    );

    cy.get('[data-cy="label-region"]')
      .parent()
      .next()
      .find("input")
      .type(`N. california{enter}`);
    fillDataSourceTextField(
      dynamoDbText.accessKey,
      dynamoDbText.placeHolderAccessKey,
      "dynamodb_access_key"
    );
    fillDataSourceTextField(
      dynamoDbText.secretKey,
      dynamoDbText.placeholderSecretKey,
      Cypress.env("dynamodb_secret_key")
    );
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    verifyCouldnotConnectWithAlert(dynamoDbText.errorInvalidToken);

    fillDataSourceTextField(
      dynamoDbText.accessKey,
      dynamoDbText.placeHolderAccessKey,
      Cypress.env("dynamodb_access_key")
    );
    fillDataSourceTextField(
      dynamoDbText.secretKey,
      dynamoDbText.placeholderSecretKey,
      "dynamodb_secret_key"
    );
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    verifyCouldnotConnectWithAlert(dynamoDbText.errorSignatureMissmatch);

    fillDataSourceTextField(
      dynamoDbText.secretKey,
      dynamoDbText.placeholderSecretKey,
      Cypress.env("dynamodb_secret_key")
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified, {
      timeout: 10000,
    });
    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSAdded
    );

    cy.get(
      `[data-cy="cypress-${data.lastName}-dynamodb-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.lastName}-dynamodb`);

    deleteDatasource(`cypress-${data.lastName}-dynamodb`);
  });
});
