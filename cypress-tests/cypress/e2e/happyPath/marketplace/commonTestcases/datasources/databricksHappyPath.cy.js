import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, openDataSourceConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
import { databricksUIConfig, databricksFormConfig } from "Constants/constants/marketplace/datasources/databricks";

const data = {};

describe("Databricks", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const databricksDataSourceName = `cypress-${data.dataSourceName}-databricks`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(databricksDataSourceName);
    });

    it("1. Databricks - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${databricksDataSourceName}`,
            "databricks",
            [
                { key: "host", value: "", encrypted: false },
                { key: "path", value: "", encrypted: false },
                { key: "access_token", value: null, encrypted: true },
                { key: "port", value: "", encrypted: false }
            ]
        );
        openDataSourceConnection(databricksDataSourceName);
        verifyConnectionFormUI(databricksUIConfig.defaultFields);
    });

    it.skip("2. Databricks - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${databricksDataSourceName}`,
            "databricks",
            [
                { key: "host", value: "", encrypted: false },
                { key: "path", value: "", encrypted: false },
                { key: "access_token", value: null, encrypted: true },
                { key: "port", value: "", encrypted: false }
            ]
        );
        openDataSourceConnection(databricksDataSourceName);

        fillDSConnectionForm(databricksFormConfig, []);

        verifyDSConnection();
    });

    it.skip("3. Databricks - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${databricksDataSourceName}`,
            "databricks",
            [
                { key: "host", value: "", encrypted: false },
                { key: "path", value: "", encrypted: false },
                { key: "access_token", value: null, encrypted: true },
                { key: "port", value: "", encrypted: false }
            ]
        );
        openDataSourceConnection(databricksDataSourceName);

        verifyConnectionFormUI(databricksUIConfig.defaultFields);

        fillDSConnectionForm(databricksFormConfig, databricksFormConfig.invalidHost);
        verifyDSConnection("failed", "Connection failed");

        fillDSConnectionForm(databricksFormConfig, databricksFormConfig.invalidPath);
        verifyDSConnection("failed", "Invalid SQL warehouse path");

        fillDSConnectionForm(databricksFormConfig, databricksFormConfig.invalidToken);
        verifyDSConnection("failed", "Invalid access token");

        fillDSConnectionForm(databricksFormConfig, databricksFormConfig.invalidPort);
        verifyDSConnection("failed", "Connection refused");
    });
});