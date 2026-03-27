import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { commonSelectors } from "Selectors/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { nocodbUIConfig, nocodbFormConfig, nocodbApiOptions } from "Constants/constants/marketplace/datasources/nocodb";

const data = {};

describe("NocoDB", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const nocodbDataSourceName = `cypress-${data.dataSourceName}-nocodb`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(nocodbDataSourceName);
    });

    it("1. NocoDB - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${nocodbDataSourceName}`,
            "nocodb",
            nocodbApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(nocodbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(nocodbDataSourceName)).click();
        verifyConnectionFormUI(nocodbUIConfig.defaultFields);
    });

    it("2. NocoDB - Verify saving data source with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${nocodbDataSourceName}`,
            "nocodb",
            nocodbApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(nocodbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(nocodbDataSourceName)).click();

        fillDSConnectionForm(nocodbFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .scrollIntoView()
            .should("be.visible")
            .click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved");
    });

    it("3. NocoDB - Verify UI and save together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${nocodbDataSourceName}`,
            "nocodb",
            nocodbApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(nocodbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(nocodbDataSourceName)).click();

        verifyConnectionFormUI(nocodbUIConfig.defaultFields);

        fillDSConnectionForm(nocodbFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .scrollIntoView()
            .should("be.visible")
            .click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved");
    });
});

/*
 * Test Cases for NocoDB
 * =====================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with nocodbApiOptions
 *   - Steps: Navigate to data sources page -> Click on nocodb data source -> Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Host (dropdown, default "Nocodb Cloud"), API token (encrypted)
 *
 * TC_002: Verify saving data source with valid credentials
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Fill valid credentials via fillDSConnectionForm -> Click save button
 *   - Expected: Toast "Data Source Saved" (note: uses save instead of test connection)
 *   - Credentials: nocodb_api_key
 *
 * TC_003: Verify UI and save together
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Verify UI fields -> Fill valid credentials -> Click save button
 *   - Expected: UI fields match manifest; save succeeds with toast "Data Source Saved"
 *   - Note: NocoDB has customTesting: true, so there is no Test Connection button
 */
