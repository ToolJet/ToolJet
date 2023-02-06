import { postgreSqlSelector } from "Selectors/postgreSql";
import { s3Selector } from "Selectors/awss3";
import { postgreSqlText } from "Texts/postgreSql";
import { s3Text } from "Texts/awss3";
import { commonSelectors } from "Selectors/common";
import {
  fillDataSourceTextField,
  selectDataSource,
} from "Support/utils/postgreSql";
import { verifyCouldnotConnectWithAlert } from "Support/utils/dataSource";
describe("Data sources AWS S3", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
  });

  it("Should verify elements on AWS S3 connection form", () => {
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

    cy.get(postgreSqlSelector.dataSourceSearchInputField).type(s3Text.awsS3);
    cy.get("[data-cy*='data-source-']").eq(0).should("contain", s3Text.awsS3);
    cy.get(s3Selector.awsDatasource).click();

    cy.get(postgreSqlSelector.dataSourceNameInputField).should(
      "have.value",
      s3Text.awsS3
    );
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
    verifyCouldnotConnectWithAlert(s3Text.alertRegionIsMissing);
  });

  it("Should verify the functionality of AWS S3 connection form.", () => {
    selectDataSource(s3Text.awsS3);

    cy.clearAndType(s3Selector.dataSourceNameInput, s3Text.cypressAwsS3);

    fillDataSourceTextField(
      s3Text.accessKey,
      s3Text.placeholderEnterAccessKey,
      Cypress.env("aws_access")
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    verifyCouldnotConnectWithAlert(s3Text.alertRegionIsMissing);

    fillDataSourceTextField(
      "Secret key",
      s3Text.placeholderEnterSecretKey,
      Cypress.env("aws_secret"),
      "contain"
    );

    cy.get(s3Selector.regionLabel)
      .next()
      .find("input")
      .type(`${s3Text.region}{enter}`);

    cy.get(s3Selector.customEndpointLabel)
      .verifyVisibleElement("have.text", s3Text.customEndpoint)
      .next()
      .find("input")
      .click();

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    verifyCouldnotConnectWithAlert(s3Text.alertInvalidUrl);
    cy.get(s3Selector.customEndpointLabel)
      .verifyVisibleElement("have.text", s3Text.customEndpoint)
      .next()
      .find("input")
      .click();

    fillDataSourceTextField(
      s3Text.accessKey,
      s3Text.placeholderEnterAccessKey,
      "aws_access"
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    verifyCouldnotConnectWithAlert(s3Text.accessKeyError);

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

    verifyCouldnotConnectWithAlert(s3Text.sinatureError);
    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSAdded
    );

    cy.get(postgreSqlSelector.leftSidebarDatasourceButton).click();
    cy.get(postgreSqlSelector.datasourceLabelOnList)
      .should("have.text", s3Text.cypressAwsS3)
      .find("button")
      .should("be.visible");
  });
});
