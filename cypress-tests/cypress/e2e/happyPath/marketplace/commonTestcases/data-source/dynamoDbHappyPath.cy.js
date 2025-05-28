import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { dynamoDbText } from "Texts/dynamodb";
import { commonSelectors } from "Selectors/common";
import { dataSourceSelector } from "Selectors/dataSource";

import {
  fillDataSourceTextField,
  selectAndAddDataSource,
} from "Support/utils/postgreSql";
import {
  closeDSModal,
  verifyCouldnotConnectWithAlert,
  deleteDatasource,
} from "Support/utils/dataSource";

const data = {};

describe("Data source DynamoDB", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Should verify elements on DynamoDB connection form", () => {
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
      `cypress-${data.dataSourceName}-dynamodb`,
      "dynamodb",
      [
        { key: "region", value: "" },
        { key: "access_key", value: "" },
        { key: "secret_key", value: "", encrypted: true },
        {
          key: "instance_metadata_credentials",
          value: "iam_access_keys",
          encrypted: false,
        },
      ]
    );
    cy.reload();
    cy.get(`[data-cy="cypress-${data.dataSourceName}-dynamodb-button"]`)
      .should("be.visible")
      .click();
    cy.get(dataSourceSelector.dsNameInputField).should(
      "have.value",
      `cypress-${data.dataSourceName}-dynamodb`
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
    cy.get(dataSourceSelector.connectionAlertText).verifyVisibleElement(
      "have.text",
      dynamoDbText.errorMissingRegion
    );
    deleteDatasource(`cypress-${data.dataSourceName}-dynamodb`);
  });

  it("Should verify the functionality of DynamoDB connection form.", () => {
    selectAndAddDataSource(
      "databases",
      dynamoDbText.dynamoDb,
      data.dataSourceName
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
      postgreSqlText.toastDSSaved
    );

    cy.get(
      `[data-cy="cypress-${data.dataSourceName}-dynamodb-button"]`
    ).verifyVisibleElement(
      "have.text",
      `cypress-${data.dataSourceName}-dynamodb`
    );

    deleteDatasource(`cypress-${data.dataSourceName}-dynamodb`);
  });
});
