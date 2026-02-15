import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, openDataSourceConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
import { redisUIConfig, redisFormConfig } from "Constants/constants/marketplace/datasources/redis";

const data = {};

describe("Redis", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const redisDataSourceName = `cypress-${data.dataSourceName}-redis`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(redisDataSourceName);
    });

    it("1. Redis - Verify connection form UI elements", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${redisDataSourceName}`,
            "redis",
            [
                { key: "scheme", value: "redis", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 6379, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: false },
                { key: "tls_enabled", value: false, encrypted: false },
                { key: "tls_certificate", value: "none", encrypted: false },
                { key: "ca_cert", value: null, encrypted: false },
                { key: "client_key", value: null, encrypted: false },
                { key: "client_cert", value: null, encrypted: false },
            ]
        );
        openDataSourceConnection(redisDataSourceName);
        verifyConnectionFormUI(redisUIConfig.defaultFields);
    });

    it("2. Redis - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${redisDataSourceName}`,
            "redis",
            [
                { key: "scheme", value: "redis", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 6379, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: false },
                { key: "tls_enabled", value: false, encrypted: false },
                { key: "tls_certificate", value: "none", encrypted: false },
                { key: "ca_cert", value: null, encrypted: false },
                { key: "client_key", value: null, encrypted: false },
                { key: "client_cert", value: null, encrypted: false },
            ]
        );
        openDataSourceConnection(redisDataSourceName);

        fillDSConnectionForm(redisFormConfig, []);

        verifyDSConnection();
    });

    it("3. Redis - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${redisDataSourceName}`,
            "redis",
            [
                { key: "scheme", value: "redis", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 6379, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: false },
                { key: "tls_enabled", value: false, encrypted: false },
                { key: "tls_certificate", value: "none", encrypted: false },
                { key: "ca_cert", value: null, encrypted: false },
                { key: "client_key", value: null, encrypted: false },
                { key: "client_cert", value: null, encrypted: false },
            ]
        );
        openDataSourceConnection(redisDataSourceName);

        fillDSConnectionForm(redisFormConfig, redisFormConfig.invalidHost);
        verifyDSConnection("failed", "Connection could not be established");

        fillDSConnectionForm(redisFormConfig, redisFormConfig.invalidPort);
        verifyDSConnection("failed", "Connection could not be established");
    });
});