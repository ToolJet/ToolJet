import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { smtpUIConfig, smtpFormConfig } from "Constants/constants/marketplace/datasources/smtp";

const data = {};

describe("SMTP", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const smtpDataSourceName = `cypress-${data.dataSourceName}-smtp`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(smtpDataSourceName);
    });

    it("1. SMTP - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${smtpDataSourceName}`,
            "smtp",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 465, encrypted: false },
                { key: "user", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(smtpDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(smtpDataSourceName)).click();
        verifyConnectionFormUI(smtpUIConfig.defaultFields);
    });

    it("2. SMTP - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${smtpDataSourceName}`,
            "smtp",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 465, encrypted: false },
                { key: "user", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(smtpDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(smtpDataSourceName)).click();

        fillDSConnectionForm(smtpFormConfig, []);

        verifyDSConnection();
    });

    it("3. SMTP - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${smtpDataSourceName}`,
            "smtp",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 465, encrypted: false },
                { key: "user", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(smtpDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(smtpDataSourceName)).click();

        verifyConnectionFormUI(smtpUIConfig.defaultFields);

        fillDSConnectionForm(smtpFormConfig, smtpFormConfig.invalidHost);
        verifyDSConnection("failed", "Invalid credentials");

        fillDSConnectionForm(smtpFormConfig, smtpFormConfig.invalidUser);
        verifyDSConnection("failed", "Invalid credentials");

        fillDSConnectionForm(smtpFormConfig, smtpFormConfig.invalidPassword);
        verifyDSConnection("failed", "Invalid credentials");
    });
});

/*
 * Test Cases for SMTP
 * ===================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with default options (host, port, user, password)
 *   - Steps: Navigate to data sources page -> Click on smtp data source -> Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Host, Port, User, Password
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Fill valid credentials via fillDSConnectionForm -> Test connection
 *   - Expected: Toast "Test connection verified"
 *   - Credentials: smtp_host, smtp_port, smtp_user, smtp_password
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Verify UI fields -> Test with invalid host -> Test with invalid user -> Test with invalid password
 *   - Expected: UI fields match manifest; each invalid field produces appropriate error:
 *     - Invalid host: "Invalid credentials"
 *     - Invalid user: "Invalid credentials"
 *     - Invalid password: "Invalid credentials"
 */
