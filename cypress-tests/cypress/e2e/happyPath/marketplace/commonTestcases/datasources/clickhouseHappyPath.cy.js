import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { clickhouseUIConfig, clickhouseFormConfig } from "Constants/constants/marketplace/datasources/clickhouse";

const data = {};

describe("ClickHouse", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const clickhouseDataSourceName = `cypress-${data.dataSourceName}-clickhouse`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(clickhouseDataSourceName);
    });

    it("1. ClickHouse - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${clickhouseDataSourceName}`,
            "clickhouse",
            [
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "protocol", value: "", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(clickhouseDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(clickhouseDataSourceName)).click();
        verifyConnectionFormUI(clickhouseUIConfig.defaultFields);
    });

    it("2. ClickHouse - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${clickhouseDataSourceName}`,
            "clickhouse",
            [
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "protocol", value: "", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(clickhouseDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(clickhouseDataSourceName)).click();

        fillDSConnectionForm(clickhouseFormConfig, []);

        verifyDSConnection();
    });

    it("3. ClickHouse - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${clickhouseDataSourceName}`,
            "clickhouse",
            [
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "protocol", value: "", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(clickhouseDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(clickhouseDataSourceName)).click();

        verifyConnectionFormUI(clickhouseUIConfig.defaultFields);

        fillDSConnectionForm(clickhouseFormConfig, clickhouseFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(clickhouseFormConfig, clickhouseFormConfig.invalidPort);
        // ClickHouse HTTP port returns "Timeout error" (not ECONNREFUSED) for invalid ports
        verifyDSConnection("failed", "Timeout error");
    });
});

/*
 * Test Cases for ClickHouse
 * ==========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with empty username/host/port/database/protocol and null password
 *   - Steps: Navigate to data sources page → Click on data source → Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Username (input, placeholder: "Enter username"),
 *                       Password (encrypted, placeholder: "**************", disabled with edit button, no eye icon),
 *                       Host (input, placeholder: "localhost"),
 *                       Port (input, placeholder: "8123"),
 *                       Database name (input, placeholder: "database name"),
 *                       Protocol (dropdown)
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with empty fields
 *   - Steps: Navigate to data sources page → Click on data source → Fill valid credentials → Test connection
 *   - Expected: Toast message "Test connection verified" appears
 *   - Credentials: clickhouse_host, clickhouse_port, clickhouse_user, clickhouse_password
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with empty fields
 *   - Steps: Navigate → Verify UI → Fill invalid host → Test connection → Fill invalid port → Test connection
 *   - Expected:
 *     - Invalid Host: Connection fails with "getaddrinfo ENOTFOUND invalid-host"
 *     - Invalid Port: Connection fails with "connect ECONNREFUSED"
 */
