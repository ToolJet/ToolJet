import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { commonSelectors } from "Selectors/common";
import { slackUIConfig, slackApiOptions } from "Constants/constants/marketplace/datasources/slack";

const data = {};

describe("Slack", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const slackDataSourceName = `cypress-${data.dataSourceName}-slack`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(slackDataSourceName);
    });

    it("1. Slack - Verify connection form UI elements", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${slackDataSourceName}`,
            "slack",
            slackApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(slackDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(slackDataSourceName)).click();

        // Verify "Authorize" label
        cy.contains(".form-label", "Authorize").should("be.visible");

        // Verify default permission scopes are displayed
        slackUIConfig.defaultScopes.forEach((scope) => {
            cy.contains(".badge", scope).should("be.visible");
        });

        // Verify chat:write radio button
        cy.contains(".form-check-label", "chat:write").should("be.visible");

        // Verify "Slack app" label and dropdown
        cy.contains(".form-label", "Slack app").should("be.visible");

        // Verify Client ID and Client Secret fields are visible
        // (credential_source is set to "from_datasource_configuration" via API)
        cy.contains(".form-label", "Client ID").should("be.visible");
        cy.contains(".form-label", "Client Secret").should("be.visible");

        // Verify Redirect URI field
        cy.contains(".form-label", "Redirect URI").should("be.visible");

        // Verify "Connect to Slack" button
        cy.contains("button", "Connect to Slack").should("be.visible");
    });

    it("2. Slack - Verify saving data source with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${slackDataSourceName}`,
            "slack",
            slackApiOptions
        );

        // Update with valid credentials via API
        cy.apiUpdateDataSource({
            dataSourceName: slackDataSourceName,
            options: [
                { key: "provider", value: "slack", encrypted: false },
                { key: "oauth2", value: false, encrypted: false },
                { key: "access_type", value: "read", encrypted: false },
                { key: "client_id", value: `${Cypress.env('slack_client_id')}`, encrypted: false },
                { key: "client_secret", value: `${Cypress.env('slack_client_secret')}`, encrypted: true },
                { key: "credential_source", value: "from_datasource_configuration", encrypted: false },
                { key: "code", value: null, encrypted: true },
                { key: "api_key", value: null, encrypted: true }
            ]
        });

        // Navigate and verify the form loads with saved credentials
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(slackDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(slackDataSourceName)).click();

        // Verify Client ID field is populated
        cy.contains(".form-label", "Client ID")
            .parent()
            .find("input")
            .should("have.value", `${Cypress.env('slack_client_id')}`);

        // Verify Client Secret field is present (encrypted, so value may be masked)
        cy.contains(".form-label", "Client Secret").should("be.visible");
    });

    it("3. Slack - Verify UI and save together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${slackDataSourceName}`,
            "slack",
            slackApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(slackDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(slackDataSourceName)).click();

        // Verify UI elements
        cy.contains(".form-label", "Authorize").should("be.visible");

        slackUIConfig.defaultScopes.forEach((scope) => {
            cy.contains(".badge", scope).should("be.visible");
        });

        cy.contains(".form-check-label", "chat:write").should("be.visible");
        cy.contains(".form-label", "Slack app").should("be.visible");
        cy.contains(".form-label", "Client ID").should("be.visible");
        cy.contains(".form-label", "Client Secret").should("be.visible");
        cy.contains(".form-label", "Redirect URI").should("be.visible");
        cy.contains("button", "Connect to Slack").should("be.visible");

        // Update with valid credentials via API
        cy.apiUpdateDataSource({
            dataSourceName: slackDataSourceName,
            options: [
                { key: "provider", value: "slack", encrypted: false },
                { key: "oauth2", value: false, encrypted: false },
                { key: "access_type", value: "read", encrypted: false },
                { key: "client_id", value: `${Cypress.env('slack_client_id')}`, encrypted: false },
                { key: "client_secret", value: `${Cypress.env('slack_client_secret')}`, encrypted: true },
                { key: "credential_source", value: "from_datasource_configuration", encrypted: false },
                { key: "code", value: null, encrypted: true },
                { key: "api_key", value: null, encrypted: true }
            ]
        });

        // Reload and verify credentials persisted
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(slackDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(slackDataSourceName)).click();

        cy.contains(".form-label", "Client ID")
            .parent()
            .find("input")
            .should("have.value", `${Cypress.env('slack_client_id')}`);
    });
});

/*
 * Test Cases for Slack
 * ====================
 *
 * Note: Slack uses a custom OAuth React component (react-component-slack), not DynamicFormV2.
 * The manifest has hideSave: true and customTesting: true, so there is no standard save or
 * test connection button. The "Connect to Slack" button initiates an OAuth flow that cannot
 * be completed in Cypress. Credential saving is verified via API update + form reload.
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with credential_source: "from_datasource_configuration"
 *   - Steps: Navigate to data sources page -> Click on slack data source -> Verify all form elements
 *   - Expected: Authorize label, default scopes badges, chat:write radio, Slack app dropdown,
 *     Client ID/Secret fields, Redirect URI field, Connect to Slack button all visible
 *
 * TC_002: Verify saving data source with valid credentials
 *   - Pre-condition: Data source created via API
 *   - Steps: Update credentials via apiUpdateDataSource -> Navigate -> Verify fields populated
 *   - Expected: Client ID populated with env var value after API save
 *   - Credentials: slack_client_id, slack_client_secret
 *
 * TC_003: Verify UI and save together
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Verify UI elements -> Update via API -> Reload -> Verify populated
 *   - Expected: UI elements match component structure; credentials persist after API update
 */
