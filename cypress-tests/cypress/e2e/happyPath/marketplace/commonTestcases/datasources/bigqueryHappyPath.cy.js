import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, openDataSourceConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
import { bigqueryUIConfig, bigqueryFormConfig } from "Constants/constants/marketplace/datasources/bigquery";

const data = {};

describe("BigQuery", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const bigqueryDataSourceName = `cypress-${data.dataSourceName}-bigquery`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(bigqueryDataSourceName);
    });

    it("1. BigQuery - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${bigqueryDataSourceName}`,
            "bigquery",
            [
                { key: "private_key", value: null, encrypted: true }
            ]
        );

        openDataSourceConnection(bigqueryDataSourceName);

        verifyConnectionFormUI(bigqueryUIConfig.defaultFields);
    });

    it("2. BigQuery - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${bigqueryDataSourceName}`,
            "bigquery",
            [
                { key: "private_key", value: null, encrypted: true }
            ]
        );

        openDataSourceConnection(bigqueryDataSourceName);

        fillDSConnectionForm(bigqueryFormConfig, []);

        verifyDSConnection();
    });

    it("3. BigQuery - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${bigqueryDataSourceName}`,
            "bigquery",
            [
                { key: "private_key", value: null, encrypted: true }
            ]
        );
        openDataSourceConnection(bigqueryDataSourceName);

        verifyDSConnection("failed", "client_email field");

        fillDSConnectionForm(bigqueryFormConfig, bigqueryFormConfig.invalidPrivateKey);
        verifyDSConnection("failed", "invalid character");

        fillDSConnectionForm(bigqueryFormConfig, bigqueryFormConfig.invalidScope);
        verifyDSConnection("failed", "invalid authentication credentials");

    });
});