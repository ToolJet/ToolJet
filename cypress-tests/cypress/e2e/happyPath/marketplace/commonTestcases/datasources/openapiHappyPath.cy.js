import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { commonSelectors } from "Selectors/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { openapiUIConfig, openapiFormConfig, openapiApiOptions } from "Constants/constants/marketplace/datasources/openapi";

const data = {};

describe("OpenAPI", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const openapiDataSourceName = `cypress-${data.dataSourceName}-openapi`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(openapiDataSourceName);
    });

    it("1. OpenAPI - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${openapiDataSourceName}`,
            "openapi",
            openapiApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(openapiDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(openapiDataSourceName)).click();
        verifyConnectionFormUI(openapiUIConfig.defaultFields);
    });

    it("2. OpenAPI - Verify saving data source with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${openapiDataSourceName}`,
            "openapi",
            openapiApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(openapiDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(openapiDataSourceName)).click();

        fillDSConnectionForm(openapiFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .scrollIntoView()
            .should("be.visible")
            .click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved", true, 50000);
    });

    it("3. OpenAPI - Verify UI and save together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${openapiDataSourceName}`,
            "openapi",
            openapiApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(openapiDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(openapiDataSourceName)).click();

        verifyConnectionFormUI(openapiUIConfig.defaultFields);

        fillDSConnectionForm(openapiFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .scrollIntoView()
            .should("be.visible")
            .click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved", true, 50000);
    });
});

/*
 * Test Cases for OpenAPI
 * ======================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with openapiApiOptions
 *   - Steps: Navigate to data sources page -> Click on openapi data source -> Verify all form fields
 *   - Expected: Host field label, placeholder, default value, and state match manifest
 *   - Fields verified: Host (standard text field)
 *   - Note: Format dropdown, Definition textarea, and Authentication fields are inside the
 *     react-component-openapi-validator custom component and are not verifiable via standard helpers
 *
 * TC_002: Verify saving data source with valid credentials
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Fill host via fillDSConnectionForm -> Click save button
 *   - Expected: Toast "Data Source Saved" (uses save instead of test connection; customTesting: true)
 *   - Credentials: openapi_host
 *
 * TC_003: Verify UI and save together
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Verify UI fields -> Fill host -> Click save button
 *   - Expected: UI fields match manifest; save succeeds with toast "Data Source Saved"
 *   - Note: OpenAPI uses customTesting: true; verification is done via save only
 */
