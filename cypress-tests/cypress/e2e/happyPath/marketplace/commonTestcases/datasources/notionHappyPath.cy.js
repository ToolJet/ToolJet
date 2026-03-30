import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { notionUIConfig, notionFormConfig } from "Constants/constants/marketplace/datasources/notion";

const data = {};

describe("Notion", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const notionDataSourceName = `cypress-${data.dataSourceName}-notion`;
    beforeEach(() => {
        cy.on("uncaught:exception", () => false);
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(notionDataSourceName);
    });

    it("1. Notion - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${notionDataSourceName}`,
            "notion",
            [
                { key: "token", value: null, encrypted: true }
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(notionDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(notionDataSourceName)).click();
        verifyConnectionFormUI(notionUIConfig.defaultFields);
    });

    it("2. Notion - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${notionDataSourceName}`,
            "notion",
            [
                { key: "token", value: null, encrypted: true }
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(notionDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(notionDataSourceName)).click();

        fillDSConnectionForm(notionFormConfig, []);

        verifyDSConnection();
    });

    it("3. Notion - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${notionDataSourceName}`,
            "notion",
            [
                { key: "token", value: null, encrypted: true }
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(notionDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(notionDataSourceName)).click();

        verifyConnectionFormUI(notionUIConfig.defaultFields);

        fillDSConnectionForm(notionFormConfig, notionFormConfig.invalidToken);
        verifyDSConnection("failed", "API token is invalid");
    });
});
