import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { twilioUIConfig, twilioFormConfig } from "Constants/constants/marketplace/datasources/twilio";

const data = {};

describe("Twilio", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const twilioDataSourceName = `cypress-${data.dataSourceName}-twilio`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(twilioDataSourceName);
    });

    it("1. Twilio - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${twilioDataSourceName}`,
            "twilio",
            [
                { key: "account_sid", value: "", encrypted: false },
                { key: "auth_token", value: null, encrypted: true },
                { key: "messaging_service_sid", value: "", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(twilioDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(twilioDataSourceName)).click();
        verifyConnectionFormUI(twilioUIConfig.defaultFields);
    });

    it("2. Twilio - Verify data source save with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${twilioDataSourceName}`,
            "twilio",
            [
                { key: "account_sid", value: "", encrypted: false },
                { key: "auth_token", value: null, encrypted: true },
                { key: "messaging_service_sid", value: "", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(twilioDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(twilioDataSourceName)).click();

        fillDSConnectionForm(twilioFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .should("be.visible")
            .click();
    });

    it("3. Twilio - Verify UI and save together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${twilioDataSourceName}`,
            "twilio",
            [
                { key: "account_sid", value: "", encrypted: false },
                { key: "auth_token", value: null, encrypted: true },
                { key: "messaging_service_sid", value: "", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(twilioDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(twilioDataSourceName)).click();

        verifyConnectionFormUI(twilioUIConfig.defaultFields);

        fillDSConnectionForm(twilioFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .should("be.visible")
            .click();
    });
});
