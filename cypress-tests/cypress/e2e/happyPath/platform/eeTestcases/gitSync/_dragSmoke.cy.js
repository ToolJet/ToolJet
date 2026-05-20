// Isolated smoke for `cy.dragAndDropWidget` — does NOT exercise git sync.
// Goal: prove the helper drops a widget on BOTH the app editor and the module
// editor in headless Electron. Iterate the helper until both pass.
import { commonWidgetSelector } from "Selectors/common";

describe("dragAndDropWidget smoke", { retries: 0 }, () => {
  const testId = Date.now();

  before(() => {
    // Settle the CDP intercept while Cypress's own CDP traffic is quiet —
    // before any cy.visit / cy.intercept fires. Without this, the first
    // drag of a spec run consistently loses its dragIntercept event.
    cy.realDragInit();
  });

  beforeEach(() => {
    cy.apiLogin();
  });

  it("drops a Text widget into the module editor", () => {
    const modName = `drag-smoke-mod-${testId}`;
    cy.getAuthHeaders().then((headers) => {
      cy.request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/modules`,
        headers,
        body: { name: modName, icon: "floppydisk", type: "module" },
      }).then((res) => {
        expect(res.status).to.equal(201);
        const moduleId = res.body.id;
        Cypress.env("appId", moduleId);

        cy.intercept("GET", "/api/apps/*").as("getModuleData");
        cy.visit(`/${Cypress.env("workspaceId")}/apps/${moduleId}`);
        cy.wait("@getModuleData", { timeout: 30000 });
        cy.get('[data-cy="right-sidebar-components-button"]', {
          timeout: 20000,
        }).should("be.visible");
        cy.get('[component-type="ModuleContainer"]', {
          timeout: 20000,
        }).should("be.visible");
        cy.skipEditorPopover();
        cy.screenshot("module-ready", { capture: "viewport" });

        cy.dragAndDropWidget("Text", 200, 100);
        cy.screenshot("after-drag", { capture: "viewport" });

        cy.get(commonWidgetSelector.draggableWidget("text1"), {
          timeout: 30000,
        }).should("be.visible");

        if (!Cypress.env("CYPRESS_NO_CLEANUP")) {
          cy.apiDeleteApp(moduleId);
        }
      });
    });
  });

  it("drops a Text widget into the app editor (regression baseline)", () => {
    const appName = `drag-smoke-app-${testId}`;
    cy.apiCreateApp(appName).then(() => {
      const appId = Cypress.env("appId");
      cy.intercept("GET", "/api/apps/*").as("getAppData");
      cy.visit(`/${Cypress.env("workspaceId")}/apps/${appId}`);
      cy.wait("@getAppData", { timeout: 30000 });
      cy.get('[data-cy="right-sidebar-components-button"]', {
        timeout: 20000,
      }).should("be.visible");
      cy.skipEditorPopover();

      cy.dragAndDropWidget("Text", 200, 200);
      cy.get(commonWidgetSelector.draggableWidget("text1"), {
        timeout: 30000,
      }).should("be.visible");
    });

    if (!Cypress.env("CYPRESS_NO_CLEANUP")) {
      cy.apiDeleteApp();
    }
  });
});
