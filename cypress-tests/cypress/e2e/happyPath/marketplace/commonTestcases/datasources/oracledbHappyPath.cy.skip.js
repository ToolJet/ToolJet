import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { oracledbUIConfig, oracledbFormConfig } from "Constants/constants/marketplace/datasources/oracledb";

const data = {};

describe("Oracle DB", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const oracledbDataSourceName = `cypress-${data.dataSourceName}-oracledb`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(oracledbDataSourceName);
    });

    it("1. Oracle DB - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${oracledbDataSourceName}`,
            "oracledb",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 1521, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "database_type", value: "SID", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "client_path_type", value: "default", encrypted: false },
                { key: "instant_client_version", value: "21_10", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(oracledbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(oracledbDataSourceName)).click();
        verifyConnectionFormUI(oracledbUIConfig.defaultFields);
    });

    it("2. Oracle DB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${oracledbDataSourceName}`,
            "oracledb",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 1521, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "database_type", value: "SID", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "client_path_type", value: "default", encrypted: false },
                { key: "instant_client_version", value: "21_10", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(oracledbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(oracledbDataSourceName)).click();

        fillDSConnectionForm(oracledbFormConfig, []);

        verifyDSConnection();
    });

    it("3. Oracle DB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${oracledbDataSourceName}`,
            "oracledb",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 1521, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "database_type", value: "SID", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "client_path_type", value: "default", encrypted: false },
                { key: "instant_client_version", value: "21_10", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(oracledbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(oracledbDataSourceName)).click();

        verifyConnectionFormUI(oracledbUIConfig.defaultFields);

        fillDSConnectionForm(oracledbFormConfig, oracledbFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(oracledbFormConfig, oracledbFormConfig.invalidUsername);
        verifyDSConnection("failed", "ORA-01017");

        fillDSConnectionForm(oracledbFormConfig, oracledbFormConfig.invalidPassword);
        verifyDSConnection("failed", "ORA-01017");

        fillDSConnectionForm(oracledbFormConfig, oracledbFormConfig.invalidPort);
        verifyDSConnection("failed", "Failed to connect");

        fillDSConnectionForm(oracledbFormConfig, oracledbFormConfig.invalidDatabase);
        verifyDSConnection("failed", "ORA-12505");
    });
});
