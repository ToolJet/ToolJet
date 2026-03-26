import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { mariadbUIConfig, mariadbFormConfig } from "Constants/constants/marketplace/datasources/mariadb";

const data = {};

describe("MariaDB", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
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
                { key: "host", value: "", encrypted: false },
                { key: "user", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "connectionLimit", value: 10, encrypted: false },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca", value: null, encrypted: true },
                { key: "cert", value: null, encrypted: true },
                { key: "key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mariadbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mariadbDataSourceName)).click();
        verifyConnectionFormUI(mariadbUIConfig.defaultFields);
    });

    it("2. MariaDB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mariadbDataSourceName}`,
            "mariadb",
            [
                { key: "host", value: "", encrypted: false },
                { key: "user", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "connectionLimit", value: 10, encrypted: false },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca", value: null, encrypted: true },
                { key: "cert", value: null, encrypted: true },
                { key: "key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mariadbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mariadbDataSourceName)).click();

        fillDSConnectionForm(mariadbFormConfig, []);

        verifyDSConnection();
    });

    it("3. MariaDB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mariadbDataSourceName}`,
            "mariadb",
            [
                { key: "host", value: "", encrypted: false },
                { key: "user", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "connectionLimit", value: 10, encrypted: false },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca", value: null, encrypted: true },
                { key: "cert", value: null, encrypted: true },
                { key: "key", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mariadbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mariadbDataSourceName)).click();

        verifyConnectionFormUI(mariadbUIConfig.defaultFields);

        fillDSConnectionForm(mariadbFormConfig, mariadbFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(mariadbFormConfig, mariadbFormConfig.invalidUsername);
        verifyDSConnection("failed", "Access denied for user 'invalid-username'");

        fillDSConnectionForm(mariadbFormConfig, mariadbFormConfig.invalidPassword);
        verifyDSConnection("failed", "Access denied for user");

        fillDSConnectionForm(mariadbFormConfig, mariadbFormConfig.invalidPort);
        verifyDSConnection("failed", "connect ETIMEDOUT");

        fillDSConnectionForm(mariadbFormConfig, mariadbFormConfig.invalidDatabase);
        verifyDSConnection("failed", "Unknown database 'nonexistent_database'");
    });
});
