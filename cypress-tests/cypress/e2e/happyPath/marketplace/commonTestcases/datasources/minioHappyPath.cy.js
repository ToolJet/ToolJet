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
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
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
                { key: "secret_key", value: null, encrypted: true },
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
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "access_key", value: "", encrypted: false },
                { key: "secret_key", value: null, encrypted: true },
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
                { key: "secret_key", value: null, encrypted: true },
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

/*
 * Test Cases for Minio
 * ====================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with default options (host, port, ssl_enabled, access_key, secret_key)
 *   - Steps: Navigate to data sources page -> Click on minio data source -> Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Host, Port, SSL, Access key, Secret key
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Fill valid credentials via fillDSConnectionForm -> Test connection
 *   - Expected: Toast "Test connection verified"
 *   - Credentials: minio_host, minio_port, minio_accesskey, minio_secretkey
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Verify UI fields -> Test with invalid host -> Test with invalid access key -> Test with invalid secret key
 *   - Expected: UI fields match manifest; each invalid field produces appropriate error:
 *     - Invalid host: "getaddrinfo ENOTFOUND invalid-host"
 *     - Invalid access key: "does not exist in our records"
 *     - Invalid secret key: "The request signature we calculated does not match"
 */
