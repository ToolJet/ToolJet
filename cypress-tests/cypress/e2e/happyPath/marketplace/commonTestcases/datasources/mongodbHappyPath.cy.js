import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, fillDSConnectionDropdown } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
import { mongodbUIConfig, mongodbFormConfig } from "Constants/constants/marketplace/datasources/mongodb";

const data = {};

describe("MongoDB", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const mongodbDataSourceName = `cypress-${data.dataSourceName}-mongodb`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(mongodbDataSourceName);
    });

    it("1. MongoDB - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mongodbDataSourceName}`,
            "mongodb",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "connection_format", value: "mongodb", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "tls_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "connection_string", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mongodbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mongodbDataSourceName)).click();
        verifyConnectionFormUI(mongodbUIConfig.defaultFieldsManual);
        fillDSConnectionDropdown({ type: "dropdown", fieldName: "Connection type", text: "Connect using connection string" });
        verifyConnectionFormUI(mongodbUIConfig.defaultFieldsConnectionString);

    });

    it("2. MongoDB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mongodbDataSourceName}`,
            "mongodb",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "connection_format", value: "mongodb", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "tls_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "connection_string", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mongodbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mongodbDataSourceName)).click();

        fillDSConnectionForm(mongodbFormConfig.valid, []);

        verifyDSConnection();
        // Note: need to get new creds
        // fillDSConnectionForm(mongodbFormConfig.validConnectionString, []);
        // verifyDSConnection();
    });

    it("3. MongoDB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${mongodbDataSourceName}`,
            "mongodb",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "connection_format", value: "mongodb", encrypted: false },
                { key: "host", value: "", encrypted: false },
                { key: "port", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "tls_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "connection_string", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(mongodbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(mongodbDataSourceName)).click();

        fillDSConnectionForm(mongodbFormConfig, mongodbFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(mongodbFormConfig, mongodbFormConfig.invalidPort);
        verifyDSConnection("failed", "connection timed out");


        // Note: need to get new creds
        // fillDSConnectionForm(mongodbFormConfig, mongodbFormConfig.validConnectionString);
        // verifyDSConnection();
    });
});