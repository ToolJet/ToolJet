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
