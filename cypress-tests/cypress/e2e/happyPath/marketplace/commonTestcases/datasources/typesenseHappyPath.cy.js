import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, openDataSourceConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
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
                { key: "port", value: "8108", encrypted: false },
                { key: "api_key", value: "", encrypted: true },
                { key: "protocol", value: "http", encrypted: false }
            ]
        );

        openDataSourceConnection(typesenseDataSourceName);

        verifyConnectionFormUI(typesenseUIConfig.defaultFields);
    });

    it.skip("2. TypeSense - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${typesenseDataSourceName}`,
            "typesense",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: "8108", encrypted: false },
                { key: "api_key", value: "", encrypted: true },
                { key: "protocol", value: "http", encrypted: false }
            ]
        );

        openDataSourceConnection(typesenseDataSourceName);

        fillDSConnectionForm(typesenseFormConfig, []);

        verifyDSConnection();
    });

    it.skip("3. TypeSense - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${typesenseDataSourceName}`,
            "typesense",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: "8108", encrypted: false },
                { key: "api_key", value: "", encrypted: true },
                { key: "protocol", value: "http", encrypted: false }
            ]
        );

        openDataSourceConnection(typesenseDataSourceName);

        verifyConnectionFormUI(typesenseUIConfig.defaultFields);

        fillDSConnectionForm(typesenseFormConfig, typesenseFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(typesenseFormConfig, typesenseFormConfig.invalidPort);
        verifyDSConnection("failed", "Connection refused");

        fillDSConnectionForm(typesenseFormConfig, typesenseFormConfig.invalidApiKey);
        verifyDSConnection("failed", "Invalid API key");

        fillDSConnectionForm(typesenseFormConfig, typesenseFormConfig.httpsProtocol);
        verifyDSConnection("failed", "SSL connection failed");
    });
});