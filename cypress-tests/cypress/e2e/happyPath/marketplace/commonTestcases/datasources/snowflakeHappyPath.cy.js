import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { snowflakeUIConfig, snowflakeFormConfig } from "Constants/constants/marketplace/datasources/snowflake";

const data = {};

describe("Snowflake", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const snowflakeDataSourceName = `cypress-${data.dataSourceName}-snowflake`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(snowflakeDataSourceName);
    });

    it("1. Snowflake - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${snowflakeDataSourceName}`,
            "snowflake",
            [
                { key: "account", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "schema", value: "", encrypted: false },
                { key: "warehouse", value: "", encrypted: false },
                { key: "role", value: "", encrypted: false },
                { key: "auth_type", value: "basic", encrypted: false },
                { key: "oauth_type", value: "custom_app", encrypted: false },
                { key: "grant_type", value: "authorization_code", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "client_secret", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(snowflakeDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(snowflakeDataSourceName)).click();
        verifyConnectionFormUI(snowflakeUIConfig.defaultFields);
    });

    // Skipped: Snowflake test-connection hangs when service is unreachable (no backend timeout)
    it.skip("2. Snowflake - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${snowflakeDataSourceName}`,
            "snowflake",
            [
                { key: "account", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "schema", value: "", encrypted: false },
                { key: "warehouse", value: "", encrypted: false },
                { key: "role", value: "", encrypted: false },
                { key: "auth_type", value: "basic", encrypted: false },
                { key: "oauth_type", value: "custom_app", encrypted: false },
                { key: "grant_type", value: "authorization_code", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "client_secret", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(snowflakeDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(snowflakeDataSourceName)).click();

        fillDSConnectionForm(snowflakeFormConfig, []);

        // Fill OAuth fields manually (non-standard data-cy from Authentication.jsx)
        cy.get('[data-cy="username-input-field"]').clear().type(Cypress.env('snowflake_user'));
        cy.get('[data-cy="password-section"]').within(() => {
            cy.get('[data-cy="button-edit"]').click();
        });
        cy.get('[data-cy="password-input-field"]').clear().type(Cypress.env('snowflake_password'));

        verifyDSConnection();
    });

    // Skipped: Snowflake test-connection hangs when service is unreachable (no backend timeout)
    it.skip("3. Snowflake - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${snowflakeDataSourceName}`,
            "snowflake",
            [
                { key: "account", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "schema", value: "", encrypted: false },
                { key: "warehouse", value: "", encrypted: false },
                { key: "role", value: "", encrypted: false },
                { key: "auth_type", value: "basic", encrypted: false },
                { key: "oauth_type", value: "custom_app", encrypted: false },
                { key: "grant_type", value: "authorization_code", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "client_secret", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(snowflakeDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(snowflakeDataSourceName)).click();

        verifyConnectionFormUI(snowflakeUIConfig.defaultFields);

        fillDSConnectionForm(snowflakeFormConfig, snowflakeFormConfig.invalidAccount);
        // Fill OAuth fields manually (non-standard data-cy from Authentication.jsx)
        cy.get('[data-cy="username-input-field"]').clear().type(Cypress.env('snowflake_user'));
        cy.get('[data-cy="password-section"]').within(() => {
            cy.get('[data-cy="button-edit"]').click();
        });
        cy.get('[data-cy="password-input-field"]').clear().type(Cypress.env('snowflake_password'));
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND");
    });
});

/*
 * Test Cases for Snowflake
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with default options (account, database, schema, warehouse, role, auth_type, username, password)
 *   - Steps: Navigate to data sources page -> Click on snowflake data source -> Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Account, Database, Schema, Warehouse, Role
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Fill valid credentials via fillDSConnectionForm -> Manually fill username and password (non-standard Authentication.jsx fields) -> Test connection
 *   - Expected: Toast "Test connection verified"
 *   - Credentials: snowflake_account, snowflake_database, snowflake_user, snowflake_password
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Verify UI fields -> Fill invalid account with valid username/password -> Test connection
 *   - Expected: UI fields match manifest; invalid account returns "getaddrinfo ENOTFOUND"
 *   - Note: Username and password fields are filled manually outside fillDSConnectionForm due to non-standard data-cy attributes from Authentication.jsx
 */
