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
        cy.on("uncaught:exception", () => false);
        cy.apiLogin();
        cy.viewport(1400, 1600);
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
                { key: "password", value: null, encrypted: true }
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(smtpDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(smtpDataSourceName)).click();
        verifyConnectionFormUI(smtpUIConfig.defaultFields);
    });

    it.skip("2. SMTP - Verify data source connection with valid credentials — skipped: SMTP credentials expired", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${smtpDataSourceName}`,
            "smtp",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 465, encrypted: false },
                { key: "user", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true }
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(smtpDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(smtpDataSourceName)).click();

        fillDSConnectionForm(smtpFormConfig, []);

        // Click body to blur the password field before testing connection.
        // The old DynamicForm Input component throws a TypeError on blur
        // (onBlur is undefined). Triggering the blur here — before
        // verifyDSConnection clicks the test-connection button — avoids a
        // race where the uncaught exception interferes with the success
        // toast assertion.
        cy.get('body').click({ force: true });
        cy.wait(500);

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
                { key: "password", value: null, encrypted: true }
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
