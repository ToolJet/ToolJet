import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { mssqlUIConfig, mssqlFormConfig } from "Constants/constants/marketplace/datasources/mssql";

const data = {};

describe("MSSQL", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    const mssqlDataSourceName = `cypress-${data.dataSourceName}-mssql`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(mssqlDataSourceName);
    });

    it("1. MSSQL - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mssqlDataSourceName}`,
            "mssql",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 1433, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "azure", value: false, encrypted: false },
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
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mssqlDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mssqlDataSourceName)).click();
        verifyConnectionFormUI(mssqlUIConfig.defaultFields);
    });

    it("2. MSSQL - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mssqlDataSourceName}`,
            "mssql",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 1433, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "azure", value: false, encrypted: false },
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
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mssqlDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mssqlDataSourceName)).click();

        fillDSConnectionForm(mssqlFormConfig, []);

        verifyDSConnection();
    });

    it("3. MSSQL - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mssqlDataSourceName}`,
            "mssql",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 1433, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "azure", value: false, encrypted: false },
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
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mssqlDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mssqlDataSourceName)).click();

        verifyConnectionFormUI(mssqlUIConfig.defaultFields);

        fillDSConnectionForm(mssqlFormConfig, mssqlFormConfig.invalidHost);
        verifyDSConnection("failed", "invalid-host");

        fillDSConnectionForm(mssqlFormConfig, mssqlFormConfig.invalidUsername);
        verifyDSConnection("failed", "Login failed for user 'invalid-username'");

        fillDSConnectionForm(mssqlFormConfig, mssqlFormConfig.invalidPassword);
        verifyDSConnection("failed", "Login failed for user");

        fillDSConnectionForm(mssqlFormConfig, mssqlFormConfig.invalidPort);
        verifyDSConnection("failed", "Failed to connect to");

        fillDSConnectionForm(mssqlFormConfig, mssqlFormConfig.invalidDatabase);
        verifyDSConnection("failed", "Login failed for user");
    });
});

/*
 * Test Cases for MSSQL
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with manual connection type
 *   - Steps: Navigate to data sources page → Click on data source → Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states (disabled/enabled) match manifest
 *   - Fields verified: connection_type, host, port, database, azure, ssl_enabled, ssl_certificate, password, ca_cert, client_key, client_cert, root_cert
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with manual connection type
 *   - Steps: Navigate to data sources page → Click on data source → Fill valid credentials → Test connection
 *   - Expected: Toast message "Test connection verified" appears
 *   - Credentials: Uses mssqlFormConfig valid credentials
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with manual connection type
 *   - Steps: Navigate to data sources page → Click on data source → Verify UI → Test multiple invalid credential scenarios → Verify error messages
 *   - Expected:
 *     - UI elements match manifest specifications
 *     - Invalid host: Connection fails with "invalid-host"
 *     - Invalid username: Connection fails with "Login failed for user 'invalid-username'"
 *     - Invalid password: Connection fails with "Login failed for user"
 *     - Invalid port: Connection fails with "Failed to connect to"
 *     - Invalid database: Connection fails with "Login failed for user"
 */
