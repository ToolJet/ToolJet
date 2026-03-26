import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { appwriteUIConfig, appwriteFormConfig } from "Constants/constants/marketplace/datasources/appwrite";

const data = {};

describe("Appwrite", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const appwriteDataSourceName = `cypress-${data.dataSourceName}-appwrite`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(appwriteDataSourceName);
    });

    it("1. Appwrite - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${appwriteDataSourceName}`,
            "appwrite",
            [
                { key: "host", value: "", encrypted: false },
                { key: "project_id", value: "", encrypted: false },
                { key: "database_id", value: "", encrypted: false },
                { key: "secret_key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(appwriteDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(appwriteDataSourceName)).click();
        verifyConnectionFormUI(appwriteUIConfig.defaultFields);
    });

    it("2. Appwrite - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${appwriteDataSourceName}`,
            "appwrite",
            [
                { key: "host", value: "", encrypted: false },
                { key: "project_id", value: "", encrypted: false },
                { key: "database_id", value: "", encrypted: false },
                { key: "secret_key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(appwriteDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(appwriteDataSourceName)).click();

        fillDSConnectionForm(appwriteFormConfig, []);

        verifyDSConnection();
    });

    it("3. Appwrite - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${appwriteDataSourceName}`,
            "appwrite",
            [
                { key: "host", value: "", encrypted: false },
                { key: "project_id", value: "", encrypted: false },
                { key: "database_id", value: "", encrypted: false },
                { key: "secret_key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(appwriteDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(appwriteDataSourceName)).click();

        verifyConnectionFormUI(appwriteUIConfig.defaultFields);

        fillDSConnectionForm(appwriteFormConfig, appwriteFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(appwriteFormConfig, appwriteFormConfig.invalidSecretKey);
        verifyDSConnection("failed", "Missing or unknown project ID");
    });
});
