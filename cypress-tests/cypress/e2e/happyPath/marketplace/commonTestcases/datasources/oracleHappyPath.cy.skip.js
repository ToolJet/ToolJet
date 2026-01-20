import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, openDataSourceConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
import { oracleUIConfig, oracleFormConfig } from "Constants/constants/marketplace/datasources/oracle";

const data = {};

describe("Oracle DB", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const oracleDataSourceName = `cypress-${data.dataSourceName}-oracle`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(oracleDataSourceName);
    });

    it("1. Oracle DB - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${oracleDataSourceName}`,
            "oracledb",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 1521, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "database_type", value: "SID", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: true },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "client_path_type", value: "default", encrypted: false },
                { key: "instant_client_version", value: "21_10", encrypted: false }
            ]
        );

        openDataSourceConnection(oracleDataSourceName);

        verifyConnectionFormUI(oracleUIConfig.defaultFields);
    });

    it("2. Oracle DB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${oracleDataSourceName}`,
            "oracledb",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 1521, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "database_type", value: "SID", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: true },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "client_path_type", value: "default", encrypted: false },
                { key: "instant_client_version", value: "21_10", encrypted: false }
            ]
        );

        openDataSourceConnection(oracleDataSourceName);

        fillDSConnectionForm(oracleFormConfig, []);

        verifyDSConnection();
    });

    it("3. Oracle DB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${oracleDataSourceName}`,
            "oracledb",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 1521, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "database_type", value: "SID", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: true },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "client_path_type", value: "default", encrypted: false },
                { key: "instant_client_version", value: "21_10", encrypted: false }
            ]
        );

        openDataSourceConnection(oracleDataSourceName);

        verifyConnectionFormUI(oracleUIConfig.defaultFields);

        fillDSConnectionForm(oracleFormConfig, oracleFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(oracleFormConfig, oracleFormConfig.invalidPort);
        verifyDSConnection("failed", "Connection refused");

        fillDSConnectionForm(oracleFormConfig, oracleFormConfig.invalidDatabase);
        verifyDSConnection("failed", "ORA-12505");

        fillDSConnectionForm(oracleFormConfig, oracleFormConfig.invalidUsername);
        verifyDSConnection("failed", "ORA-01017: invalid username/password");

        fillDSConnectionForm(oracleFormConfig, oracleFormConfig.invalidPassword);
        verifyDSConnection("failed", "ORA-01017: invalid username/password");

        fillDSConnectionForm(oracleFormConfig, oracleFormConfig.invalidSsl);
        verifyDSConnection("failed", "SSL routines:ssl3_get_record:wrong version number");
    });
});