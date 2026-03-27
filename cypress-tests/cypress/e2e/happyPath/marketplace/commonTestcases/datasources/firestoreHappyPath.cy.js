import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { firestoreUIConfig, firestoreFormConfig } from "Constants/constants/marketplace/datasources/firestore";

const data = {};

describe("Firestore", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const firestoreDataSourceName = `cypress-${data.dataSourceName}-firestore`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(firestoreDataSourceName);
    });

    it("1. Firestore - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${firestoreDataSourceName}`,
            "firestore",
            [
                { key: "gcp_key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(firestoreDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(firestoreDataSourceName)).click();
        verifyConnectionFormUI(firestoreUIConfig.defaultFields);
    });

    it("2. Firestore - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${firestoreDataSourceName}`,
            "firestore",
            [
                { key: "gcp_key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(firestoreDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(firestoreDataSourceName)).click();

        fillDSConnectionForm(firestoreFormConfig, []);

        verifyDSConnection();
    });

    it("3. Firestore - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${firestoreDataSourceName}`,
            "firestore",
            [
                { key: "gcp_key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(firestoreDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(firestoreDataSourceName)).click();

        verifyConnectionFormUI(firestoreUIConfig.defaultFields);

        fillDSConnectionForm(firestoreFormConfig, firestoreFormConfig.invalidPrivateKey);
        verifyDSConnection("failed", "Unexpected token");
    });
});

/*
 * Test Cases for Firestore
 * =========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with null gcp_key (encrypted)
 *   - Steps: Navigate to data sources page → Click on data source → Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Private key (encrypted, placeholder: "**************", disabled with edit button)
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with null gcp_key
 *   - Steps: Navigate to data sources page → Click on data source → Fill valid credentials → Test connection
 *   - Expected: Toast message "Test connection verified" appears
 *   - Credentials: firestore_private_key (JSON stringified)
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with null gcp_key
 *   - Steps: Navigate → Verify UI → Fill invalid private key → Test connection
 *   - Expected:
 *     - Invalid Private key: Connection fails with "Unexpected token"
 */
