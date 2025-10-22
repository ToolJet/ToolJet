import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import {
    assertTooltipText,
    importConstantsApp,
    previewAppAndVerify,
    switchToConstantTab,
    verifyConstantValueVisibility,
    verifyInputValues,
    verifySecretConstantNotResolved,
} from "Support/utils/workspaceConstants";
import { workspaceConstantsText } from "Texts/workspaceConstants";

import { dataSourceSelector } from "Selectors/dataSource";
import { setUpSlug } from "Support/utils/apps";
import { releaseApp } from "Support/utils/common";

const data = {};

describe("Workspace constants", () => {
    const envVar = Cypress.env("environment");
    data.constName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.newConstvalue = `New ${data.constName}`;
    data.constantsName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.constantsValue = "dJ_8Q~BcaMPd";

    beforeEach(() => {
        cy.defaultWorkspaceLogin();
        cy.skipWalkthrough();
        cy.viewport(2400, 2000);
    });

    it("Verify env global and secrets in all areas", () => {
        // Set workspace and app data
        data.workspaceName = fake.firstName;
        data.workspaceSlug = fake.firstName.toLowerCase().replace(/[^A-Za-z]/g, "");
        data.appName = `${fake.companyName}-App`;
        data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");

        cy.apiCreateWorkspace(data.workspaceSlug, data.workspaceSlug);
        cy.apiLogout();
        cy.apiLogin();
        cy.visit(data.workspaceSlug);

        cy.get('[data-cy="home-page-icon"]').click();
        cy.wait(500);
        cy.get(commonSelectors.workspaceConstantsIcon).click();

        // Show envconstant details
        cy.get('[data-cy="envconstant-constant-visibility"]').click();

        // Validate the value for the envConstant entry
        cy.get(workspaceConstantsSelectors.constantValue("envConstant"))
            .should("be.visible")
            .and("have.text", "globalUI");

        // Check if the edit button is disabled
        cy.get('[data-cy="envconstant-edit-button"]').should("be.disabled");
        cy.get('[data-cy="envconstant-delete-button"]').should("be.disabled");

        // Check tooltip text on hover (strip HTML for Cypress match)
        assertTooltipText(
            '[data-cy="envconstant-edit-button"]',
            "Constants created from environment variables cannot be edited or deleted"
        );

        switchToConstantTab("Secrets");
        cy.get('[data-cy="headervalue-constant-visibility"]').click();
        cy.get('[data-cy="headervalue-workspace-constant-value"]')
            .should("be.visible")
            .and("have.text", "Values fetched at runtime, not stored in ToolJet");

        cy.get('[data-cy="headervalue-edit-button"]').should("be.disabled");
        cy.get('[data-cy="headervalue-delete-button"]').should("be.disabled");

        // Check tooltip text on hover (strip HTML for Cypress match)
        assertTooltipText(
            '[data-cy="headervalue-edit-button"]',
            "Constants created from environment variables cannot be edited or deleted"
        );

        cy.get(commonSelectors.dashboardIcon).click();

        importConstantsApp("cypress/fixtures/templates/env_constants-export.json");

        cy.go("back");

        cy.get(commonSelectors.globalWorkFlowsIcon).click();
        importConstantsApp(
            "cypress/fixtures/templates/env-constants-workflow-export.json",
            false
        );
        cy.go("back");
        cy.wait(2000);

        cy.get(commonSelectors.dashboardIcon).click();
        cy.get(commonSelectors.appCard("env_constants-export"))
            .trigger("mousehover")
            .trigger("mouseenter")
            .find(commonSelectors.editButton)
            .click({ force: true });
        cy.wait(2000);

        cy.get('[data-cy="list-query-workflows1"]').click();
        cy.get(".workflow-select").eq(0).click();
        cy.get('[role="option"]').contains("env-constants-workflow-export").click();

        verifyInputValues(3, 6, "Development environment testing");
        verifySecretConstantNotResolved("textinput2");

        cy.get(".collapse-icon").click({ force: true });
        cy.get('[data-cy="pages-name-workflow"]').click();
        cy.get('[data-cy="draggable-widget-textinput1"]').verifyVisibleElement(
            "have.value",
            "Development environment testing"
        );

        cy.get('[data-cy="pages-name-home"]').click();
        previewAppAndVerify(3, 6, "Development environment testing");
        cy.get('[data-cy="pages-name-workflow"]').click();
        cy.get('[data-cy="draggable-widget-textinput1"]').verifyVisibleElement(
            "have.value",
            "Development environment testing"
        );
        cy.go("back");

        releaseApp();
        setUpSlug(data.slug);
        cy.forceClickOnCanvas();
        cy.backToApps();

        // Verify constants/secrets visibility in datasource form
        cy.get(commonSelectors.globalDataSourceIcon).click();
        cy.get('[data-cy="env_constants-button"]').click();
        verifyConstantValueVisibility(
            dataSourceSelector.baseUrlTextField,
            "http://20.29.40.108:4000/development"
        );
        verifyConstantValueVisibility(
            '[value="{{constants.headerKey}}"]',
            "customHeader"
        );
        verifyConstantValueVisibility(
            '[value="{{constants.headerValue}}"]',
            "key=value"
        );
        cy.get('[data-cy="env_secret-button"]').click();
        verifyConstantValueVisibility(
            dataSourceSelector.baseUrlTextField,
            workspaceConstantsText.secretsHiddenText
        );
        verifyConstantValueVisibility(
            '[value="{{secrets.headerKey}}"]',
            workspaceConstantsText.secretsHiddenText
        );
        verifyConstantValueVisibility(
            '[value="{{secrets.headerValue}}"]',
            workspaceConstantsText.secretsHiddenText
        );

        cy.visitSlug({
            actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
        });
        cy.wait(3000);

        verifyInputValues(3, 6, "Production environment testing");
        cy.get('[data-cy="pages-name-workflow"]').click();
        cy.get('[data-cy="draggable-widget-textinput1"]').verifyVisibleElement(
            "have.value",
            "Production environment testing"
        );
    });
});
