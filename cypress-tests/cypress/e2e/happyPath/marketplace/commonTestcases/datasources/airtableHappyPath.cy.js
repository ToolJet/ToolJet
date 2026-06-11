import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { airtableUIConfig, airtableFormConfig } from "Constants/constants/marketplace/datasources/airtable";

const data = {};

describe("Airtable", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const airtableDataSourceName = `cypress-${data.dataSourceName}-airtable`;
    beforeEach(() => {
        cy.on("uncaught:exception", () => false);
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(airtableDataSourceName);
    });

    it("1. Airtable - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${airtableDataSourceName}`,
            "airtable",
            [
                { key: "personal_access_token", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(airtableDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(airtableDataSourceName)).click();
        verifyConnectionFormUI(airtableUIConfig.defaultFields);
    });

    it("2. Airtable - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${airtableDataSourceName}`,
            "airtable",
            [
                { key: "personal_access_token", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(airtableDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(airtableDataSourceName)).click();

        fillDSConnectionForm(airtableFormConfig, []);

        verifyDSConnection();
    });

    it("3. Airtable - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${airtableDataSourceName}`,
            "airtable",
            [
                { key: "personal_access_token", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(airtableDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(airtableDataSourceName)).click();

        verifyConnectionFormUI(airtableUIConfig.defaultFields);

        fillDSConnectionForm(airtableFormConfig, airtableFormConfig.invalidToken);
        verifyDSConnection("failed", "Authentication failed: Invalid personal access token");

        fillDSConnectionForm(airtableFormConfig, []);
        verifyDSConnection();
    });
});

/*
 * Test Cases for Airtable
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with personal_access_token field
 *   - Steps: Navigate to data sources page → Click on data source → Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states (disabled/enabled) match manifest
 *   - Fields verified: personal_access_token
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with personal_access_token field
 *   - Steps: Navigate to data sources page → Click on data source → Fill valid credentials → Test connection
 *   - Expected: Toast message "Test connection verified" appears
 *   - Credentials: Uses airtableFormConfig valid credentials (personal access token from env)
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with personal_access_token field
 *   - Steps: Navigate to data sources page → Click on data source → Verify UI → Test invalid token → Test valid credentials
 *   - Expected:
 *     - UI elements match manifest specifications
 *     - Invalid token: Connection fails with "Authentication failed: Invalid personal access token"
 *     - Valid credentials: Toast message "Test connection verified" appears
 */
