import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, fillDSConnectionDropdown } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { mongodbUIConfig, mongodbFormConfig } from "Constants/constants/marketplace/datasources/mongodb";

const data = {};

describe("MongoDB", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const mongodbDataSourceName = `cypress-${data.dataSourceName}-mongodb`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(mongodbDataSourceName);
    });

    it("1. MongoDB - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mongodbDataSourceName}`,
            "mongodb",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "connection_format", value: "mongodb", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "use_ssl", value: false, encrypted: false },
                { key: "tls_certificate", value: "none", encrypted: false },
                { key: "ssh_enabled", value: "disabled", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "connection_string", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mongodbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mongodbDataSourceName)).click();
        verifyConnectionFormUI(mongodbUIConfig.defaultFieldsManual);
        fillDSConnectionDropdown({ type: "dropdown", fieldName: "Connection type", text: "Connect using connection string" });
        verifyConnectionFormUI(mongodbUIConfig.defaultFieldsConnectionString);

    });

    it("2. MongoDB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mongodbDataSourceName}`,
            "mongodb",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "connection_format", value: "mongodb", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "use_ssl", value: false, encrypted: false },
                { key: "tls_certificate", value: "none", encrypted: false },
                { key: "ssh_enabled", value: "disabled", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "connection_string", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mongodbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mongodbDataSourceName)).click();

        fillDSConnectionForm(mongodbFormConfig.valid, []);

        verifyDSConnection();
        // Note: need to get new creds
        // fillDSConnectionForm(mongodbFormConfig.validConnectionString, []);
        // verifyDSConnection();
    });

    it("3. MongoDB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mongodbDataSourceName}`,
            "mongodb",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "connection_format", value: "mongodb", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "use_ssl", value: false, encrypted: false },
                { key: "tls_certificate", value: "none", encrypted: false },
                { key: "ssh_enabled", value: "disabled", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "connection_string", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mongodbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mongodbDataSourceName)).click();

        fillDSConnectionForm(mongodbFormConfig, mongodbFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(mongodbFormConfig, mongodbFormConfig.invalidPort);
        verifyDSConnection("failed", "connection timed out");


        // Note: need to get new creds
        // fillDSConnectionForm(mongodbFormConfig, mongodbFormConfig.validConnectionString);
        // verifyDSConnection();
    });
});

/*
 * Test Cases for MongoDB
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with manual connection type and mongodb connection format
 *   - Steps: Navigate to data sources page → Click on data source → Verify manual connection fields → Switch connection type dropdown to "Connect using connection string" → Verify connection string fields
 *   - Expected: All field labels, placeholders, default values, and states (disabled/enabled) match manifest for both manual and connection string modes
 *   - Fields verified (manual): connection_type, connection_format, host, port, database, username, use_ssl, tls_certificate, ssh_enabled, password, ca_cert, client_key, client_cert, connection_string
 *   - Fields verified (connection string): connection string mode fields per mongodbUIConfig.defaultFieldsConnectionString
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with manual connection type
 *   - Steps: Navigate to data sources page → Click on data source → Fill valid credentials → Test connection
 *   - Expected: Toast message "Test connection verified" appears
 *   - Credentials: Uses mongodbFormConfig.valid credentials
 *   - Note: Connection string validation is commented out pending new credentials
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with manual connection type
 *   - Steps: Navigate to data sources page → Click on data source → Test invalid host → Test invalid port → Verify error messages
 *   - Expected:
 *     - Invalid host: Connection fails with "getaddrinfo ENOTFOUND invalid-host"
 *     - Invalid port: Connection fails with "connection timed out"
 *   - Note: Connection string validation is commented out pending new credentials
 */
