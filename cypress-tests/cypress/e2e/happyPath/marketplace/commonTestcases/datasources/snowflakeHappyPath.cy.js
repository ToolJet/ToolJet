import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
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

    afterEach(() => {
        cy.apiDeleteDataSource(snowflakeDataSourceName);
    });

    it("1. Snowflake - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${snowflakeDataSourceName}`,
            "snowflake",
            [
                { key: "account", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "schema", value: "", encrypted: false },
                { key: "warehouse", value: "", encrypted: false },
                { key: "role", value: "", encrypted: false },
                { key: "auth_type", value: "basic", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(snowflakeDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(snowflakeDataSourceName)).click();
        verifyConnectionFormUI(snowflakeUIConfig.defaultFields);
    });

    it("2. Snowflake - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${snowflakeDataSourceName}`,
            "snowflake",
            [
                { key: "account", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "schema", value: "", encrypted: false },
                { key: "warehouse", value: "", encrypted: false },
                { key: "role", value: "", encrypted: false },
                { key: "auth_type", value: "basic", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(snowflakeDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(snowflakeDataSourceName)).click();

        fillDSConnectionForm(snowflakeFormConfig, []);

        // Fill OAuth fields manually (non-standard data-cy from Authentication.jsx)
        cy.get('[data-cy="username-input-field"]').clear().type(Cypress.env('snowflake_user'));
        cy.get('[data-cy="password-section"]').within(() => {
            cy.get('[data-cy="button-edit"]').click();
        });
        cy.get('[data-cy="password-input-field"]').clear().type(Cypress.env('snowflake_password'));

        verifyDSConnection();
    });

    it("3. Snowflake - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${snowflakeDataSourceName}`,
            "snowflake",
            [
                { key: "account", value: "", encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "schema", value: "", encrypted: false },
                { key: "warehouse", value: "", encrypted: false },
                { key: "role", value: "", encrypted: false },
                { key: "auth_type", value: "basic", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(snowflakeDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(snowflakeDataSourceName)).click();

        verifyConnectionFormUI(snowflakeUIConfig.defaultFields);

        fillDSConnectionForm(snowflakeFormConfig, snowflakeFormConfig.invalidAccount);
        // Fill OAuth fields manually (non-standard data-cy from Authentication.jsx)
        cy.get('[data-cy="username-input-field"]').clear().type(Cypress.env('snowflake_user'));
        cy.get('[data-cy="password-section"]').within(() => {
            cy.get('[data-cy="button-edit"]').click();
        });
        cy.get('[data-cy="password-input-field"]').clear().type(Cypress.env('snowflake_password'));
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND");
    });
});
