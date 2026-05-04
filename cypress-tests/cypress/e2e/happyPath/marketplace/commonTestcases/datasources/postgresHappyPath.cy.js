import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { postgresUIConfig, postgresFormConfig, postgresQueryConfig, postgresQueryFillConfig } from "Constants/constants/marketplace/datasources/postgres";
import { verifyPreviewData } from "Support/utils/dataSource";
import { dataSourceSelector } from "Constants/selectors/dataSource";

const data = {};

describe("PostgreSQL", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    data.appName = `${fake.companyName}-App`;
    data.appCreated = false;
    const postgresqlDataSourceName = `cypress-${data.dataSourceName}-postgresql`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        if (data.appCreated) {
            cy.apiDeleteApp();
            data.appCreated = false;
        }
        cy.apiDeleteDataSource(postgresqlDataSourceName);
    });

    it("1. PostgreSQL - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${postgresqlDataSourceName}`,
            "postgresql",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 5432, encrypted: false },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "root_cert", value: null, encrypted: true },
                { key: "connection_string", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(postgresqlDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(postgresqlDataSourceName)).click();
        verifyConnectionFormUI(postgresUIConfig.defaultFields);
    });

    it("2. PostgreSQL - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${postgresqlDataSourceName}`,
            "postgresql",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 5432, encrypted: false },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "root_cert", value: null, encrypted: true },
                { key: "connection_string", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(postgresqlDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(postgresqlDataSourceName)).click();

        fillDSConnectionForm(postgresFormConfig, []);

        verifyDSConnection();
    });

    it("3. PostgreSQL - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${postgresqlDataSourceName}`,
            "postgresql",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 5432, encrypted: false },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "root_cert", value: null, encrypted: true },
                { key: "connection_string", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(postgresqlDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(postgresqlDataSourceName)).click();

        verifyConnectionFormUI(postgresUIConfig.defaultFields);

        fillDSConnectionForm(postgresFormConfig, postgresFormConfig.invalidSsl);
        verifyDSConnection("failed", "The server does not support SSL connections");

        fillDSConnectionForm(postgresFormConfig, postgresFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(postgresFormConfig, postgresFormConfig.invalidUsername);
        verifyDSConnection("failed", `password authentication failed for user "invalid-username"`);

        fillDSConnectionForm(postgresFormConfig, postgresFormConfig.invalidPassword);
        verifyDSConnection("failed", `password authentication failed for user "postgres"`);

        fillDSConnectionForm(postgresFormConfig, postgresFormConfig.invalidPort);
        verifyDSConnection("failed", "Connection test failed: Database connection timeout. Please check host/port/firewall");
    });

    it("4. PostgreSQL - Verify query editor", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${postgresqlDataSourceName}`,
            "postgresql",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "host", value: Cypress.env("pg_host"), encrypted: false },
                { key: "port", value: 5432, encrypted: false },
                { key: "database", value: Cypress.env("pg_database"), encrypted: false },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "username", value: Cypress.env("pg_user"), encrypted: false },
                { key: "password", value: Cypress.env("pg_password"), encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "root_cert", value: null, encrypted: true },
                { key: "connection_string", value: null, encrypted: true },
            ],
            true
        );

        cy.getAuthHeaders().then((headers) => {
            cy.request({
                method: "GET",
                url: `${Cypress.env("server_host")}/api/apps`,
                headers,
                failOnStatusCode: false,
            }).then((response) => {
                const app = response.body?.apps?.find((a) => a.name === data.appName);
                if (app?.id) {
                    cy.request({
                        method: "DELETE",
                        url: `${Cypress.env("server_host")}/api/apps/${app.id}`,
                        headers,
                        failOnStatusCode: false,
                    });
                }
            });
        });
        cy.apiCreateApp(data.appName).then(() => {
            data.appCreated = true;
        });
        cy.apiAddQueryToApp({
            queryName: "table-creation",
            options: {
                mode: "sql",
                transformationLanguage: "javascript",
                enableTransformation: false,
            },
            dataSourceName: postgresqlDataSourceName,
            dsKind: "postgresql",
        });
        cy.openApp();

        cy.get('[data-cy="list-query-table-creation"]').click();
        verifyConnectionFormUI(postgresQueryConfig.defaultFields);

        // Switch to GUI mode and verify default state
        fillDSConnectionForm(postgresQueryFillConfig.switchToGuiMode);
        verifyConnectionFormUI(postgresQueryConfig.guiModeDefault);

        // Select Bulk update operation and verify UI fields
        fillDSConnectionForm(postgresQueryFillConfig.selectBulkUpdateOperation);
        verifyConnectionFormUI(postgresQueryConfig.bulkUpdateUsingPrimaryKey);

        // Fill bulk update fields
        fillDSConnectionForm(postgresQueryFillConfig.bulkUpdateUsingPrimaryKey);
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get('[data-cy="preview-toggle-button"]').click();
        cy.wait(1000);

        // Switch back to SQL mode and verify updated data
        fillDSConnectionForm(postgresQueryFillConfig.switchToSqlMode);
        fillDSConnectionForm(postgresQueryFillConfig.selectWithParams);
        cy.forceClickOnCanvas();
        cy.wait(5000);
        verifyPreviewData("Bob Smith Updated");

    });
});

/*
 * Test Cases for PostgreSQL
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with manual connection type and default SSL settings
 *   - Steps: Navigate to data sources page → Click on data source → Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states (disabled/enabled) match manifest
 *   - Fields verified: connection_type, host, port, ssl_enabled, ssl_certificate, password, ca_cert, client_key, client_cert, root_cert, connection_string
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with manual connection type
 *   - Steps: Navigate to data sources page → Click on data source → Fill valid credentials → Test connection
 *   - Expected: Toast message "Test connection verified" appears
 *   - Credentials: Uses postgresFormConfig valid credentials
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with manual connection type
 *   - Steps: Navigate to data sources page → Click on data source → Verify UI → Test multiple invalid credential scenarios → Verify error messages
 *   - Expected:
 *     - UI elements match manifest specifications
 *     - Invalid SSL: Connection fails with "The server does not support SSL connections"
 *     - Invalid host: Connection fails with "getaddrinfo ENOTFOUND invalid-host"
 *     - Invalid username: Connection fails with "password authentication failed for user "invalid-username""
 *     - Invalid password: Connection fails with "password authentication failed for user "postgres""
 *     - Invalid port: Connection fails with "Connection test failed: Database connection timeout. Please check host/port/firewall"
 *
 * TC_004: Verify query editor
 *   - Pre-condition: Data source created via API with valid credentials (pg_host, pg_database, pg_user, pg_password env vars), app created via API, query added to app
 *   - Steps: Open app → Click query → Verify SQL mode UI → Switch to GUI mode → Verify GUI default state → Select Bulk update operation → Verify bulk update UI → Fill bulk update fields → Run query → Switch to SQL mode → Run SELECT query → Verify preview data
 *   - Expected:
 *     - SQL mode default fields match postgresQueryConfig.defaultFields
 *     - GUI mode default fields match postgresQueryConfig.guiModeDefault
 *     - Bulk update UI fields match postgresQueryConfig.bulkUpdateUsingPrimaryKey
 *     - Bulk update query executes successfully
 *     - SELECT query returns updated data ("Bob Smith Updated")
 *   - Credentials: pg_host, pg_database, pg_user, pg_password
 */