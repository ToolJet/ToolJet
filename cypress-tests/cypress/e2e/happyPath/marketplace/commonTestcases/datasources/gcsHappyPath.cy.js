import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { gcsUIConfig, gcsFormConfig } from "Constants/constants/marketplace/datasources/gcs";

const data = {};

describe("GCS", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const gcsDataSourceName = `cypress-${data.dataSourceName}-gcs`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(gcsDataSourceName);
    });

    it("1. GCS - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${gcsDataSourceName}`,
            "gcs",
            [
                { key: "private_key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(gcsDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(gcsDataSourceName)).click();
        verifyConnectionFormUI(gcsUIConfig.defaultFields);
    });

    it("2. GCS - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${gcsDataSourceName}`,
            "gcs",
            [
                { key: "private_key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(gcsDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(gcsDataSourceName)).click();

        fillDSConnectionForm(gcsFormConfig, []);

        verifyDSConnection();
    });

    it("3. GCS - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${gcsDataSourceName}`,
            "gcs",
            [
                { key: "private_key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(gcsDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(gcsDataSourceName)).click();

        verifyConnectionFormUI(gcsUIConfig.defaultFields);

        fillDSConnectionForm(gcsFormConfig, gcsFormConfig.invalidPrivateKey);
        verifyDSConnection("failed", "Unexpected token");
    });
});

/*
 * Test Cases for GCS
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with null private_key (encrypted)
 *   - Steps: Navigate to data sources page -> Click on data source -> Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Private key (encrypted, placeholder: "**************", disabled with edit button)
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with null private_key (encrypted)
 *   - Steps: Navigate to data sources page -> Click on data source -> Fill valid credentials -> Test connection
 *   - Expected: Toast message "Test connection verified" appears
 *   - Credentials: gcs_private_key (JSON stringified service account key)
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with null private_key (encrypted)
 *   - Steps: Navigate -> Verify UI -> Fill invalid private key -> Test connection
 *   - Expected:
 *     - Invalid Private key: Connection fails with "Unexpected token"
 */
