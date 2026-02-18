import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { postgresQueryConfig, postgresQueryFillConfig } from "Constants/constants/queryPanel/postgres";
import { restapiQueryConfig } from "Constants/constants/queryPanel/restapi";
import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
import { postgresUIConfig, postgresFormConfig } from "Constants/constants/marketplace/datasources/postgres";


describe('Query', () => {
    const data = {};
    data.dataSourceName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.appName = `${fake.companyName}-App`;
    const postgresqlDataSourceName = `cypress-${data.dataSourceName}-postgresql`;
    beforeEach(() => {
        cy.apiLogin();
    });

    it('should verify PostgreSQL query editor', () => {

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
        // cy.get('[data-cy="list-query-select-with-params"]').click();
        fillDSConnectionForm(postgresQueryFillConfig.selectWithParams);

    });



});