import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { commonSelectors } from "Selectors/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { amazonsesUIConfig, amazonsesFormConfig, amazonsesApiOptions } from "Constants/constants/marketplace/datasources/amazonses";

const data = {};

describe("Amazon SES", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const amazonsesDataSourceName = `cypress-${data.dataSourceName}-amazonses`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(amazonsesDataSourceName);
    });

    it("1. Amazon SES - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${amazonsesDataSourceName}`,
            "amazonses",
            amazonsesApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(amazonsesDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(amazonsesDataSourceName)).click();
        verifyConnectionFormUI(amazonsesUIConfig.defaultFields);
    });

    it("2. Amazon SES - Verify saving data source with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${amazonsesDataSourceName}`,
            "amazonses",
            amazonsesApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(amazonsesDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(amazonsesDataSourceName)).click();

        fillDSConnectionForm(amazonsesFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .scrollIntoView()
            .should("be.visible")
            .click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved");
    });

    it("3. Amazon SES - Verify UI and save together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${amazonsesDataSourceName}`,
            "amazonses",
            amazonsesApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(amazonsesDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(amazonsesDataSourceName)).click();

        verifyConnectionFormUI(amazonsesUIConfig.defaultFields);

        fillDSConnectionForm(amazonsesFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .scrollIntoView()
            .should("be.visible")
            .click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved");
    });
});
