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
        cy.on("uncaught:exception", () => false);
        cy.apiLogin();
        cy.viewport(1400, 1600);
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
                { key: "private_key", value: null, encrypted: true }
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
                { key: "private_key", value: null, encrypted: true }
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
                { key: "private_key", value: null, encrypted: true }
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
