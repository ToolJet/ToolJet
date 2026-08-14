import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { commonEeSelectors, multiEnvSelector } from "Selectors/eeCommon";
import { moduleSelectors } from "Selectors/platform/modules";
import { importSelectors } from "Selectors/exportImport";
import { Environments } from "Constants/constants/multiEnv";
import { openModulesList, dragModuleIntoCanvas } from "Support/utils/platform/modules";


describe("Modules — Workspace Constants Across Environments", { retries: 0 }, () => {
  const testId = Date.now();
  const wsName = `modules-constants-${testId}`;
  const wsSlug = wsName;
  const moduleFile = "cypress/fixtures/templates/modules/one version module.json";
  // Filename-derived, same convention as moduleImport.cy.js (readAndImport
  // strips only the ".json" extension — the space stays as-is).
  const moduleFileName = "one version module";

  const ENDPOINT = "http://130.131.160.149:4000";
  // Env-var-seeded, static across all 3 environments (root .env).
  const HEADER_KEY_VALUE = "customHeader";
  const UI_CONST_GLOBAL_VALUE = "sample-ui-constant-value";

  let workspaceId;
  let moduleAppId;
  let consumerAppId;

  before(() => {
    cy.apiLogin();
    cy.apiUpdateLicense("valid");
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env("workspaceId", workspaceId);
      Cypress.env("workspaceSlug", wsSlug);
    });
  });

  after(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    cy.apiLogin();
  });


  const promoteEnv = (fromEnv) => {
    cy.get(multiEnvSelector.environmentsTag(fromEnv)).click();
    cy.waitForElement(commonEeSelectors.promoteVersionButton);
    cy.wait(200);
    cy.get(commonEeSelectors.promoteVersionButton, { timeout: 10000 }).click();
    cy.get(commonEeSelectors.promoteButton, { timeout: 10000 }).click();
    cy.wait(2000);
  };


  const verifyResolvedForEnv = (envLabel) => {
    cy.reload();
    cy.wait(2000);

    cy.contains(`Env Secrets: ${envLabel} environment testing`).should("be.visible");
    cy.contains(`UI Secrets and Global Env: ${envLabel} environment testing`).should("be.visible");
    cy.contains(`Env Constant: ${HEADER_KEY_VALUE}`).should("be.visible");
    cy.contains(`UI Constants: ${UI_CONST_GLOBAL_VALUE}`).should("be.visible");
  };

  it("imports a module and verifies its secrets/constants resolve correctly across dev/staging/production", () => {
    cy.then(() => openModulesList());
    cy.get(importSelectors.dropDownMenu).should("be.visible").click();
    cy.get(importSelectors.importOptionInput)
      .eq(0)
      .selectFile(moduleFile, { force: true });
    cy.wait(2000);
    cy.get('[data-cy="import-module"]').click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Module imported successfully.");
    cy.url({ timeout: 15000 }).should("include", "/apps/");

    cy.url().then((url) => {
      moduleAppId = url.split("/apps/")[1].split("/")[0];
      Cypress.env("appId", moduleAppId);

      // ui_const (Secret): ONE static value, ALL three environments in a
      // single API call — this is the datasource base URL restapi2 builds on.
      cy.apiCreateWorkspaceConstant(
        "ui_const",
        ENDPOINT,
        ["Secret"],
        [Environments.development, Environments.staging, Environments.production]
      );

      // ui_const (Global): static, single value across all three
      // environments — proves plain Global constants resolve in a module too.
      cy.apiCreateWorkspaceConstant(
        "ui_const",
        UI_CONST_GLOBAL_VALUE,
        ["Global"],
        [Environments.development, Environments.staging, Environments.production]
      );

      // Scoped (non-wildcard) intercept — a wildcard GET /api/apps/* intercept
      // can match an unrelated in-flight request instead of this module's own
      // (same reasoning as moduleGlobals.cy.js's createFreshModule).
      cy.intercept("GET", `/api/apps/${moduleAppId}`).as("getModuleData");
      cy.reload();
      cy.wait("@getModuleData").then((interception) => {
        Cypress.env("editingVersionId", interception.response.body.editing_version.id);
      });
    });

    verifyResolvedForEnv("Development");

    // Promotion requires a saved/published version to move forward, same
    // rule already confirmed for draft-version creation elsewhere in this
    // suite (frontend/src/AppBuilder/Header/VersionManager/CreateDraftButton.jsx).
    cy.apiPublishDraftVersion("v1");
    cy.reload();
    cy.wait(2000);

    promoteEnv(Environments.development);
    verifyResolvedForEnv("Staging");

    promoteEnv(Environments.staging);
    verifyResolvedForEnv("Production");
  });

  it("embeds the module in a consuming app and verifies its constants still resolve correctly across dev/staging/production", () => {
    const consumerAppName = `Constants Consumer ${testId}`;

    cy.apiCreateApp(consumerAppName).then(() => {
      consumerAppId = Cypress.env("appId");
    });

    cy.visit(`/${Cypress.env("workspaceSlug")}`);
    cy.get(commonSelectors.appCard(consumerAppName))
      .trigger("mousehover")
      .trigger("mouseenter")
      .find(commonSelectors.editButton)
      .click({ force: true });
    cy.wait(2000);

    dragModuleIntoCanvas(moduleFileName);

    verifyResolvedForEnv("Development");

    // Save/lock this version before promoting — same rule as the module
    // itself in the previous test, confirmed working for a consuming app via
    // this exact sequence in ModulePinning.cy.js.
    cy.get(moduleSelectors.versionSwitcherButton).click();
    cy.get(commonSelectors.buttonSelector("v1 save version")).click();
    cy.get(commonWidgetSelector.parameterInputField("version name")).clear().type("v1");
    cy.get(commonSelectors.buttonSelector("create version save")).click();
    cy.get(moduleSelectors.versionLockBanner, { timeout: 15000 }).should("be.visible");

    promoteEnv(Environments.development);
    verifyResolvedForEnv("Staging");

    promoteEnv(Environments.staging);
    verifyResolvedForEnv("Production");
  });
});
