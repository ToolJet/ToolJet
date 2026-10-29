import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
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
        cy.on("uncaught:exception", () => false);
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
                { key: "api_token", value: null, encrypted: true },
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "8086", encrypted: false },
                { key: "protocol", value: "http", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(influxdbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(influxdbDataSourceName)).click();
        verifyConnectionFormUI(influxdbUIConfig.defaultFields);
    });

    it("2. InfluxDB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${influxdbDataSourceName}`,
            "influxdb",
            [
                { key: "api_token", value: null, encrypted: true },
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "8086", encrypted: false },
                { key: "protocol", value: "http", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(influxdbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(influxdbDataSourceName)).click();

        fillDSConnectionForm(influxdbFormConfig, []);

        verifyDSConnection();
    });

    it("3. InfluxDB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${influxdbDataSourceName}`,
            "influxdb",
            [
                { key: "api_token", value: null, encrypted: true },
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "8086", encrypted: false },
                { key: "protocol", value: "http", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(influxdbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(influxdbDataSourceName)).click();

        verifyConnectionFormUI(influxdbUIConfig.defaultFields);

        fillDSConnectionForm(influxdbFormConfig, influxdbFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");
    });
});

/*
 * Test Cases for InfluxDB
 * =======================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with default options (api_token, host, port, protocol)
 *   - Steps: Navigate to data sources page -> Click on influxdb data source -> Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: API token, Host, Port, Protocol
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Fill valid credentials via fillDSConnectionForm -> Test connection
 *   - Expected: Toast "Test connection verified"
 *   - Credentials: influxdb_token, influxdb_host, influxdb_port
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Verify UI fields -> Fill invalid host -> Test connection
 *   - Expected: UI fields match manifest; invalid host returns "getaddrinfo ENOTFOUND invalid-host"
 */
