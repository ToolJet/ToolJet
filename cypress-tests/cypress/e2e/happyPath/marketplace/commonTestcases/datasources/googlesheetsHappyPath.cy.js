import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { commonSelectors } from "Selectors/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import {
    googlesheetsUIConfig,
    googlesheetsFormConfig,
    googlesheetsApiOptions,
    googlesheetsApiOptionsServiceAccount
} from "Constants/constants/marketplace/datasources/googlesheets";

const data = {};

describe("Google Sheets", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const googlesheetsDataSourceName = `cypress-${data.dataSourceName}-googlesheets`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(googlesheetsDataSourceName);
    });

    it("1. Google Sheets - Verify connection form UI elements (OAuth2 default)", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${googlesheetsDataSourceName}`,
            "googlesheets",
            googlesheetsApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(googlesheetsDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(googlesheetsDataSourceName)).click();

        verifyConnectionFormUI(googlesheetsUIConfig.defaultFields);

        // Verify Google Sheets OAuth component elements (custom react-component-google-sheets)
        cy.get('[data-cy="google-sheet-connection-form-header"]')
            .should("be.visible")
            .and("have.text", "Authorize");
        cy.get('[data-cy="google-sheet-connection-form-description"]')
            .should("be.visible");
        cy.get('[data-cy="button-connect-gsheet"]')
            .should("be.visible")
            .and("contain.text", "to Google Sheets");
    });

    it("2. Google Sheets - Verify saving data source with Service Account credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${googlesheetsDataSourceName}`,
            "googlesheets",
            googlesheetsApiOptionsServiceAccount
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(googlesheetsDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(googlesheetsDataSourceName)).click();

        fillDSConnectionForm(googlesheetsFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .scrollIntoView()
            .should("be.visible")
            .click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved");
    });

    it("3. Google Sheets - Verify UI (Service Account) and save together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${googlesheetsDataSourceName}`,
            "googlesheets",
            googlesheetsApiOptionsServiceAccount
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(googlesheetsDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(googlesheetsDataSourceName)).click();

        verifyConnectionFormUI(googlesheetsUIConfig.serviceAccountFields);

        fillDSConnectionForm(googlesheetsFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .scrollIntoView()
            .should("be.visible")
            .click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved");
    });
});

/*
 * Test Cases for Google Sheets
 * ============================
 *
 * TC_001: Verify connection form UI elements (OAuth2 default)
 *   - Pre-condition: Data source created via API with oauth2 authentication_type (default)
 *   - Steps: Navigate to data sources page -> Click on googlesheets data source -> Verify dropdown field -> Verify Google Sheets OAuth component
 *   - Expected: Authentication Type dropdown defaults to "OAuth 2.0"; Authorize header, description, and "Connect to Google Sheets" button visible
 *   - Note: react-component-google-sheets is a custom component with non-standard data-cy attributes; verified manually outside verifyConnectionFormUI
 *
 * TC_002: Verify saving data source with Service Account credentials
 *   - Pre-condition: Data source created via API with service_account authentication_type
 *   - Steps: Navigate -> Fill Service Account Key via fillDSConnectionForm -> Click save button
 *   - Expected: Toast "Data Source Saved"
 *   - Credentials: bigquery_private_key (reused; same GCP service account covers Google Sheets API via cloud-platform scope)
 *   - Note: OAuth2 flow requires interactive browser redirect and cannot complete in CI; Service Account path used instead
 *
 * TC_003: Verify UI (Service Account) and save together
 *   - Pre-condition: Data source created via API with service_account authentication_type
 *   - Steps: Navigate -> Verify Service Account UI fields (dropdown + encrypted textarea) -> Fill credentials -> Save
 *   - Expected: UI fields match manifest; save succeeds with toast "Data Source Saved"
 */
