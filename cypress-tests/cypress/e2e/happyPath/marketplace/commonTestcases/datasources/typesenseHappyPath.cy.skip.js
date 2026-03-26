import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { typesenseUIConfig, typesenseFormConfig } from "Constants/constants/marketplace/datasources/typesense";

const data = {};

describe("TypeSense", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const typesenseDataSourceName = `cypress-${data.dataSourceName}-typesense`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(typesenseDataSourceName);
    });

    it("1. TypeSense - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${typesenseDataSourceName}`,
            "typesense",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 8108, encrypted: false },
                { key: "api_key", value: null, encrypted: true },
                { key: "protocol", value: "http", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(typesenseDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(typesenseDataSourceName)).click();
        verifyConnectionFormUI(typesenseUIConfig.defaultFields);
    });

    it("2. TypeSense - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${typesenseDataSourceName}`,
            "typesense",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 8108, encrypted: false },
                { key: "api_key", value: null, encrypted: true },
                { key: "protocol", value: "http", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(typesenseDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(typesenseDataSourceName)).click();

        fillDSConnectionForm(typesenseFormConfig, []);

        verifyDSConnection();
    });

    it("3. TypeSense - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${typesenseDataSourceName}`,
            "typesense",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 8108, encrypted: false },
                { key: "api_key", value: null, encrypted: true },
                { key: "protocol", value: "http", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(typesenseDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(typesenseDataSourceName)).click();

        verifyConnectionFormUI(typesenseUIConfig.defaultFields);

        fillDSConnectionForm(typesenseFormConfig, typesenseFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(typesenseFormConfig, typesenseFormConfig.invalidApiKey);
        verifyDSConnection("failed", "Request failed with HTTP code 401");
    });
});
