import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, openDataSourceConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
import { snowflakeUIConfig, snowflakeFormConfig } from "Constants/constants/marketplace/datasources/snowflake";

const data = {};

describe("Snowflake", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const snowflakeDataSourceName = `cypress-${data.dataSourceName}-snowflake`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    // afterEach(() => {
    //     cy.apiDeleteDataSource(snowflakeDataSourceName);
    // });

    it("1. Snowflake - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${snowflakeDataSourceName}`,
            "snowflake",
            [
                { key: "username", value: "", encrypted: false },
                { key: "account", value: "", encrypted: false },
                { key: "password", value: "", encrypted: true },
                { key: "database", value: "", encrypted: false },
                { key: "schema", value: "", encrypted: false },
                { key: "warehouse", value: "", encrypted: false },
                { key: "role", value: "", encrypted: false },
                { key: "auth_type", value: "basic", encrypted: false },
                { key: "oauth_type", value: "custom_app", encrypted: false },
                { key: "grant_type", value: "authorization_code", encrypted: false }
            ]
        );

        openDataSourceConnection(snowflakeDataSourceName);

        verifyConnectionFormUI(snowflakeUIConfig.defaultFields);
    });

    it.skip("2. Snowflake - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${snowflakeDataSourceName}`,
            "snowflake",
            [
                { key: "username", value: "", encrypted: false },
                { key: "account", value: "", encrypted: false },
                { key: "password", value: "", encrypted: true },
                { key: "database", value: "", encrypted: false },
                { key: "schema", value: "", encrypted: false },
                { key: "warehouse", value: "", encrypted: false },
                { key: "role", value: "", encrypted: false },
                { key: "auth_type", value: "basic", encrypted: false },
                { key: "oauth_type", value: "custom_app", encrypted: false },
                { key: "grant_type", value: "authorization_code", encrypted: false }
            ]
        );

        openDataSourceConnection(snowflakeDataSourceName);

        fillDSConnectionForm(snowflakeFormConfig, []);

        verifyDSConnection();
    });

    it.skip("3. Snowflake - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${snowflakeDataSourceName}`,
            "snowflake",
            [
                { key: "username", value: "", encrypted: false },
                { key: "account", value: "", encrypted: false },
                { key: "password", value: "", encrypted: true },
                { key: "database", value: "", encrypted: false },
                { key: "schema", value: "", encrypted: false },
                { key: "warehouse", value: "", encrypted: false },
                { key: "role", value: "", encrypted: false },
                { key: "auth_type", value: "basic", encrypted: false },
                { key: "oauth_type", value: "custom_app", encrypted: false },
                { key: "grant_type", value: "authorization_code", encrypted: false }
            ]
        );

        openDataSourceConnection(snowflakeDataSourceName);

        verifyConnectionFormUI(snowflakeUIConfig.defaultFields);

        fillDSConnectionForm(snowflakeFormConfig, snowflakeFormConfig.invalidAccount);
        verifyDSConnection("failed", "Account identifier is incorrect");

        fillDSConnectionForm(snowflakeFormConfig, snowflakeFormConfig.invalidUsername);
        verifyDSConnection("failed", "Incorrect username or password was specified");

        fillDSConnectionForm(snowflakeFormConfig, snowflakeFormConfig.invalidPassword);
        verifyDSConnection("failed", "Incorrect username or password was specified");

        fillDSConnectionForm(snowflakeFormConfig, snowflakeFormConfig.invalidWarehouse);
        verifyDSConnection("failed", "Object does not exist or not authorized");

        fillDSConnectionForm(snowflakeFormConfig, snowflakeFormConfig.invalidDatabase);
        verifyDSConnection("failed", "Object does not exist or not authorized");

        fillDSConnectionForm(snowflakeFormConfig, snowflakeFormConfig.invalidSchema);
        verifyDSConnection("failed", "Object does not exist or not authorized");

        fillDSConnectionForm(snowflakeFormConfig, snowflakeFormConfig.invalidRole);
        verifyDSConnection("failed", "Role does not exist or not authorized");
    });
});