import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { baserowUIConfig, baserowFormConfig } from "Constants/constants/marketplace/datasources/baserow";

const data = {};

describe("Baserow", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const baserowDataSourceName = `cypress-${data.dataSourceName}-baserow`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(baserowDataSourceName);
    });

    it("1. Baserow - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${baserowDataSourceName}`,
            "baserow",
            [
                { key: "baserow_host", value: "baserow_cloud", encrypted: false },
                { key: "api_token", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(baserowDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(baserowDataSourceName)).click();
        verifyConnectionFormUI(baserowUIConfig.defaultFields);
    });

    it("2. Baserow - Verify data source save with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${baserowDataSourceName}`,
            "baserow",
            [
                { key: "baserow_host", value: "baserow_cloud", encrypted: false },
                { key: "api_token", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(baserowDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(baserowDataSourceName)).click();

        fillDSConnectionForm(baserowFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .scrollIntoView()
            .should("be.visible")
            .click();
    });

    it("3. Baserow - Verify UI and save together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${baserowDataSourceName}`,
            "baserow",
            [
                { key: "baserow_host", value: "baserow_cloud", encrypted: false },
                { key: "api_token", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(baserowDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(baserowDataSourceName)).click();

        verifyConnectionFormUI(baserowUIConfig.defaultFields);

        fillDSConnectionForm(baserowFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .scrollIntoView()
            .should("be.visible")
            .click();
    });
});
