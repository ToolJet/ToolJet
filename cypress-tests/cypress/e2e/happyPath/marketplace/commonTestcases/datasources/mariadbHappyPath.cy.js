import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, openDataSourceConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
import { mariadbUIConfig, mariadbFormConfig } from "Constants/constants/marketplace/datasources/mariadb";

const data = {};

describe("MariaDB", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const mariadbDataSourceName = `cypress-${data.dataSourceName}-mariadb`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(mariadbDataSourceName);
    });

    it("1. MariaDB - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mariadbDataSourceName}`,
            "mariadb",
            [
                { key: "connectionLimit", value: 10 }
            ]
        );

        openDataSourceConnection(mariadbDataSourceName);

        verifyConnectionFormUI(mariadbUIConfig.defaultFields);
    });

    it("2. MariaDB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mariadbDataSourceName}`,
            "mariadb",
            [
                { key: "connectionLimit", value: 10 }
            ]
        );

        openDataSourceConnection(mariadbDataSourceName);

        fillDSConnectionForm(mariadbFormConfig, []);

        verifyDSConnection();
    });

    it("3. MariaDB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mariadbDataSourceName}`,
            "mariadb",
            [
                { key: "connectionLimit", value: 10 }
            ]
        );

        openDataSourceConnection(mariadbDataSourceName);

        verifyConnectionFormUI(mariadbUIConfig.defaultFields);

        fillDSConnectionForm(mariadbFormConfig, mariadbFormConfig.invalidHost);
        verifyDSConnection("failed", "Connection test failed: undefined");

        fillDSConnectionForm(mariadbFormConfig, mariadbFormConfig.invalidPort);
        verifyDSConnection("failed", "Connection test failed: undefined");

        fillDSConnectionForm(mariadbFormConfig, mariadbFormConfig.invalidDatabase);
        verifyDSConnection("failed", "Connection test failed: undefined");

        fillDSConnectionForm(mariadbFormConfig, mariadbFormConfig.invalidUsername);
        verifyDSConnection("failed", "Connection test failed: undefined");

        fillDSConnectionForm(mariadbFormConfig, mariadbFormConfig.invalidPassword);
        verifyDSConnection("failed", "Connection test failed: undefined");
    });
});