import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { commonSelectors } from "Selectors/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { sendgridUIConfig, sendgridFormConfig, sendgridApiOptions } from "Constants/constants/marketplace/datasources/sendgrid";

const data = {};

describe("SendGrid", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const sendgridDataSourceName = `cypress-${data.dataSourceName}-sendgrid`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(sendgridDataSourceName);
    });

    it("1. SendGrid - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${sendgridDataSourceName}`,
            "sendgrid",
            sendgridApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(sendgridDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(sendgridDataSourceName)).click();
        verifyConnectionFormUI(sendgridUIConfig.defaultFields);
    });

    it("2. SendGrid - Verify saving data source with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${sendgridDataSourceName}`,
            "sendgrid",
            sendgridApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(sendgridDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(sendgridDataSourceName)).click();

        fillDSConnectionForm(sendgridFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .scrollIntoView()
            .should("be.visible")
            .click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved", true, 50000);
    });

    it("3. SendGrid - Verify UI and save together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${sendgridDataSourceName}`,
            "sendgrid",
            sendgridApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(sendgridDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(sendgridDataSourceName)).click();

        verifyConnectionFormUI(sendgridUIConfig.defaultFields);

        fillDSConnectionForm(sendgridFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .scrollIntoView()
            .should("be.visible")
            .click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved", true, 50000);
    });
});

/*
 * Test Cases for SendGrid
 * =======================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with sendgridApiOptions
 *   - Steps: Navigate to data sources page -> Click on sendgrid data source -> Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: API key (encrypted)
 *
 * TC_002: Verify saving data source with valid credentials
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Fill valid credentials via fillDSConnectionForm -> Click save button
 *   - Expected: Toast "Data Source Saved" (note: customTesting=true, uses save instead of test connection)
 *   - Credentials: sendgrid_api_key
 *
 * TC_003: Verify UI and save together
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Verify UI fields -> Fill valid credentials -> Click save button
 *   - Expected: UI fields match manifest; save succeeds with toast "Data Source Saved"
 *   - Note: SendGrid has customTesting=true; no Test Connection button exists
 */
