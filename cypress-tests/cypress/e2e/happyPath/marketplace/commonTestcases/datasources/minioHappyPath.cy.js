import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { minioUIConfig, minioFormConfig } from "Constants/constants/marketplace/datasources/minio";

const data = {};

describe("Minio", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const minioDataSourceName = `cypress-${data.dataSourceName}-minio`;
    beforeEach(() => {
        cy.on("uncaught:exception", () => false);
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(minioDataSourceName);
    });

    it("1. Minio - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${minioDataSourceName}`,
            "minio",
            [
                { key: "host", value: "play.min.io", encrypted: false },
                { key: "port", value: 9000, encrypted: false },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "access_key", value: "", encrypted: false },
                { key: "secret_key", value: null, encrypted: true }
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(minioDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(minioDataSourceName)).click();
        verifyConnectionFormUI(minioUIConfig.defaultFields);
    });

    it("2. Minio - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${minioDataSourceName}`,
            "minio",
            [
                { key: "host", value: "play.min.io", encrypted: false },
                { key: "port", value: 9000, encrypted: false },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "access_key", value: "", encrypted: false },
                { key: "secret_key", value: null, encrypted: true }
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(minioDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(minioDataSourceName)).click();

        fillDSConnectionForm(minioFormConfig, []);

        verifyDSConnection();
    });

    it("3. Minio - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${minioDataSourceName}`,
            "minio",
            [
                { key: "host", value: "play.min.io", encrypted: false },
                { key: "port", value: 9000, encrypted: false },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "access_key", value: "", encrypted: false },
                { key: "secret_key", value: null, encrypted: true }
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(minioDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(minioDataSourceName)).click();

        verifyConnectionFormUI(minioUIConfig.defaultFields);

        fillDSConnectionForm(minioFormConfig, minioFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(minioFormConfig, minioFormConfig.invalidAccessKey);
        verifyDSConnection("failed", "does not exist in our records");

        fillDSConnectionForm(minioFormConfig, minioFormConfig.invalidSecretKey);
        verifyDSConnection("failed", "The request signature we calculated does not match");
    });
});
