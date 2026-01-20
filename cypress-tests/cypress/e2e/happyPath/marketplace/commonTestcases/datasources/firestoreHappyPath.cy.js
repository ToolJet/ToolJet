import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, openDataSourceConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
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
                { key: "gcp_key", value: "", encrypted: true }
            ]
        );

        openDataSourceConnection(firestoreDataSourceName);

        verifyConnectionFormUI(firestoreUIConfig.defaultFields);
    });

    it("2. Firestore - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${firestoreDataSourceName}`,
            "firestore",
            [
                { key: "gcp_key", value: "", encrypted: true }
            ]
        );

        openDataSourceConnection(firestoreDataSourceName);

        fillDSConnectionForm(firestoreFormConfig, []);

        verifyDSConnection();
    });

    it("3. Firestore - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${firestoreDataSourceName}`,
            "firestore",
            [
                { key: "gcp_key", value: "", encrypted: true }
            ]
        );

        openDataSourceConnection(firestoreDataSourceName);

        fillDSConnectionForm(firestoreFormConfig, firestoreFormConfig.invalidPrivateKey);

        verifyDSConnection("failed", "GCP key could not be parsed as a valid JSON object");
    });
});