import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { mysqlUIConfig, mysqlFormConfig } from "Constants/constants/marketplace/datasources/mysql";

const data = {};

describe("MySQL", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const mysqlDataSourceName = `cypress-${data.dataSourceName}-mysql`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(mysqlDataSourceName);
    });

    it("1. MySQL - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mysqlDataSourceName}`,
            "mysql",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "protocol", value: "hostname", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 3306, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "root_cert", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mysqlDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mysqlDataSourceName)).click();
        verifyConnectionFormUI(mysqlUIConfig.defaultFields);
    });

    it("2. MySQL - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mysqlDataSourceName}`,
            "mysql",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "protocol", value: "hostname", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 3306, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "root_cert", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mysqlDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mysqlDataSourceName)).click();

        fillDSConnectionForm(mysqlFormConfig, []);

        verifyDSConnection();
    });

    it("3. MySQL - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mysqlDataSourceName}`,
            "mysql",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "protocol", value: "hostname", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 3306, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "root_cert", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mysqlDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mysqlDataSourceName)).click();

        verifyConnectionFormUI(mysqlUIConfig.defaultFields);

        fillDSConnectionForm(mysqlFormConfig, mysqlFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(mysqlFormConfig, mysqlFormConfig.invalidUsername);
        verifyDSConnection("failed", "Access denied for user 'invalid-username'");

        fillDSConnectionForm(mysqlFormConfig, mysqlFormConfig.invalidPassword);
        verifyDSConnection("failed", "Access denied for user");

        fillDSConnectionForm(mysqlFormConfig, mysqlFormConfig.invalidPort);
        verifyDSConnection("failed", "connect ETIMEDOUT");

        fillDSConnectionForm(mysqlFormConfig, mysqlFormConfig.invalidDatabase);
        verifyDSConnection("failed", "Unknown database 'nonexistent_database'");
    });
});

/*
 * Test Cases for MySQL
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with manual connection type and hostname protocol
 *   - Steps: Navigate to data sources page → Click on data source → Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states (disabled/enabled) match manifest
 *   - Fields verified: connection_type, protocol, host, port, database, username, ssl_enabled, ssl_certificate, password, ca_cert, client_key, client_cert, root_cert
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with manual connection type
 *   - Steps: Navigate to data sources page → Click on data source → Fill valid credentials → Test connection
 *   - Expected: Toast message "Test connection verified" appears
 *   - Credentials: Uses mysqlFormConfig valid credentials
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with manual connection type
 *   - Steps: Navigate to data sources page → Click on data source → Verify UI → Test multiple invalid credential scenarios → Verify error messages
 *   - Expected:
 *     - UI elements match manifest specifications
 *     - Invalid host: Connection fails with "getaddrinfo ENOTFOUND invalid-host"
 *     - Invalid username: Connection fails with "Access denied for user 'invalid-username'"
 *     - Invalid password: Connection fails with "Access denied for user"
 *     - Invalid port: Connection fails with "connect ETIMEDOUT"
 *     - Invalid database: Connection fails with "Unknown database 'nonexistent_database'"
 */
