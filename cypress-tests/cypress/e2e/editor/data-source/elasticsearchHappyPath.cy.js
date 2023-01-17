import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { elasticsearchText } from "Texts/elasticsearch";
import { commonSelectors } from "Selectors/common";
import {
  fillDataSourceTextField,
  selectDataSource,
} from "Support/utils/postgreSql";
import { verifyCouldnotConnectWithAlert } from "Support/utils/dataSource";

describe("Data source Elasticsearch", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
  });

  it("Should verify elements on Elasticsearch connection form", () => {
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

    cy.get(postgreSqlSelector.dataSourceSearchInputField).type(
      elasticsearchText.elasticSearch
    );
    cy.get("[data-cy*='data-source-']")
      .eq(0)
      .should("contain", elasticsearchText.elasticSearch);
    cy.get('[data-cy="data-source-elasticsearch"]').click();

    cy.get(postgreSqlSelector.dataSourceNameInputField).should(
      "have.value",
      elasticsearchText.elasticSearch
    );
    cy.get(postgreSqlSelector.labelHost).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelHost
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
    cy.get(postgreSqlSelector.labelSsl).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelSSL
    );
    cy.get(postgreSqlSelector.labelSSLCertificate).verifyVisibleElement(
      "have.text",
      postgreSqlText.sslCertificate
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
      elasticsearchText.errorConnectionRefused
    );
  });

  it("Should verify the functionality of Elasticsearch connection form.", () => {
    selectDataSource(elasticsearchText.elasticSearch);

    cy.clearAndType(
      postgreSqlSelector.dataSourceNameInputField,
      elasticsearchText.cypressElasticsearch
    );

    fillDataSourceTextField(
      postgreSqlText.labelHost,
      postgreSqlText.placeholderEnterHost,
      "elasticsearch_host"
    );
    fillDataSourceTextField(
      postgreSqlText.labelPort,
      postgreSqlText.placeholderEnterPort,
      "443"
    );

    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      Cypress.env("elasticsearch_user")
    );

    cy.get(postgreSqlSelector.passwordTextField).type(
      Cypress.env("elasticsearch_password")
    );
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    verifyCouldnotConnectWithAlert(elasticsearchText.errorGetAddrInfoNotFound);

    fillDataSourceTextField(
      postgreSqlText.labelHost,
      postgreSqlText.placeholderEnterHost,
      Cypress.env("elasticsearch_host")
    );
    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      "elasticsearch_user"
    );
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    verifyCouldnotConnectWithAlert("Response Error");

    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      Cypress.env("elasticsearch_user")
    );
    cy.get(postgreSqlSelector.passwordTextField)
      .clear()
      .type("elasticsearch_password");
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    verifyCouldnotConnectWithAlert("Response Error");
    cy.get(postgreSqlSelector.passwordTextField)
      .clear()
      .type(Cypress.env("elasticsearch_password"));

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);
    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSAdded
    );

    cy.get(postgreSqlSelector.leftSidebarDatasourceButton).click();
    cy.get(postgreSqlSelector.datasourceLabelOnList)
      .should("have.text", elasticsearchText.cypressElasticsearch)
      .should("be.visible");
  });
});
