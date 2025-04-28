import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { minioText } from "Texts/minio";
import { minioSelectors } from "Selectors/Plugins";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";

import {
  fillDataSourceTextField,
  selectAndAddDataSource,
} from "Support/utils/postgreSql";

import {
  deleteDatasource,
  closeDSModal,
  deleteAppandDatasourceAfterExecution,
} from "Support/utils/dataSource";

import { dataSourceSelector } from "../../../../../constants/selectors/dataSource";

const data = {};
data.dsName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data source minio", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
  });

  it("Should verify elements on minio connection form", () => {
    const Host = Cypress.env("minio_host");
    const Port = Cypress.env("minio_port");
    const AccessKey = Cypress.env("minio_accesskey");
    const SecretKey = Cypress.env("minio_secretkey");

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

    selectAndAddDataSource("databases", minioText.minio, data.dsName);

    fillDataSourceTextField(
      minioText.hostLabel,
      minioText.hostInputPlaceholder,
      Host
    );

    fillDataSourceTextField(
      minioText.portLabel,
      minioText.portPlaceholder,
      Port
    );

    cy.get(`[${minioSelectors.sslToggle}]`).click();

    fillDataSourceTextField(
      minioText.labelAccesskey,
      minioText.placeholderAccessKey,
      AccessKey
    );

    fillDataSourceTextField(
      minioText.labelSecretKey,
      minioText.placeholderSecretKey,
      SecretKey
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    deleteDatasource(`cypress-${data.dsName}-minio`);
  });

  it("Should verify functionality of minio connection form", () => {
    const Host = Cypress.env("minio_host");
    const Port = Cypress.env("minio_port");
    const AccessKey = Cypress.env("minio_accesskey");
    const SecretKey = Cypress.env("minio_secretkey");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    selectAndAddDataSource("databases", minioText.minio, data.dsName);

    fillDataSourceTextField(
      minioText.hostLabel,
      minioText.hostInputPlaceholder,
      Host
    );

    fillDataSourceTextField(
      minioText.portLabel,
      minioText.portPlaceholder,
      Port
    );

    cy.get(`[${minioSelectors.sslToggle}]`).click();

    fillDataSourceTextField(
      minioText.labelAccesskey,
      minioText.placeholderAccessKey,
      AccessKey
    );

    fillDataSourceTextField(
      minioText.labelSecretKey,
      minioText.placeholderSecretKey,
      SecretKey
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    deleteDatasource(`cypress-${data.dsName}-minio`);
  });

  it("Should be able to run the query with a valid connection", () => {
    const Host = Cypress.env("minio_host");
    const Port = Cypress.env("minio_port");
    const AccessKey = Cypress.env("minio_accesskey");
    const SecretKey = Cypress.env("minio_secretkey");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    selectAndAddDataSource("databases", minioText.minio, data.dsName);

    fillDataSourceTextField(
      minioText.hostLabel,
      minioText.hostInputPlaceholder,
      Host
    );

    fillDataSourceTextField(
      minioText.portLabel,
      minioText.portPlaceholder,
      Port
    );

    cy.get(`[${minioSelectors.sslToggle}]`).click();

    fillDataSourceTextField(
      minioText.labelAccesskey,
      minioText.placeholderAccessKey,
      AccessKey
    );

    fillDataSourceTextField(
      minioText.labelSecretKey,
      minioText.placeholderSecretKey,
      SecretKey
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    cy.get(commonSelectors.dashboardIcon).click();
    cy.get(commonSelectors.appCreateButton).click();
    cy.get(commonSelectors.appNameInput).click().type(data.dsName);
    cy.get(commonSelectors.createAppButton).click();
    cy.skipWalkthrough();

    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get(".css-4e90k9").type(`${data.dsName}`);
    cy.contains(`[id*="react-select-"]`, data.dsName).click();
    cy.get('[data-cy="query-rename-input"]').clear().type(data.dsName);

    const operationsMinio = [
      "List buckets",
      "Put object",
      "List objects in a bucket",
      "Read object",
      "Presigned url for download",
      "Presigned url for upload",
      "Remove object",
    ];

    operationsMinio.forEach((operation) => {
      cy.get(".react-select__input")
        .eq(1)
        .type(`${operation}{enter}`, { force: true });

      if (operation === "List objects in a bucket") {
        cy.get(minioSelectors.bucketNameInputField).clearAndTypeOnCodeMirror(
          minioText.bucketName
        );
      }
      if (operation === "Read object" || operation === "Remove object") {
        cy.get(minioSelectors.bucketNameInputField).clearAndTypeOnCodeMirror(
          minioText.bucketName
        );
        cy.get(minioSelectors.objectNameInputField).clearAndTypeOnCodeMirror(
          minioText.objectName
        );
      }
      if (operation === "Put object") {
        cy.get(minioSelectors.bucketNameInputField).clearAndTypeOnCodeMirror(
          minioText.bucketName
        );
        cy.get(minioSelectors.objectNameInputField).clearAndTypeOnCodeMirror(
          minioText.objectName
        );
        cy.get(minioSelectors.contentTypeInputField).clearAndTypeOnCodeMirror(
          '"string"'
        );
        cy.get(minioSelectors.dataInput).clearAndTypeOnCodeMirror(`test`);
      }
      if (
        operation === "Presigned url for download" ||
        operation === "Presigned url for upload"
      ) {
        cy.get(minioSelectors.bucketNameInputField).clearAndTypeOnCodeMirror(
          minioText.bucketName
        );
        cy.get(minioSelectors.objectNameInputField).clearAndTypeOnCodeMirror(
          minioText.objectName
        );
      }

      cy.get(dataSourceSelector.queryPreviewButton).click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        `Query (${data.dsName}) completed.`
      );
    });
    deleteAppandDatasourceAfterExecution(
      data.dsName,
      `cypress-${data.dsName}-minio`
    );
  });
});
