import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, openDataSourceConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
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

    // afterEach(() => {
    //     cy.apiDeleteDataSource(rethinkdbDataSourceName);
    // });

    it.only("1. RethinkDB - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${rethinkdbDataSourceName}`,
            "rethinkdb",
            [
                { key: "port", value: "28015", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: true }
            ]
        );

        openDataSourceConnection(rethinkdbDataSourceName);

        verifyConnectionFormUI(rethinkdbUIConfig.defaultFields);
    });

    it("2. RethinkDB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${rethinkdbDataSourceName}`,
            "rethinkdb",
            [
                { key: "port", value: "28015", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: true }
            ]
        );

        openDataSourceConnection(rethinkdbDataSourceName);

        fillDSConnectionForm(rethinkdbFormConfig, []);

        verifyDSConnection();
    });

    it("3. RethinkDB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${rethinkdbDataSourceName}`,
            "rethinkdb",
            [
                { key: "port", value: "28015", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: true }
            ]
        );

        openDataSourceConnection(rethinkdbDataSourceName);

        verifyConnectionFormUI(rethinkdbUIConfig.defaultFields);

        fillDSConnectionForm(rethinkdbFormConfig, rethinkdbFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(rethinkdbFormConfig, rethinkdbFormConfig.invalidPort);
        verifyDSConnection("failed", "Connection refused");

        fillDSConnectionForm(rethinkdbFormConfig, rethinkdbFormConfig.invalidDatabase);
        verifyDSConnection("failed", "Database does not exist");

        fillDSConnectionForm(rethinkdbFormConfig, rethinkdbFormConfig.invalidUsername);
        verifyDSConnection("failed", "Authentication failed");

        fillDSConnectionForm(rethinkdbFormConfig, rethinkdbFormConfig.invalidPassword);
        verifyDSConnection("failed", "Authentication failed");
    });
});