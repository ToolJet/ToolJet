import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
    createAndUpdateConstant,
    importConstantsApp,
    previewAppAndVerify,
    promoteEnvAndVerify,
    verifyConstantValueVisibility,
    verifyGlobalConstInStaticQuery,
    verifyInputValues,
    verifySecretConstantNotResolved,
    verifySecretInStaticQueryRaw,
    verifyStaticQueryPreview,
} from "Support/utils/workspaceConstants";
import { workspaceConstantsText } from "Texts/workspaceConstants";

import { dataSourceSelector } from "Selectors/dataSource";
import { setUpSlug } from "Support/utils/apps";

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

    it("Verify global and secret constants in all areas", () => {
        data.workspaceName = fake.firstName;
        data.workspaceSlug = fake.firstName.toLowerCase().replace(/[^A-Za-z]/g, "");
        data.appName = `${fake.companyName}-App`;
        data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");

        cy.apiCreateWorkspace(data.workspaceSlug, data.workspaceSlug);
        cy.apiLogout();
        cy.apiLogin();
        cy.visit(data.workspaceSlug);

        // Create and update constants as needed
        createAndUpdateConstant(
            "url",
            "http://20.29.40.108:4000/development",
            ["Global"],
            ["development", "staging", "production"],
            {
                staging: "http://20.29.40.108:4000/staging",
                production: "http://20.29.40.108:4000/production",
            }
        );
        createAndUpdateConstant(
            "url",
            "http://20.29.40.108:4000/development",
            ["Secret"],
            ["development", "staging", "production"],
            {
                staging: "http://20.29.40.108:4000/staging",
                production: "http://20.29.40.108:4000/production",
            }
        );
        cy.apiCreateWorkspaceConstant(
            "restapiHeaderKey",
            "customHeader",
            ["Global", "Secret"],
            ["development", "staging", "production"]
        );
        cy.apiCreateWorkspaceConstant(
            "restapiHeaderValue",
            "key=value",
            ["Global", "Secret"],
            ["development", "staging", "production"]
        );

        createAndUpdateConstant(
            "gconst",
            "108",
            ["Global"],
            ["development", "staging", "production"]
        );
        cy.apiCreateWorkspaceConstant(
            "gconstUrl",
            "http://20.29.40.108:4000/",
            ["Global"],
            ["development", "staging", "production"]
        );
        createAndUpdateConstant(
            "gconstEndpoint",
            "development",
            ["Global"],
            ["development"],
            {
                staging: "staging",
                production: "production",
            }
        );

        cy.apiCreateWorkspaceConstant(
            "sconst",
            ":4000",
            ["Secret"],
            ["development", "staging", "production"]
        );
        createAndUpdateConstant(
            "sconstEndpoint",
            "development",
            ["Secret"],
            ["development"],
            {
                staging: "staging",
                production: "production",
            }
        );

        cy.get(commonSelectors.dashboardIcon).click();
        importConstantsApp("cypress/fixtures/templates/workspace_constants.json");

        // Verify constants in textinput1 and range
        cy.get(
            commonWidgetSelector.draggableWidget("textinput1")
        ).verifyVisibleElement("have.value", "customHeader");
        verifyInputValues(3, 16, "Development environment testing");

        // Secret constant in UI
        verifySecretConstantNotResolved("textinput2");

        // Verify global const in static query URL and preview
        verifyGlobalConstInStaticQuery(
            '[data-cy="list-query-static_restapi_constants_url"]',
            "http://20.29.40.108:4000/development"
        );
        verifyStaticQueryPreview(
            '[data-cy="list-query-constants_runjs"]',
            "customHeader"
        );
        verifySecretInStaticQueryRaw('[data-cy="list-query-secret_runjs"]');

        // Preview App
        previewAppAndVerify(3, 16, "Development environment testing");

        // Promote and verify through envs if enterprise
        cy.ifEnv("Enterprise", () => {
            promoteEnvAndVerify(
                "development",
                "staging",
                3,
                16,
                "Staging environment testing"
            );
            promoteEnvAndVerify(
                "staging",
                "production",
                3,
                16,
                "Production environment testing"
            );
        });

        // Final housekeeping steps
        cy.get(commonSelectors.releaseButton).click();
        cy.get(commonSelectors.yesButton).click();
        cy.wait(500);
        setUpSlug(data.slug);
        cy.forceClickOnCanvas();
        cy.backToApps();

        // Verify constants/secrets visibility in datasource form
        cy.get(commonSelectors.globalDataSourceIcon).click();
        cy.get('[data-cy="constants-button"]').click();
        verifyConstantValueVisibility(
            dataSourceSelector.baseUrlTextField,
            "http://20.29.40.108:4000/development"
        );
        verifyConstantValueVisibility(
            '[value="{{constants.restapiHeaderKey}}"]',
            "customHeader"
        );
        verifyConstantValueVisibility(
            '[value="{{constants.restapiHeaderValue}}"]',
            "key=value"
        );
        cy.get('[data-cy="secret-button"]').click();
        verifyConstantValueVisibility(
            dataSourceSelector.baseUrlTextField,
            workspaceConstantsText.secretsHiddenText
        );
        verifyConstantValueVisibility(
            '[value="{{secrets.restapiHeaderKey}}"]',
            workspaceConstantsText.secretsHiddenText
        );
        verifyConstantValueVisibility(
            '[value="{{secrets.restapiHeaderValue}}"]',
            workspaceConstantsText.secretsHiddenText
        );
        cy.get('[data-cy="constants_secret_combination-button"]').click();
        verifyConstantValueVisibility(
            dataSourceSelector.baseUrlTextField,
            workspaceConstantsText.secretsHiddenText
        );

        // Verify again in slugged app
        cy.visitSlug({
            actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
        });
        cy.wait(3000);
        cy.get(commonWidgetSelector.draggableWidget("textinput1")).should(
            "be.visible"
        );
        verifyInputValues(3, 16, "Production environment testing");
    });
});
