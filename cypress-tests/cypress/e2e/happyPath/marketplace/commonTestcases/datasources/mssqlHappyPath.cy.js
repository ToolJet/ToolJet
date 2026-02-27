import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, openDataSourceConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
import { mssqlUIConfig, mssqlFormConfig } from "Constants/constants/marketplace/datasources/mssql";

const data = {};

describe("MSSQL", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const mssqlDataSourceName = `cypress-${data.dataSourceName}-mssql`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(mssqlDataSourceName);
    });

    it("1. MSSQL - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mssqlDataSourceName}`,
            "mssql",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 1433, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "azure", value: false, encrypted: false },
                { key: "password", value: null, encrypted: true },
            ]
        );

        openDataSourceConnection(mssqlDataSourceName);

        verifyConnectionFormUI(mssqlUIConfig.defaultFields);
    });

    it("2. MSSQL - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mssqlDataSourceName}`,
            "mssql",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 1433, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "azure", value: false, encrypted: false },
                { key: "password", value: null, encrypted: true },
            ]
        );

        openDataSourceConnection(mssqlDataSourceName);

        fillDSConnectionForm(mssqlFormConfig, []);

        verifyDSConnection();
    });

    it("3. MSSQL - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mssqlDataSourceName}`,
            "mssql",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 1433, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "azure", value: false, encrypted: false },
                { key: "password", value: null, encrypted: true },
            ]
        );

        openDataSourceConnection(mssqlDataSourceName);

        fillDSConnectionForm(mssqlFormConfig, mssqlFormConfig.invalidHost);
        verifyDSConnection("failed", "Failed to connect to invalid-host:1433 - getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(mssqlFormConfig, mssqlFormConfig.invalidUsername);
        verifyDSConnection("failed", "Login failed for user 'invalid-username'.");

        fillDSConnectionForm(mssqlFormConfig, mssqlFormConfig.invalidPassword);
        verifyDSConnection("failed", "Login failed for user 'sa'.");

        fillDSConnectionForm(mssqlFormConfig, mssqlFormConfig.invalidPort);
        verifyDSConnection("failed", "Failed to connect to 9.234.17.31:9999 in 15000ms");

        fillDSConnectionForm(mssqlFormConfig, mssqlFormConfig.invalidDatabase);
        verifyDSConnection("failed", "Login failed for user 'sa'.");
    });
});