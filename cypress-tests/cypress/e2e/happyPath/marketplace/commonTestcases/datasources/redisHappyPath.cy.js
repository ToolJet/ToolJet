import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { redisUIConfig, redisFormConfig } from "Constants/constants/marketplace/datasources/redis";

const data = {};

describe("Redis", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const redisDataSourceName = `cypress-${data.dataSourceName}-redis`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(redisDataSourceName);
    });

    it("1. Redis - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${redisDataSourceName}`,
            "redis",
            [
                { key: "scheme", value: "redis", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 6379, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: false },
                { key: "tls_enabled", value: false, encrypted: false },
                { key: "tls_certificate", value: "none", encrypted: false },
                { key: "ca_cert", value: null, encrypted: false },
                { key: "client_key", value: null, encrypted: false },
                { key: "client_cert", value: null, encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(redisDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(redisDataSourceName)).click();
        verifyConnectionFormUI(redisUIConfig.defaultFields);
    });

    it("2. Redis - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${redisDataSourceName}`,
            "redis",
            [
                { key: "scheme", value: "redis", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 6379, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: false },
                { key: "tls_enabled", value: false, encrypted: false },
                { key: "tls_certificate", value: "none", encrypted: false },
                { key: "ca_cert", value: null, encrypted: false },
                { key: "client_key", value: null, encrypted: false },
                { key: "client_cert", value: null, encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(redisDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(redisDataSourceName)).click();

        fillDSConnectionForm(redisFormConfig, []);

        verifyDSConnection();
    });

    it("3. Redis - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${redisDataSourceName}`,
            "redis",
            [
                { key: "scheme", value: "redis", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 6379, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: false },
                { key: "tls_enabled", value: false, encrypted: false },
                { key: "tls_certificate", value: "none", encrypted: false },
                { key: "ca_cert", value: null, encrypted: false },
                { key: "client_key", value: null, encrypted: false },
                { key: "client_cert", value: null, encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(redisDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(redisDataSourceName)).click();

        fillDSConnectionForm(redisFormConfig, redisFormConfig.invalidHost);
        verifyDSConnection("failed", 'Connection could not be established: Reached the max retries per request limit (which is 1). Refer to "maxRetriesPerRequest" option for details.');

        fillDSConnectionForm(redisFormConfig, redisFormConfig.invalidPort);
        verifyDSConnection("failed", 'Connection could not be established: Reached the max retries per request limit (which is 1). Refer to "maxRetriesPerRequest" option for details.');
    });
});

/*
 * Test Cases for Redis
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with redis scheme and default settings
 *   - Steps: Navigate to data sources page → Click on data source → Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states (disabled/enabled) match manifest
 *   - Fields verified: scheme, host, port, database, username, password, tls_enabled, tls_certificate, ca_cert, client_key, client_cert
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with redis scheme
 *   - Steps: Navigate to data sources page → Click on data source → Fill valid credentials → Test connection
 *   - Expected: Toast message "Test connection verified" appears
 *   - Credentials: Uses redisFormConfig valid credentials
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with redis scheme
 *   - Steps: Navigate to data sources page → Click on data source → Test invalid host → Test invalid port → Verify error messages
 *   - Expected:
 *     - Invalid host: Connection fails with "Connection could not be established: Reached the max retries per request limit (which is 1). Refer to "maxRetriesPerRequest" option for details."
 *     - Invalid port: Connection fails with "Connection could not be established: Reached the max retries per request limit (which is 1). Refer to "maxRetriesPerRequest" option for details."
 */