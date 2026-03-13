import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
import { postgresUIConfig, postgresFormConfig, postgresQueryConfig, postgresQueryFillConfig } from "Constants/constants/marketplace/datasources/postgres";
import { verifyPreviewData } from "Support/utils/dataSource";
import { dataSourceSelector } from "Constants/selectors/dataSource";

const data = {};

describe("PostgreSQL", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    data.appName = `${fake.companyName}-App`;
    const postgresqlDataSourceName = `cypress-${data.dataSourceName}-postgresql`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(postgresqlDataSourceName);
    });

    it("1. PostgreSQL - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${postgresqlDataSourceName}`,
            "postgresql",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 5432, encrypted: false },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "root_cert", value: null, encrypted: true },
                { key: "connection_string", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(postgresqlDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(postgresqlDataSourceName)).click();
        verifyConnectionFormUI(postgresUIConfig.defaultFields);
    });

    it("2. PostgreSQL - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${postgresqlDataSourceName}`,
            "postgresql",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 5432, encrypted: false },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "root_cert", value: null, encrypted: true },
                { key: "connection_string", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(postgresqlDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(postgresqlDataSourceName)).click();

        fillDSConnectionForm(postgresFormConfig, []);

        verifyDSConnection();
    });

    it("3. PostgreSQL - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${postgresqlDataSourceName}`,
            "postgresql",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 5432, encrypted: false },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "root_cert", value: null, encrypted: true },
                { key: "connection_string", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(postgresqlDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(postgresqlDataSourceName)).click();

        verifyConnectionFormUI(postgresUIConfig.defaultFields);

        fillDSConnectionForm(postgresFormConfig, postgresFormConfig.invalidSsl);
        verifyDSConnection("failed", "The server does not support SSL connections");

        fillDSConnectionForm(postgresFormConfig, postgresFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(postgresFormConfig, postgresFormConfig.invalidUsername);
        verifyDSConnection("failed", `password authentication failed for user "invalid-username"`);

        fillDSConnectionForm(postgresFormConfig, postgresFormConfig.invalidPassword);
        verifyDSConnection("failed", `password authentication failed for user "postgres"`);

        fillDSConnectionForm(postgresFormConfig, postgresFormConfig.invalidPort);
        verifyDSConnection("failed", "Knex: Timeout acquiring a connection. The pool is probably full. Are you missing a .transacting(trx) call?");
    });

    it("4. PostgreSQL - Verify query editor", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${postgresqlDataSourceName}`,
            "postgresql",
            [
                { key: "connection_type", value: "manual", encrypted: false },
                { key: "host", value: Cypress.env("pg_host"), encrypted: false },
                { key: "port", value: 5432, encrypted: false },
                { key: "database", value: Cypress.env("pg_database"), encrypted: false },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "username", value: Cypress.env("pg_user"), encrypted: false },
                { key: "password", value: Cypress.env("pg_password"), encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "root_cert", value: null, encrypted: true },
                { key: "connection_string", value: null, encrypted: true },
            ],
            true
        );

        cy.apiCreateApp(data.appName);
        cy.apiAddQueryToApp({
            queryName: "table-creation",
            options: {
                mode: "sql",
                transformationLanguage: "javascript",
                enableTransformation: false,
            },
            dataSourceName: postgresqlDataSourceName,
            dsKind: "postgresql",
        });
        cy.openApp();

        cy.get('[data-cy="list-query-table-creation"]').click();
        verifyConnectionFormUI(postgresQueryConfig.defaultFields);

        // Switch to GUI mode and verify default state
        fillDSConnectionForm(postgresQueryFillConfig.switchToGuiMode);
        verifyConnectionFormUI(postgresQueryConfig.guiModeDefault);

        // Select Bulk update operation and verify UI fields
        fillDSConnectionForm(postgresQueryFillConfig.selectBulkUpdateOperation);
        verifyConnectionFormUI(postgresQueryConfig.bulkUpdateUsingPrimaryKey);

        // Fill bulk update fields
        fillDSConnectionForm(postgresQueryFillConfig.bulkUpdateUsingPrimaryKey);
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get('[data-cy="preview-toggle-button"]').click();
        cy.wait(1000);

        // Switch back to SQL mode and verify updated data
        fillDSConnectionForm(postgresQueryFillConfig.switchToSqlMode);
        fillDSConnectionForm(postgresQueryFillConfig.selectWithParams);
        cy.forceClickOnCanvas();
        cy.wait(5000);
        verifyPreviewData("Bob Smith Updated");
        cy.apiDeleteApp();

    });
});