import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { workspaceConstantsText } from "Texts/workspaceConstants";
import {
  constantsCRUDAndValidations,
  VerifyEmptyScreenUI,
  VerifyConstantsFormInputValidation,
  verifySearch,
  verifyConstantFormUI,
  deleteConstant,
  verifyConstantValueVisibility,
  createAndUpdateConstant,
  verifyInputValues,
  deleteAndVerifyConstant,
  importConstantsApp,
  verifySecretConstantNotResolved,
  verifyGlobalConstInStaticQuery,
  verifyStaticQueryPreview,
  verifySecretInStaticQueryRaw,
  previewAppAndVerify,
  promoteEnvAndVerify,
} from "Support/utils/workspaceConstants";
import { importSelectors } from "Selectors/exportImport";

import { dataSourceSelector } from "Selectors/dataSource";
import { setUpSlug } from "Support/utils/apps";
import { appPromote } from "Support/utils/platform/multiEnv";

const data = {};

describe("Workspace constants", () => {
  const envVar = Cypress.env("environment");
  data.constName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
  data.newConstvalue = `New ${data.constName}`;
  data.constantsName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
  data.constantsValue = "dJ_8Q~BcaMPd";
  data.appName = `${fake.companyName}-App`;
  data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");

  beforeEach(() => {
    cy.defaultWorkspaceLogin();
    cy.skipWalkthrough();
    cy.viewport(1800, 1800);
  });

  it("Verify workspace constants UI and CRUD operations", () => {
    data.firstName = fake.firstName;
    data.workspaceName = data.firstName;
    data.workspaceSlug = data.firstName.toLowerCase();

    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
    cy.visit(`${data.workspaceSlug}`);
    cy.wait(2000);

    cy.get(commonSelectors.workspaceConstantsIcon).click();
    verifyConstantFormUI();
    VerifyConstantsFormInputValidation();

    cy.ifEnv("Enterprise", () => {
      constantsCRUDAndValidations({
        constantType: "Global",
        constName: "Example_Constant1",
        newConstvalue: "UpdatedValue",
        envName: "Development",
      });

      constantsCRUDAndValidations({
        constantType: "Secrets",
        constName: "Example_Constant1",
        newConstvalue: "UpdatedValue",
        envName: "Development",
      });

      verifySearch({ envName: "Development" });

      constantsCRUDAndValidations({
        constantType: "Global",
        constName: "Example_Constant1",
        newConstvalue: "UpdatedValue",
        envName: "Staging",
      });
      constantsCRUDAndValidations({
        constantType: "Secrets",
        constName: "Example_Constant1",
        newConstvalue: "UpdatedValue",
        envName: "Staging",
      });
    });

    constantsCRUDAndValidations({
      constantType: "Global",
      constName: "Example_Constant1",
      newConstvalue: "UpdatedValue",
      envName: "Production",
    });
    constantsCRUDAndValidations({
      constantType: "Secrets",
      constName: "Example_Constant1",
      newConstvalue: "UpdatedValue",
      envName: "Production",
    });
  });

  it("Verify global and secret constants in all areas", () => {
    data.workspaceName = fake.firstName;
    data.workspaceSlug = fake.firstName.toLowerCase().replace(/[^A-Za-z]/g, "");
    data.appName = `${fake.companyName}-App`;

    cy.apiCreateWorkspace(data.workspaceSlug, data.workspaceSlug);
    cy.apiLogout();
    cy.apiLogin();
    cy.visit(data.workspaceSlug);
    data.appName = `${fake.companyName}-App`;

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
    cy.apiCreateWsConstant(
      "restapiHeaderKey",
      "customHeader",
      ["Global", "Secret"],
      ["development", "staging", "production"]
    );
    cy.apiCreateWsConstant(
      "restapiHeaderValue",
      "key=value",
      ["Global", "Secret"],
      ["development", "staging", "production"]
    );

    createAndUpdateConstant(
      "deleteConst",
      "deleteconst",
      ["Global"],
      ["development"]
    );
    createAndUpdateConstant(
      "gconst",
      "108",
      ["Global"],
      ["development", "staging", "production"]
    );
    cy.apiCreateWsConstant(
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

    cy.apiCreateWsConstant(
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

    deleteAndVerifyConstant("deleteConst");
    importConstantsApp();

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
