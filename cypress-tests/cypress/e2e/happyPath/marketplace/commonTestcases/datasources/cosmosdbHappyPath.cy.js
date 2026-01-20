import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, openDataSourceConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
import { cosmosdbUIConfig, cosmosdbFormConfig } from "Constants/constants/marketplace/datasources/cosmosdb";

const data = {};

describe("CosmosDB", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const cosmosdbDataSourceName = `cypress-${data.dataSourceName}-cosmosdb`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(cosmosdbDataSourceName);
    });

    it("1. CosmosDB - Verify connection form UI elements", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${cosmosdbDataSourceName}`,
            "cosmosdb",
            [
                { key: "endpoint", value: "", encrypted: false },
                { key: "key", value: null, encrypted: true },
                { key: "database", value: "", encrypted: false },
                { key: "container", value: "", encrypted: false }
            ]
        );

        openDataSourceConnection(cosmosdbDataSourceName);

        verifyConnectionFormUI(cosmosdbUIConfig.defaultFields);
    });

    it("2. CosmosDB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${cosmosdbDataSourceName}`,
            "cosmosdb",
            [
                { key: "endpoint", value: "", encrypted: false },
                { key: "key", value: null, encrypted: true },
                { key: "database", value: "", encrypted: false },
                { key: "container", value: "", encrypted: false }
            ]
        );

        openDataSourceConnection(cosmosdbDataSourceName);

        fillDSConnectionForm(cosmosdbFormConfig, []);

        verifyDSConnection();
    });

    it("3. CosmosDB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${cosmosdbDataSourceName}`,
            "cosmosdb",
            [
                { key: "endpoint", value: "", encrypted: false },
                { key: "key", value: null, encrypted: true },
                { key: "database", value: "", encrypted: false },
                { key: "container", value: "", encrypted: false }
            ]
        );
        openDataSourceConnection(cosmosdbDataSourceName);

        fillDSConnectionForm(cosmosdbFormConfig, cosmosdbFormConfig.invalidEndpoint);
        verifyDSConnection("failed", "Invalid URL");

        fillDSConnectionForm(cosmosdbFormConfig, cosmosdbFormConfig.invalidKey);
        verifyDSConnection("failed", "authorization token can't serve");
    });
});