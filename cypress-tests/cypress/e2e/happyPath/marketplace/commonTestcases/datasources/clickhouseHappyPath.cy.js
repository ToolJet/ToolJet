import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, openDataSourceConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
import { clickhouseUIConfig, clickhouseFormConfig } from "Constants/constants/marketplace/datasources/clickhouse";

const data = {};

describe("ClickHouse", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const clickhouseDataSourceName = `cypress-${data.dataSourceName}-clickhouse`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(clickhouseDataSourceName);
    });

    it("1. ClickHouse - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${clickhouseDataSourceName}`,
            "clickhouse",
            [
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true }
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(clickhouseDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(clickhouseDataSourceName)).click();
        verifyConnectionFormUI(clickhouseUIConfig.defaultFields);
    });

    it("2. ClickHouse - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${clickhouseDataSourceName}`,
            "clickhouse",
            [
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true }
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(clickhouseDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(clickhouseDataSourceName)).click();

        fillDSConnectionForm(clickhouseFormConfig, []);

        verifyDSConnection();
    });

    it("3. ClickHouse - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${clickhouseDataSourceName}`,
            "clickhouse",
            [
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true }
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(clickhouseDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(clickhouseDataSourceName)).click();

        verifyConnectionFormUI(clickhouseUIConfig.defaultFields);

        fillDSConnectionForm(clickhouseFormConfig, clickhouseFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(clickhouseFormConfig, clickhouseFormConfig.invalidPort);
        verifyDSConnection("failed", "Timeout error.");

        fillDSConnectionForm(clickhouseFormConfig, clickhouseFormConfig.invalidDatabase);
        verifyDSConnection("failed", "Database `invalid-database` does not exist");

        fillDSConnectionForm(clickhouseFormConfig, clickhouseFormConfig.invalidUsername);
        verifyDSConnection("failed", "Authentication failed");

        fillDSConnectionForm(clickhouseFormConfig, clickhouseFormConfig.invalidPassword);
        verifyDSConnection("failed", "Authentication failed");

        fillDSConnectionForm(clickhouseFormConfig, clickhouseFormConfig.invalidProtocol);
        verifyDSConnection("failed", "SSL routines:ssl3_get_record:wrong version number");
    });
});