import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, openDataSourceConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
import { influxdbUIConfig, influxdbFormConfig } from "Constants/constants/marketplace/datasources/influxdb";

const data = {};

describe("InfluxDB", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const influxdbDataSourceName = `cypress-${data.dataSourceName}-influxdb`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(influxdbDataSourceName);
    });

    it("1. InfluxDB - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${influxdbDataSourceName}`,
            "influxdb",
            [
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ssl", value: false, encrypted: false }
            ]
        );
        openDataSourceConnection(influxdbDataSourceName);
        verifyConnectionFormUI(influxdbUIConfig.defaultFields);
    });

    it("2. InfluxDB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${influxdbDataSourceName}`,
            "influxdb",
            [
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ssl", value: false, encrypted: false }
            ]
        );
        openDataSourceConnection(influxdbDataSourceName);

        fillDSConnectionForm(influxdbFormConfig, []);

        verifyDSConnection();
    });

    it("3. InfluxDB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${influxdbDataSourceName}`,
            "influxdb",
            [
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ssl", value: false, encrypted: false }
            ]
        );
        openDataSourceConnection(influxdbDataSourceName);

        verifyDSConnection("failed", "Invalid URL");

        fillDSConnectionForm(influxdbFormConfig, influxdbFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        //Note: taking too long to respond
        // fillDSConnectionForm(influxdbFormConfig, influxdbFormConfig.invalidPort);
        // verifyDSConnection("failed", "Invalid URL");

        //Note: not dependent on API token
        // fillDSConnectionForm(influxdbFormConfig, influxdbFormConfig.invalidToken);
        // verifyDSConnection("failed", "Authentication failed");

        fillDSConnectionForm(influxdbFormConfig, influxdbFormConfig.invalidProtocol);
        verifyDSConnection("failed", "SSL routines:ssl3_get_record:wrong version number");
    });
});