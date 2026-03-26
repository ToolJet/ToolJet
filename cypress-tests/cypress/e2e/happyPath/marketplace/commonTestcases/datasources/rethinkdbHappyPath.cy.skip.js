import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { rethinkdbUIConfig, rethinkdbFormConfig } from "Constants/constants/marketplace/datasources/rethinkdb";

const data = {};

describe("RethinkDB", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const rethinkdbDataSourceName = `cypress-${data.dataSourceName}-rethinkdb`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(rethinkdbDataSourceName);
    });

    it("1. RethinkDB - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${rethinkdbDataSourceName}`,
            "rethinkdb",
            [
                { key: "database", value: "", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "port", value: "28015", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(rethinkdbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(rethinkdbDataSourceName)).click();
        verifyConnectionFormUI(rethinkdbUIConfig.defaultFields);
    });

    it("2. RethinkDB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${rethinkdbDataSourceName}`,
            "rethinkdb",
            [
                { key: "database", value: "", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "port", value: "28015", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(rethinkdbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(rethinkdbDataSourceName)).click();

        fillDSConnectionForm(rethinkdbFormConfig, []);

        verifyDSConnection();
    });

    it("3. RethinkDB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${rethinkdbDataSourceName}`,
            "rethinkdb",
            [
                { key: "database", value: "", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "port", value: "28015", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(rethinkdbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(rethinkdbDataSourceName)).click();

        verifyConnectionFormUI(rethinkdbUIConfig.defaultFields);

        fillDSConnectionForm(rethinkdbFormConfig, rethinkdbFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(rethinkdbFormConfig, rethinkdbFormConfig.invalidPort);
        verifyDSConnection("failed", "connect ECONNREFUSED");
    });
});

/*
 * Test Cases for RethinkDB
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with empty/null field values
 *   - Steps: Navigate to data sources page → Click on rethinkdb data source → Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Database (input), Host (input), Username (input),
 *     Password (encrypted), Port (input, default "28015")
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with empty/null field values
 *   - Steps: Navigate → Fill valid credentials → Test connection
 *   - Expected: Successful connection (verifyDSConnection passes)
 *   - Credentials: rethinkdb_host, rethinkdb_port, rethinkdb_database, rethinkdb_username, rethinkdb_password
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with empty/null field values
 *   - Steps: Navigate → Verify UI → Test with invalid host → Test with invalid port
 *   - Expected: UI matches manifest; invalid host returns "getaddrinfo ENOTFOUND invalid-host";
 *     invalid port returns "connect ECONNREFUSED"
 */
