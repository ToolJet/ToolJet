import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { azureblobstorageUIConfig, azureblobstorageFormConfig } from "Constants/constants/marketplace/datasources/azureblobstorage";

const data = {};

describe("Azure Blob Storage", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const azureblobstorageDataSourceName = `cypress-${data.dataSourceName}-azureblobstorage`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(azureblobstorageDataSourceName);
    });

    it("1. Azure Blob Storage - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${azureblobstorageDataSourceName}`,
            "azureblobstorage",
            [
                { key: "connection_string", value: "", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(azureblobstorageDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(azureblobstorageDataSourceName)).click();
        verifyConnectionFormUI(azureblobstorageUIConfig.defaultFields);
    });

    it("2. Azure Blob Storage - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${azureblobstorageDataSourceName}`,
            "azureblobstorage",
            [
                { key: "connection_string", value: "", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(azureblobstorageDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(azureblobstorageDataSourceName)).click();

        fillDSConnectionForm(azureblobstorageFormConfig, []);

        verifyDSConnection();
    });

    it("3. Azure Blob Storage - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${azureblobstorageDataSourceName}`,
            "azureblobstorage",
            [
                { key: "connection_string", value: "", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(azureblobstorageDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(azureblobstorageDataSourceName)).click();

        verifyConnectionFormUI(azureblobstorageUIConfig.defaultFields);

        fillDSConnectionForm(azureblobstorageFormConfig, azureblobstorageFormConfig.invalidConnectionString);
        verifyDSConnection("failed", "Invalid URL");
    });
});

/*
 * Test Cases for Azure Blob Storage
 * ==================================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with empty connection_string
 *   - Steps: Navigate to data sources page → Click on data source → Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Connection string (input, placeholder: "Enter connection string")
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with empty connection_string
 *   - Steps: Navigate to data sources page → Click on data source → Fill valid credentials → Test connection
 *   - Expected: Toast message "Test connection verified" appears
 *   - Credentials: azure_blob_storage_connection_string
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with empty connection_string
 *   - Steps: Navigate → Verify UI → Fill invalid connection string → Test connection
 *   - Expected:
 *     - Invalid Connection string: Connection fails with "Invalid URL"
 */
