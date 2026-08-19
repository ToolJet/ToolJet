import { commonWidgetSelector, inspectorSelectors } from "Selectors/common";
import { navigateAndVerifyInspector } from "Support/utils/inspector";
import {
  dropModuleComponent,
  defineModuleContract,
} from "Support/utils/platform/modules";


describe("Modules — Inspector", () => {
  const testId = Date.now();
  const shortId = String(testId).slice(-6);
  const wsName = `modules-globals-${testId}`;
  const wsSlug = wsName;

  let workspaceId;
  let moduleCounter = 0;


  const createFreshModule = () => {
    // Kept short (well under the ~28-char threshold where the edit-app-name
    // button's CSS max-width starts overlapping the fixed-position autosave
    // icon — confirmed live, 2026-07-31).
    const moduleName = `Globals Mod ${shortId}-${moduleCounter++}`;
    cy.apiCreateModule(moduleName).then((module) => {
      Cypress.env("appId", module.id);
      Cypress.env("user_id", module.user_id);
      cy.intercept("GET", `/api/apps/${module.id}`).as("getModuleData");
      cy.window({ log: false }).then((win) => {
        win.localStorage.setItem("walkthroughCompleted", "true");
      });
      cy.visit(`/${Cypress.env("workspaceId")}/apps/${module.id}/`);
      cy.wait("@getModuleData").then((interception) => {
        const responseData = interception.response.body;
        Cypress.env("editingVersionId", responseData.editing_version.id);
        Cypress.env("environmentId", responseData.editorEnvironment.id);
      });
    });
  };

  before(() => {
    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env("workspaceId", workspaceId);
      Cypress.env("workspaceSlug", wsSlug);
    });
  });

  after(() => {
    cy.apiLogin();
    cy.apiUpdateProfile({
      firstName: "The",
      lastName: "Developer",
    });
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    cy.apiLogin();
    createFreshModule();
  });

  it("should verify the values of current user inside globals inspector", () => {
    // "groups": [2] confirmed live (Playwright MCP) against this same admin/
    // creator user in a freshly created workspace — identical to the app-level
    // reference, not a default-workspace-only artifact.
    const dataList = [
      ["email", `"dev@tooljet.io"`],
      ["firstName", `"The"`],
      ["lastName", `"Developer"`],
      ["id", `${Cypress.env("user_id")}`],
      ["avatarId", `null`],
      ["groups", `[2]`],
      ["role", `"admin"`],
      ["ssoUserInfo", `{0}`],
    ];

    navigateAndVerifyInspector(["globals", "currentUser"], dataList);

    cy.apiUpdateProfile({
      firstName: "UpdatedThe",
      lastName: "UpdatedDeveloper",
    }).then(() => {
      cy.reload();

      const dataListAfter = [
        ["email", `"dev@tooljet.io"`],
        ["firstName", `"UpdatedThe"`],
        ["lastName", `"UpdatedDeveloper"`],
        ["id", `${Cypress.env("user_id")}`],
        ["avatarId", `null`],
        ["groups", `[2]`],
        ["role", `"admin"`],
        ["ssoUserInfo", `{0}`],
      ];

      navigateAndVerifyInspector(["globals", "currentUser"], dataListAfter);
    });

    cy.apiUpdateProfile({
      firstName: "The",
      lastName: "Developer",
    });
  });

  it("should verify the values of environment inside globals inspector", () => {
    const developmentEnvId = Cypress.env("environmentId");
    const dataList = [
      ["id", `${developmentEnvId}`],
      ["name", `development`],
    ];

    navigateAndVerifyInspector(["globals", "environment"], dataList);

    // Staging/production promotion intentionally NOT exercised here — see the
    // describe-level comment (checkModulesPromotableToEnvironment gates a
    // *consuming* app's promotion when it embeds an unresolved module version;
    // whether cy.apiPromoteAppVersion works unmodified against a module's own
    // appId isn't confirmed anywhere in the codebase/impl-context docs).
  });

  it("should verify the values of mode inside globals inspector", () => {
    const dataList = [["value", `edit`]];

    navigateAndVerifyInspector(["globals", "mode"], dataList);
  });

  it("should verify the values of theme inside globals inspector", () => {

    const themeToggleButton = () => cy.get(".left-sidebar-item:has(svg.lucide-moon), .left-sidebar-item:has(svg.lucide-sun)");

    cy.get("body").then(($body) => {
      if ($body.find(".left-sidebar-item:has(svg.lucide-sun)").length > 0) {
        themeToggleButton().click();
        cy.reload();
      }
    });

    navigateAndVerifyInspector(["globals", "theme"], [["name", `light`]]);


    themeToggleButton().click();
    cy.wait(500);
    cy.reload();
    navigateAndVerifyInspector(["globals", "theme"], [["name", `dark`]]);

    themeToggleButton().click();
    cy.wait(500);
    cy.reload();
    navigateAndVerifyInspector(["globals", "theme"], [["name", `light`]]);
  });

  it("should verify the module-specific 'input' global is present", () => {

    dropModuleComponent();
    defineModuleContract();

    cy.get(commonWidgetSelector.sidebarinspector).should("be.visible").click();
    cy.get(".tooltip-inner").invoke("hide");


    cy.get(inspectorSelectors.inspectorSubNode("input"))
      .should("be.visible")
      .and("have.text", "Input");


    cy.get('[data-cy="inspector-undefined-expand-button"]')
      .should("be.visible")
      .click();

    // The defined Input contract item ("input1") shows up as real, resolved
    // data under the Input node — proof the module-only `input` global
    // carries live contract data, not just an empty namespace.
    cy.get(inspectorSelectors.inspectorSubNode("input1")).should("be.visible");
  });
});
