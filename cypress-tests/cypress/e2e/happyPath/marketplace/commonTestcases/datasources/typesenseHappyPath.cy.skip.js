import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { typesenseUIConfig, typesenseFormConfig } from "Constants/constants/marketplace/datasources/typesense";

const data = {};

describe("TypeSense", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const typesenseDataSourceName = `cypress-${data.dataSourceName}-typesense`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(typesenseDataSourceName);
    });

    it("1. TypeSense - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${typesenseDataSourceName}`,
            "typesense",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 8108, encrypted: false },
                { key: "api_key", value: null, encrypted: true },
                { key: "protocol", value: "http", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(typesenseDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(typesenseDataSourceName)).click();
        verifyConnectionFormUI(typesenseUIConfig.defaultFields);
    });

    it("2. TypeSense - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${typesenseDataSourceName}`,
            "typesense",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 8108, encrypted: false },
                { key: "api_key", value: null, encrypted: true },
                { key: "protocol", value: "http", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(typesenseDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(typesenseDataSourceName)).click();

        fillDSConnectionForm(typesenseFormConfig, []);

        verifyDSConnection();
    });

    it("3. TypeSense - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${typesenseDataSourceName}`,
            "typesense",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 8108, encrypted: false },
                { key: "api_key", value: null, encrypted: true },
                { key: "protocol", value: "http", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(typesenseDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(typesenseDataSourceName)).click();

        verifyConnectionFormUI(typesenseUIConfig.defaultFields);

        fillDSConnectionForm(typesenseFormConfig, typesenseFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(typesenseFormConfig, typesenseFormConfig.invalidApiKey);
        verifyDSConnection("failed", "Request failed with HTTP code 401");
    });
});

/*
 * Test Cases for TypeSense
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with default field values
 *   - Steps: Navigate to data sources page → Click on typesense data source → Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Host (input, default "localhost"), Port (input, default "8108"),
 *     API key (encrypted), Protocol (dropdown, default "HTTP")
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with default field values
 *   - Steps: Navigate → Fill valid credentials → Test connection
 *   - Expected: Successful connection (verifyDSConnection passes)
 *   - Credentials: typesense_host, typesense_port, typesense_api_key
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with default field values
 *   - Steps: Navigate → Verify UI → Test with invalid host → Test with invalid API key
 *   - Expected: UI matches manifest; invalid host returns "getaddrinfo ENOTFOUND invalid-host";
 *     invalid API key returns "Request failed with HTTP code 401"
 */
