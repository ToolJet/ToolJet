import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { cosmosdbUIConfig, cosmosdbFormConfig } from "Constants/constants/marketplace/datasources/cosmosdb";

const data = {};

describe("CosmosDB", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const cosmosdbDataSourceName = `cypress-${data.dataSourceName}-cosmosdb`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(cosmosdbDataSourceName);
    });

    it("1. CosmosDB - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${cosmosdbDataSourceName}`,
            "cosmosdb",
            [
                { key: "endpoint", value: "", encrypted: false },
                { key: "key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(cosmosdbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(cosmosdbDataSourceName)).click();
        verifyConnectionFormUI(cosmosdbUIConfig.defaultFields);
    });

    it("2. CosmosDB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${cosmosdbDataSourceName}`,
            "cosmosdb",
            [
                { key: "endpoint", value: "", encrypted: false },
                { key: "key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(cosmosdbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(cosmosdbDataSourceName)).click();

        fillDSConnectionForm(cosmosdbFormConfig, []);

        verifyDSConnection();
    });

    it("3. CosmosDB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${cosmosdbDataSourceName}`,
            "cosmosdb",
            [
                { key: "endpoint", value: "", encrypted: false },
                { key: "key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(cosmosdbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(cosmosdbDataSourceName)).click();

        verifyConnectionFormUI(cosmosdbUIConfig.defaultFields);

        fillDSConnectionForm(cosmosdbFormConfig, cosmosdbFormConfig.invalidEndpoint);
        verifyDSConnection("failed", "Invalid URL");
    });
});

/*
 * Test Cases for CosmosDB
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with empty endpoint and null key (encrypted)
 *   - Steps: Navigate to data sources page → Click on data source → Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: End point (input, placeholder: "https://your-account.documents.azure.com"),
 *                       Key (encrypted, placeholder: "**************", disabled with edit button)
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with empty endpoint and null key
 *   - Steps: Navigate to data sources page → Click on data source → Fill valid credentials → Test connection
 *   - Expected: Toast message "Test connection verified" appears
 *   - Credentials: cosmosdb_end_point, cosmosdb_key
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with empty endpoint and null key
 *   - Steps: Navigate → Verify UI → Fill invalid endpoint → Test connection
 *   - Expected:
 *     - Invalid End point: Connection fails with "Invalid URL"
 */
