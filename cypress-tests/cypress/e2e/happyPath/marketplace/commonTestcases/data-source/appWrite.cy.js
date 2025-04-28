import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { appwriteText } from "Texts/appWrite";
import { appWriteSelectors } from "Selectors/Plugins";
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

describe("Data source AppWrite", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.defaultWorkspaceLogin();
  });

  it("Should verify elements on appwrite connection form", () => {
    const Host = Cypress.env("appwrite_host");
    const ProjectID = Cypress.env("appwrite_projectID");
    const DatabaseID = Cypress.env("appwrite_databaseID");
    const SecretKey = Cypress.env("appwrite_secretkey");

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

    selectAndAddDataSource("databases", appwriteText.appwrite, data.dsName);

    fillDataSourceTextField(
      appwriteText.host,
      appwriteText.hostPlaceholder,
      Host
    );

    fillDataSourceTextField(
      appwriteText.ProjectID,
      appwriteText.projectIdPlaceholder,
      ProjectID
    );

    fillDataSourceTextField(
      appwriteText.DatabaseID,
      appwriteText.databaseIdPlaceholder,
      DatabaseID
    );

    fillDataSourceTextField(
      appwriteText.SecretKey,
      appwriteText.SecretKeyPlaceholder,
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

    deleteDatasource(`cypress-${data.dsName}-Appwrite`);
  });

  it("Should verify the functionality of appwrite connection form.", () => {
    const Host = Cypress.env("appwrite_host");
    const ProjectID = Cypress.env("appwrite_projectID");
    const DatabaseID = Cypress.env("appwrite_databaseID");
    const SecretKey = Cypress.env("appwrite_secretkey");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    selectAndAddDataSource("databases", appwriteText.appwrite, data.dsName);

    fillDataSourceTextField(
      appwriteText.host,
      appwriteText.hostPlaceholder,
      Host
    );

    fillDataSourceTextField(
      appwriteText.ProjectID,
      appwriteText.projectIdPlaceholder,
      ProjectID
    );

    fillDataSourceTextField(
      appwriteText.DatabaseID,
      appwriteText.databaseIdPlaceholder,
      DatabaseID
    );

    fillDataSourceTextField(
      appwriteText.SecretKey,
      appwriteText.SecretKeyPlaceholder,
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
    deleteDatasource(`cypress-${data.dsName}-Appwrite`);
  });

  it("Should be able to run the query with a valid connection", () => {
    const Host = Cypress.env("appwrite_host");
    const ProjectID = Cypress.env("appwrite_projectID");
    const DatabaseID = Cypress.env("appwrite_databaseID");
    const SecretKey = Cypress.env("appwrite_secretkey");
    const CollectionID = Cypress.env("appwrite_collectionID");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    selectAndAddDataSource("databases", appwriteText.appwrite, data.dsName);

    fillDataSourceTextField(
      appwriteText.host,
      appwriteText.hostPlaceholder,
      Host
    );
    fillDataSourceTextField(
      appwriteText.ProjectID,
      appwriteText.projectIdPlaceholder,
      ProjectID
    );
    fillDataSourceTextField(
      appwriteText.DatabaseID,
      appwriteText.databaseIdPlaceholder,
      DatabaseID
    );
    fillDataSourceTextField(
      appwriteText.SecretKey,
      appwriteText.SecretKeyPlaceholder,
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

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(
      `[data-cy="cypress-${data.dsName}-appwrite-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.dsName}-appwrite`);
    cy.wait(1000);

    cy.get(commonSelectors.dashboardIcon).click();
    cy.get(commonSelectors.appCreateButton).click();
    cy.get(commonSelectors.appNameInput).click().type(data.dsName);
    cy.get(commonSelectors.createAppButton).click();
    cy.skipWalkthrough();

    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get(".css-4e90k9").type(`${data.dsName}`);
    cy.contains(`[id*="react-select-"]`, data.dsName).click();
    cy.get('[data-cy="query-rename-input"]').clear().type(data.dsName);

    // Create API document for delete operation

    cy.request({
      method: "POST",
      url: `https://cloud.appwrite.io/v1/databases/${DatabaseID}/collections/${CollectionID}/documents`,
      headers: {
        "X-Appwrite-Project": ProjectID,
        "X-Appwrite-Key": SecretKey,
        "Content-Type": "application/json",
      },
      body: {
        documentId: "unique()",
        data: {
          User_name: "test",
          User_ID: 30,
        },
        permissions: ['read("any")'],
      },
    }).then((response) => {
      expect(response.status).to.eq(201);
      cy.wrap(response.body.$id).as("documentId");
    });

    // Verify all operations
    const operations = [
      "List documents",
      "Get document",
      "Add Document to Collection",
      "Update document",
      "Delete document",
    ];

    cy.get("@documentId").then((documentId) => {
      operations.forEach((operation) => {
        cy.get(".react-select__input")
          .eq(1)
          .type(`${operation}{enter}`, { force: true });

        if (operation === "Get document") {
          cy.get(appWriteSelectors.collectionId).clearAndTypeOnCodeMirror(
            CollectionID
          );

          cy.get(appWriteSelectors.documentId).clearAndTypeOnCodeMirror(
            Cypress.env("appwrite_documentID")
          );
        }

        if (operation === "Add Document to Collection") {
          cy.get(appWriteSelectors.collectionId).clearAndTypeOnCodeMirror(
            CollectionID
          );
          cy.get(appWriteSelectors.bodyInput).clearAndTypeOnCodeMirror(
            '{"User_name": "John Updated", "User_ID": 35}'
          );
        }

        if (operation === "Update document") {
          cy.get(appWriteSelectors.collectionId).clearAndTypeOnCodeMirror(
            CollectionID
          );

          cy.get(appWriteSelectors.documentId).clearAndTypeOnCodeMirror(
            Cypress.env("appwrite_documentID")
          );
          cy.get(appWriteSelectors.bodyInput).clearAndTypeOnCodeMirror(
            '{"User_name": "John Updated", "User_ID": 35}'
          );
        }

        if (operation === "List documents") {
          cy.get(appWriteSelectors.collectionId).clearAndTypeOnCodeMirror(
            CollectionID
          );
        }

        if (operation === "Delete document") {
          cy.get(appWriteSelectors.collectionId).clearAndTypeOnCodeMirror(
            CollectionID
          );
          cy.get(appWriteSelectors.documentId).clearAndTypeOnCodeMirror(
            documentId
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
        `cypress-${data.dsName}-Appwrite`
      );
    });
  });
});
