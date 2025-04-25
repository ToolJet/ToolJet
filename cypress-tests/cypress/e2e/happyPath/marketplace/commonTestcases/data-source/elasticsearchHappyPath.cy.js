import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { elasticsearchText } from "Texts/elasticsearch";
import { commonSelectors } from "Selectors/common";
import { dataSourceSelector } from "Selectors/dataSource";
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
describe("Data source Elasticsearch", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.defaultWorkspaceLogin();
    data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
  });

  it("Should verify elements on Elasticsearch connection form", () => {
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
      `cypress-${data.dataSourceName}-elasticsearch`,
      "elasticsearch",
      [
        { key: "host", value: "localhost" },
        { key: "port", value: 9200 },
        { key: "username", value: "" },
        { key: "password", value: "", encrypted: true },
        { key: "ssl_enabled", value: true, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
      ]
    );
    cy.reload();
    cy.get(`[data-cy="cypress-${data.dataSourceName}-elasticsearch-button"]`)
      .should("be.visible")
      .click();
    cy.get(dataSourceSelector.dsNameInputField).should(
      "have.value",
      `cypress-${data.dataSourceName}-elasticsearch`
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
      "SSL Certificate"
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
      elasticsearchText.errorConnectionRefused
    );
    deleteDatasource(`cypress-${data.lastName}-elasticsearch`);
  });

  it("Should verify the functionality of Elasticsearch connection form.", () => {
    selectAndAddDataSource(
      "databases",
      elasticsearchText.elasticSearch,
      data.lastName
    );

    fillDataSourceTextField(
      postgreSqlText.labelHost,
      postgreSqlText.placeholderEnterHost,
      "elasticsearch_host"
    );
    fillDataSourceTextField(
      postgreSqlText.labelPort,
      postgreSqlText.placeholderEnterPort,
      "9200"
    );

    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      Cypress.env("elasticsearch_user")
    );

    fillDataSourceTextField(
      postgreSqlText.labelPassword,
      "**************",
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
    verifyCouldnotConnectWithAlert(
      "write EPROTO 4041EA0502000000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:../deps/openssl/openssl/ssl/record/ssl3_record.c:355:"
    );

    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      Cypress.env("elasticsearch_user")
    );

    fillDataSourceTextField(
      postgreSqlText.labelPassword,
      "**************",
      "elasticsearch_password"
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    verifyCouldnotConnectWithAlert(
      "write EPROTO 4041EA0502000000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:../deps/openssl/openssl/ssl/record/ssl3_record.c:355:"
    );
    fillDataSourceTextField(
      postgreSqlText.labelPassword,
      "**************",
      Cypress.env("elasticsearch_password")
    );

    cy.get(".form-check-input").click();

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);
    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    cy.get(
      `[data-cy="cypress-${data.lastName}-elasticsearch-button"]`
    ).verifyVisibleElement(
      "have.text",
      `cypress-${data.lastName}-elasticsearch`
    );

    deleteDatasource(`cypress-${data.lastName}-elasticsearch`);
  });
});
