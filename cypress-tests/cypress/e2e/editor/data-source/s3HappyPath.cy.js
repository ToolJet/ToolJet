import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { s3Selector } from "Selectors/awss3";
import { postgreSqlText } from "Texts/postgreSql";
import { s3Text } from "Texts/awss3";
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
} from "Support/utils/dataSource";

const data = {};
data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data sources AWS S3", () => {
  beforeEach(() => {
    cy.appUILogin();
  });

  it("Should verify elements on AWS S3 connection form", () => {
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

    selectAndAddDataSource("cloudstorage", s3Text.awsS3, data.lastName);
    cy.get(s3Selector.accessKeyLabel).verifyVisibleElement(
      "have.text",
      s3Text.accessKey
    );
    cy.get(s3Selector.secretKeyLabel).verifyVisibleElement(
      "have.text",
      s3Text.secretKey
    );
    cy.get(s3Selector.regionLabel).verifyVisibleElement(
      "have.text",
      s3Text.labelRegion
    );
    cy.get(s3Selector.customEndpointLabel)
      .verifyVisibleElement("have.text", s3Text.customEndpoint)
      .parent()
      .next()
      .find("input")
      .click();

    cy.get(s3Selector.customEndpointInput).should("be.visible");

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
      s3Text.alertRegionIsMissing
    );
    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );
    deleteDatasource(`cypress-${data.lastName}-aws-s3`);
  });

  it("Should verify the functionality of AWS S3 connection form.", () => {
    selectAndAddDataSource("cloudstorage", s3Text.awsS3, data.lastName);

    fillDataSourceTextField(
      s3Text.accessKey,
      s3Text.placeholderEnterAccessKey,
      Cypress.env("aws_access")
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get('[data-cy="connection-alert-text"]').should(
      "have.text",
      s3Text.alertRegionIsMissing
    );

    fillDataSourceTextField(
      "Secret key",
      s3Text.placeholderEnterSecretKey,
      Cypress.env("aws_secret"),
      "contain"
    );

    cy.get(s3Selector.regionLabel)
      .parent()
      .next()
      .find("input")
      .type(`${s3Text.region}{enter}`);

    cy.get(s3Selector.customEndpointLabel)
      .verifyVisibleElement("have.text", s3Text.customEndpoint)
      .parent()
      .next()
      .find("input")
      .click();

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get('[data-cy="connection-alert-text"]').should(
      "have.text",
      s3Text.alertInvalidUrl
    );
    cy.get(s3Selector.customEndpointLabel)
      .verifyVisibleElement("have.text", s3Text.customEndpoint)
      .parent()
      .next()
      .find("input")
      .click();

    fillDataSourceTextField(
      s3Text.accessKey,
      s3Text.placeholderEnterAccessKey,
      "aws_access"
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get('[data-cy="connection-alert-text"]').should(
      "have.text",
      s3Text.accessKeyError
    );

    fillDataSourceTextField(
      s3Text.accessKey,
      s3Text.placeholderEnterAccessKey,
      Cypress.env("aws_access")
    );
    fillDataSourceTextField(
      "Secret key",
      s3Text.placeholderEnterSecretKey,
      "aws_secret",
      "contain"
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();

    cy.get('[data-cy="connection-alert-text"]').should(
      "have.text",
      s3Text.sinatureError
    );
    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(
      `[data-cy="cypress-${data.lastName}-aws-s3-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.lastName}-aws-s3`);
    deleteDatasource(`cypress-${data.lastName}-aws-s3`);
  });
});
