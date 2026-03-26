import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { rethinkdbUIConfig, rethinkdbFormConfig } from "Constants/constants/marketplace/datasources/rethinkdb";

const data = {};

describe("RethinkDB", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const rethinkdbDataSourceName = `cypress-${data.dataSourceName}-rethinkdb`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(rethinkdbDataSourceName);
    });

    it("1. RethinkDB - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${rethinkdbDataSourceName}`,
            "rethinkdb",
            [
                { key: "database", value: "", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "port", value: "28015", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(rethinkdbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(rethinkdbDataSourceName)).click();
        verifyConnectionFormUI(rethinkdbUIConfig.defaultFields);
    });

    it("2. RethinkDB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${rethinkdbDataSourceName}`,
            "rethinkdb",
            [
                { key: "database", value: "", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "port", value: "28015", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(rethinkdbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(rethinkdbDataSourceName)).click();

        fillDSConnectionForm(rethinkdbFormConfig, []);

        verifyDSConnection();
    });

    it("3. RethinkDB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${rethinkdbDataSourceName}`,
            "rethinkdb",
            [
                { key: "database", value: "", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "port", value: "28015", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(rethinkdbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(rethinkdbDataSourceName)).click();

        verifyConnectionFormUI(rethinkdbUIConfig.defaultFields);

        fillDSConnectionForm(rethinkdbFormConfig, rethinkdbFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(rethinkdbFormConfig, rethinkdbFormConfig.invalidPort);
        verifyDSConnection("failed", "connect ECONNREFUSED");
    });
});
