import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { commonSelectors } from "Selectors/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { n8nUIConfig, n8nFormConfig, n8nApiOptions } from "Constants/constants/marketplace/datasources/n8n";

const data = {};

describe("n8n", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const n8nDataSourceName = `cypress-${data.dataSourceName}-n8n`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(n8nDataSourceName);
    });

    it("1. n8n - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${n8nDataSourceName}`,
            "n8n",
            n8nApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(n8nDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(n8nDataSourceName)).click();
        verifyConnectionFormUI(n8nUIConfig.defaultFields);
    });

    it("2. n8n - Verify saving data source with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${n8nDataSourceName}`,
            "n8n",
            n8nApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(n8nDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(n8nDataSourceName)).click();

        fillDSConnectionForm(n8nFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .scrollIntoView()
            .should("be.visible")
            .click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved");
    });

    it("3. n8n - Verify UI and save together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${n8nDataSourceName}`,
            "n8n",
            n8nApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(n8nDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(n8nDataSourceName)).click();

        verifyConnectionFormUI(n8nUIConfig.defaultFields);

        fillDSConnectionForm(n8nFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .scrollIntoView()
            .should("be.visible")
            .click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved");
    });
});

/*
 * Test Cases for n8n
 * ==================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with n8nApiOptions (auth_type: "none")
 *   - Steps: Navigate to data sources page -> Click on n8n data source -> Verify all form fields
 *   - Expected: Dropdown "Authentication type" shows default "None"
 *   - Note: Default auth_type "none" has no sub-fields; only the dropdown is visible
 *
 * TC_002: Verify saving data source with valid credentials
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Switch auth to "Basic Auth" -> Fill username/password -> Click save
 *   - Expected: Toast "Data Source Saved" (customTesting: true, no test connection button)
 *   - Credentials: n8n_username, n8n_password
 *
 * TC_003: Verify UI and save together
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Verify UI fields -> Switch auth to "Basic Auth" -> Fill credentials -> Save
 *   - Expected: UI fields match manifest; save succeeds with toast "Data Source Saved"
 */
