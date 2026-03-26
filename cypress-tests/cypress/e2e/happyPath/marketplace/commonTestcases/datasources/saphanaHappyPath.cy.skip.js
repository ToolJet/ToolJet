import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { saphanaUIConfig, saphanaFormConfig } from "Constants/constants/marketplace/datasources/saphana";

const data = {};

describe("SAP HANA", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const saphanaDataSourceName = `cypress-${data.dataSourceName}-saphana`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(saphanaDataSourceName);
    });

    it("1. SAP HANA - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${saphanaDataSourceName}`,
            "saphana",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 443, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(saphanaDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(saphanaDataSourceName)).click();
        verifyConnectionFormUI(saphanaUIConfig.defaultFields);
    });

    it("2. SAP HANA - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${saphanaDataSourceName}`,
            "saphana",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 443, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(saphanaDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(saphanaDataSourceName)).click();

        fillDSConnectionForm(saphanaFormConfig, []);

        verifyDSConnection();
    });

    it("3. SAP HANA - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${saphanaDataSourceName}`,
            "saphana",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 443, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(saphanaDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(saphanaDataSourceName)).click();

        verifyConnectionFormUI(saphanaUIConfig.defaultFields);

        fillDSConnectionForm(saphanaFormConfig, saphanaFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(saphanaFormConfig, saphanaFormConfig.invalidPort);
        verifyDSConnection("failed", "Failed to connect");

        fillDSConnectionForm(saphanaFormConfig, saphanaFormConfig.invalidUsername);
        verifyDSConnection("failed", "authentication failed");

        fillDSConnectionForm(saphanaFormConfig, saphanaFormConfig.invalidPassword);
        verifyDSConnection("failed", "authentication failed");
    });
});

/*
 * Test Cases for SAP HANA
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with default field values
 *   - Steps: Navigate to data sources page → Click on saphana data source → Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Host (input, default "localhost"), Port (input, default "443"),
 *     Database name (input), Username (input), Password (encrypted)
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with default field values
 *   - Steps: Navigate → Fill valid credentials → Test connection
 *   - Expected: Successful connection (verifyDSConnection passes)
 *   - Credentials: saphana_host, saphana_port, saphana_database, saphana_user, saphana_password
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with default field values
 *   - Steps: Navigate → Verify UI → Test invalid host → Test invalid port →
 *     Test invalid username → Test invalid password
 *   - Expected: UI matches manifest; invalid host returns "getaddrinfo ENOTFOUND invalid-host";
 *     invalid port returns "Failed to connect"; invalid username returns "authentication failed";
 *     invalid password returns "authentication failed"
 */
