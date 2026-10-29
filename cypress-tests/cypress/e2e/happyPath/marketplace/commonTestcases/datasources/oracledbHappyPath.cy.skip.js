import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { oracledbUIConfig, oracledbFormConfig } from "Constants/constants/marketplace/datasources/oracledb";

const data = {};

describe("Oracle DB", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const oracledbDataSourceName = `cypress-${data.dataSourceName}-oracledb`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(oracledbDataSourceName);
    });

    it("1. Oracle DB - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${oracledbDataSourceName}`,
            "oracledb",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 1521, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "database_type", value: "SID", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "client_path_type", value: "default", encrypted: false },
                { key: "instant_client_version", value: "21_10", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(oracledbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(oracledbDataSourceName)).click();
        verifyConnectionFormUI(oracledbUIConfig.defaultFields);
    });

    it("2. Oracle DB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${oracledbDataSourceName}`,
            "oracledb",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 1521, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "database_type", value: "SID", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "client_path_type", value: "default", encrypted: false },
                { key: "instant_client_version", value: "21_10", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(oracledbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(oracledbDataSourceName)).click();

        fillDSConnectionForm(oracledbFormConfig, []);

        verifyDSConnection();
    });

    it("3. Oracle DB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${oracledbDataSourceName}`,
            "oracledb",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 1521, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "database_type", value: "SID", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "client_path_type", value: "default", encrypted: false },
                { key: "instant_client_version", value: "21_10", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(oracledbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(oracledbDataSourceName)).click();

        verifyConnectionFormUI(oracledbUIConfig.defaultFields);

        fillDSConnectionForm(oracledbFormConfig, oracledbFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(oracledbFormConfig, oracledbFormConfig.invalidUsername);
        verifyDSConnection("failed", "ORA-01017");

        fillDSConnectionForm(oracledbFormConfig, oracledbFormConfig.invalidPassword);
        verifyDSConnection("failed", "ORA-01017");

        fillDSConnectionForm(oracledbFormConfig, oracledbFormConfig.invalidPort);
        verifyDSConnection("failed", "Failed to connect");

        fillDSConnectionForm(oracledbFormConfig, oracledbFormConfig.invalidDatabase);
        verifyDSConnection("failed", "ORA-12505");
    });
});

/*
 * Test Cases for Oracle DB
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with default field values
 *   - Steps: Navigate to data sources page → Click on oracledb data source → Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Host (input), Port (input), SID / Service name (dropdown),
 *     Database name (input), SSL (toggle), Username (input), Password (encrypted),
 *     Client library location (dropdown), Instant client version (dropdown)
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with default field values
 *   - Steps: Navigate → Fill valid credentials → Test connection
 *   - Expected: Successful connection (verifyDSConnection passes)
 *   - Credentials: oracledb_host, oracledb_port, oracledb_database, oracledb_user, oracledb_password
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with default field values
 *   - Steps: Navigate → Verify UI → Test invalid host → Test invalid username →
 *     Test invalid password → Test invalid port → Test invalid database
 *   - Expected: UI matches manifest; invalid host returns "getaddrinfo ENOTFOUND invalid-host";
 *     invalid username returns "ORA-01017"; invalid password returns "ORA-01017";
 *     invalid port returns "Failed to connect"; invalid database returns "ORA-12505"
 */
