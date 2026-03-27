import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { notionUIConfig, notionFormConfig } from "Constants/constants/marketplace/datasources/notion";

const data = {};

describe("Notion", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const notionDataSourceName = `cypress-${data.dataSourceName}-notion`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(notionDataSourceName);
    });

    it("1. Notion - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${notionDataSourceName}`,
            "notion",
            [
                { key: "token", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(notionDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(notionDataSourceName)).click();
        verifyConnectionFormUI(notionUIConfig.defaultFields);
    });

    it("2. Notion - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${notionDataSourceName}`,
            "notion",
            [
                { key: "token", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(notionDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(notionDataSourceName)).click();

        fillDSConnectionForm(notionFormConfig, []);

        verifyDSConnection();
    });

    it("3. Notion - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${notionDataSourceName}`,
            "notion",
            [
                { key: "token", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(notionDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(notionDataSourceName)).click();

        verifyConnectionFormUI(notionUIConfig.defaultFields);

        fillDSConnectionForm(notionFormConfig, notionFormConfig.invalidToken);
        verifyDSConnection("failed", "API token is invalid");

        fillDSConnectionForm(notionFormConfig, []);
        verifyDSConnection();
    });
});

/*
 * Test Cases for Notion
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with null token (encrypted)
 *   - Steps: Navigate to data sources page -> Click on data source -> Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Token (encrypted, placeholder: "**************", disabled with edit button)
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with null token (encrypted)
 *   - Steps: Navigate to data sources page -> Click on data source -> Fill valid credentials -> Test connection
 *   - Expected: Toast message "Test connection verified" appears
 *   - Credentials: notion_api_key from Cypress env
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with null token (encrypted)
 *   - Steps: Navigate -> Verify UI -> Fill invalid token -> Test connection -> Fill valid -> Test connection
 *   - Expected:
 *     - UI elements match manifest specifications
 *     - Invalid token: Connection fails with "API token is invalid"
 *     - Valid credentials: Toast message "Test connection verified" appears
 */
