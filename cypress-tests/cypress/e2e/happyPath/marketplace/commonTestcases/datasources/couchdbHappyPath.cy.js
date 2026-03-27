import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { couchdbUIConfig, couchdbFormConfig } from "Constants/constants/marketplace/datasources/couchdb";

const data = {};

describe("CouchDB", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const couchdbDataSourceName = `cypress-${data.dataSourceName}-couchdb`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(couchdbDataSourceName);
    });

    it("1. CouchDB - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${couchdbDataSourceName}`,
            "couchdb",
            [
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "database", value: "", encrypted: false },
                { key: "port", value: "5984", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "protocol", value: "http", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(couchdbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(couchdbDataSourceName)).click();
        verifyConnectionFormUI(couchdbUIConfig.defaultFields);
    });

    it("2. CouchDB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${couchdbDataSourceName}`,
            "couchdb",
            [
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "database", value: "", encrypted: false },
                { key: "port", value: "5984", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "protocol", value: "http", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(couchdbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(couchdbDataSourceName)).click();

        fillDSConnectionForm(couchdbFormConfig, []);

        verifyDSConnection();
    });

    it("3. CouchDB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${couchdbDataSourceName}`,
            "couchdb",
            [
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "database", value: "", encrypted: false },
                { key: "port", value: "5984", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "protocol", value: "http", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(couchdbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(couchdbDataSourceName)).click();

        verifyConnectionFormUI(couchdbUIConfig.defaultFields);

        fillDSConnectionForm(couchdbFormConfig, couchdbFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(couchdbFormConfig, couchdbFormConfig.invalidUsername);
        verifyDSConnection("failed", "Response code 401");

        fillDSConnectionForm(couchdbFormConfig, couchdbFormConfig.invalidPassword);
        verifyDSConnection("failed", "Response code 401");

        fillDSConnectionForm(couchdbFormConfig, couchdbFormConfig.invalidPort);
        verifyDSConnection("failed", "connect ECONNREFUSED");
    });
});

/*
 * Test Cases for CouchDB
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with empty username/database/host, null password, port "5984", protocol "http"
 *   - Steps: Navigate to data sources page → Click on data source → Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Host (input, no placeholder),
 *                       Port (input, placeholder: "5984 ", default: "5984"),
 *                       Username (input, placeholder: "username for couchDB"),
 *                       Password (encrypted, placeholder: "**************", disabled with edit button),
 *                       Database name (input, placeholder: "database name"),
 *                       Protocol (dropdown, default: "HTTP")
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with default fields
 *   - Steps: Navigate to data sources page → Click on data source → Fill valid credentials → Test connection
 *   - Expected: Toast message "Test connection verified" appears
 *   - Credentials: couchdb_host, couchdb_user, couchdb_password
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with default fields
 *   - Steps: Navigate → Verify UI → Test invalid host → Test invalid username → Test invalid password → Test invalid port
 *   - Expected:
 *     - Invalid Host: Connection fails with "getaddrinfo ENOTFOUND invalid-host"
 *     - Invalid Username: Connection fails with "Response code 401"
 *     - Invalid Password: Connection fails with "Response code 401"
 *     - Invalid Port: Connection fails with "connect ECONNREFUSED"
 */
