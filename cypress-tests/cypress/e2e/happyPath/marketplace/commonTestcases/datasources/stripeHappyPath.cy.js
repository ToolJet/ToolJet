import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { commonSelectors } from "Selectors/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { stripeUIConfig, stripeFormConfig, stripeApiOptions } from "Constants/constants/marketplace/datasources/stripe";

const data = {};

describe("Stripe", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const stripeDataSourceName = `cypress-${data.dataSourceName}-stripe`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(stripeDataSourceName);
    });

    it("1. Stripe - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${stripeDataSourceName}`,
            "stripe",
            stripeApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(stripeDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(stripeDataSourceName)).click();
        verifyConnectionFormUI(stripeUIConfig.defaultFields);
    });

    it("2. Stripe - Verify saving data source with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${stripeDataSourceName}`,
            "stripe",
            stripeApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(stripeDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(stripeDataSourceName)).click();

        fillDSConnectionForm(stripeFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .scrollIntoView()
            .should("be.visible")
            .click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved");
    });

    it("3. Stripe - Verify UI and save together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${stripeDataSourceName}`,
            "stripe",
            stripeApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(stripeDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(stripeDataSourceName)).click();

        verifyConnectionFormUI(stripeUIConfig.defaultFields);

        fillDSConnectionForm(stripeFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .scrollIntoView()
            .should("be.visible")
            .click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved");
    });
});

/*
 * Test Cases for Stripe
 * =====================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with stripeApiOptions
 *   - Steps: Navigate to data sources page -> Click on stripe data source -> Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: API key (encrypted, placeholder: "**************")
 *
 * TC_002: Verify saving data source with valid credentials
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Fill valid credentials via fillDSConnectionForm -> Click save button
 *   - Expected: Toast "Data Source Saved" (customTesting: true, no test connection button)
 *   - Credentials: stripe_api_key
 *
 * TC_003: Verify UI and save together
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Verify UI fields -> Fill valid credentials -> Click save button
 *   - Expected: UI fields match manifest; save succeeds with toast "Data Source Saved"
 *   - Note: Stripe has customTesting: true; verification is done via save only
 */
