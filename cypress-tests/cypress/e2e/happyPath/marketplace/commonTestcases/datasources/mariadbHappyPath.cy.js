import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { mariadbUIConfig, mariadbFormConfig } from "Constants/constants/marketplace/datasources/mariadb";

const data = {};

describe("MariaDB", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    const mariadbDataSourceName = `cypress-${data.dataSourceName}-mariadb`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(mariadbDataSourceName);
    });

    it("1. MariaDB - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mariadbDataSourceName}`,
            "mariadb",
            [
                { key: "host", value: "", encrypted: false },
                { key: "user", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "connectionLimit", value: 10, encrypted: false },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca", value: null, encrypted: true },
                { key: "cert", value: null, encrypted: true },
                { key: "key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mariadbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mariadbDataSourceName)).click();
        verifyConnectionFormUI(mariadbUIConfig.defaultFields);
    });

    it("2. MariaDB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mariadbDataSourceName}`,
            "mariadb",
            [
                { key: "host", value: "", encrypted: false },
                { key: "user", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "connectionLimit", value: 10, encrypted: false },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca", value: null, encrypted: true },
                { key: "cert", value: null, encrypted: true },
                { key: "key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mariadbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mariadbDataSourceName)).click();

        fillDSConnectionForm(mariadbFormConfig, []);

        verifyDSConnection();
    });

    it("3. MariaDB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mariadbDataSourceName}`,
            "mariadb",
            [
                { key: "host", value: "", encrypted: false },
                { key: "user", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "connectionLimit", value: 10, encrypted: false },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca", value: null, encrypted: true },
                { key: "cert", value: null, encrypted: true },
                { key: "key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mariadbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mariadbDataSourceName)).click();

        verifyConnectionFormUI(mariadbUIConfig.defaultFields);

        fillDSConnectionForm(mariadbFormConfig, mariadbFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(mariadbFormConfig, mariadbFormConfig.invalidUsername);
        verifyDSConnection("failed", "Access denied for user 'invalid-username'");

        fillDSConnectionForm(mariadbFormConfig, mariadbFormConfig.invalidPassword);
        verifyDSConnection("failed", "Access denied for user");

        fillDSConnectionForm(mariadbFormConfig, mariadbFormConfig.invalidPort);
        verifyDSConnection("failed", "connect ETIMEDOUT");

        fillDSConnectionForm(mariadbFormConfig, mariadbFormConfig.invalidDatabase);
        verifyDSConnection("failed", "Unknown database 'nonexistent_database'");
    });
});

/*
 * Test Cases for MariaDB
 * ======================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with default options (host, user, port, database, connectionLimit, ssl_enabled, ssl_certificate, password, ca, cert, key)
 *   - Steps: Navigate to data sources page -> Click on mariadb data source -> Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Host, Username, Password, Connection limit, Port, Database, SSL, SSL certificate
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Fill valid credentials via fillDSConnectionForm -> Test connection
 *   - Expected: Toast "Test connection verified"
 *   - Credentials: mariadb_host, mariadb_port, mariadb_database, mariadb_user, mariadb_password
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Verify UI fields -> Test with invalid host -> Test with invalid username -> Test with invalid password -> Test with invalid port -> Test with invalid database
 *   - Expected: UI fields match manifest; each invalid field produces appropriate error:
 *     - Invalid host: "getaddrinfo ENOTFOUND invalid-host"
 *     - Invalid username: "Access denied for user 'invalid-username'"
 *     - Invalid password: "Access denied for user"
 *     - Invalid port: "connect ETIMEDOUT"
 *     - Invalid database: "Unknown database 'nonexistent_database'"
 */
