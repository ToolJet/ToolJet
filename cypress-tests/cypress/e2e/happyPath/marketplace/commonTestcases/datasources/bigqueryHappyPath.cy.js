import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { bigqueryUIConfig, bigqueryFormConfig } from "Constants/constants/marketplace/datasources/bigquery";

const data = {};

describe("BigQuery", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const bigqueryDataSourceName = `cypress-${data.dataSourceName}-bigquery`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(bigqueryDataSourceName);
    });

    it("1. BigQuery - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${bigqueryDataSourceName}`,
            "bigquery",
            [
                { key: "private_key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(bigqueryDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(bigqueryDataSourceName)).click();
        verifyConnectionFormUI(bigqueryUIConfig.defaultFields);
    });

    it("2. BigQuery - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${bigqueryDataSourceName}`,
            "bigquery",
            [
                { key: "private_key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(bigqueryDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(bigqueryDataSourceName)).click();

        fillDSConnectionForm(bigqueryFormConfig, []);

        verifyDSConnection();
    });

    it("3. BigQuery - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${bigqueryDataSourceName}`,
            "bigquery",
            [
                { key: "private_key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(bigqueryDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(bigqueryDataSourceName)).click();

        verifyConnectionFormUI(bigqueryUIConfig.defaultFields);

        fillDSConnectionForm(bigqueryFormConfig, bigqueryFormConfig.invalidPrivateKey);
        verifyDSConnection("failed", "Unexpected token");
    });
});

/*
 * Test Cases for BigQuery
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with null private_key (encrypted)
 *   - Steps: Navigate to data sources page → Click on data source → Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Private key (encrypted, required, placeholder: "**************", disabled with edit button),
 *                       Scope (input, placeholder: "Enter required scopes")
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with null private_key (encrypted)
 *   - Steps: Navigate to data sources page → Click on data source → Fill valid credentials → Test connection
 *   - Expected: Toast message "Test connection verified" appears
 *   - Credentials: bigquery_private_key, bigquery_scope
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with null private_key (encrypted)
 *   - Steps: Navigate → Verify UI → Fill invalid private key → Test connection
 *   - Expected:
 *     - Invalid Private key: Connection fails with "Unexpected token"
 */
