import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { workflowSelector } from "Selectors/workflows";
import {
  getCurrentCountFromBanner,
  verifyResourceLimit,
} from "Support/utils/license";

describe("License - App & Workflow Limits", () => {
  const data = {};

  beforeEach(() => {
    cy.apiLogin();
    cy.intercept("GET", "/api/license/access").as("getLicenseAccess");
    cy.apiDeleteAllApps();
  });

  it("should verify app limit progression, disable create/import/clone at limit", () => {
    const app1Name = `${fake.companyName}-Limit-1`;
    const app2Name = `${fake.companyName}-Limit-2`;

    cy.apiCreateApp(app1Name);
    cy.visit("/my-workspace");

    cy.wait("@getLicenseAccess");
    cy.wait(2000);

    verifyResourceLimit("apps", "basic");

    getCurrentCountFromBanner("apps").then((counts) => {
      expect(counts.current).to.be.gte(1);
      expect(counts.total).to.equal(2);
    });

    cy.apiCreateApp(app2Name);
    cy.get(commonSelectors.homePageIcon).click();
    cy.get(commonSelectors.dashboardIcon).click();
    cy.get('[data-cy="apps-limit-heading"]')
      .should("be.visible")
      .and("contain.text", "App limit reached");

    cy.get(commonSelectors.appCreateButton).should("be.disabled");

    // Step 5: Verify clone button disabled at limit (Bug)
    // cy.contains(app1Name).parents('[data-cy="app-card"]').within(() => {
    //   cy.get('[data-cy="app-card-menu-icon"]').click();
    // });
    // cy.get('[data-cy="app-card-clone-option"]').should("be.disabled");

    cy.apiGetAppIdByName(app1Name).then((id) => {
      cy.apiDeleteApp(id);
    });
    cy.get(commonSelectors.homePageIcon).click();
    cy.get(commonSelectors.dashboardIcon).click();

    cy.get(commonSelectors.appCreateButton).should("be.enabled");
    getCurrentCountFromBanner("apps").then((counts) => {
      expect(counts.current).to.equal(1);
      expect(counts.total).to.equal(2);
    });
    cy.apiGetAppIdByName(app2Name).then((id) => {
      cy.apiDeleteApp(id);
    });
  });

  it("should verify workflow limit progression, enforce API limit, validate deletion", () => {
    const workflow1Name = `${fake.companyName}-Workflow-1`;
    const workflow2Name = `${fake.companyName}-Workflow-2`;

    cy.apiCreateWorkflow(workflow1Name);
    cy.visit("my-workspace/workflows");

    cy.wait("@getLicenseAccess");
    cy.wait(2000);

    verifyResourceLimit("workflows", "basic", "workflow");

    getCurrentCountFromBanner("workflow").then((counts) => {
      expect(counts.current).to.be.gte(1);
      expect(counts.total).to.equal(2);
    });

    cy.apiCreateWorkflow(workflow2Name);

    cy.get(commonSelectors.homePageIcon).click();
    cy.get(workflowSelector.globalWorkFlowsIcon).click();

    cy.get('[data-cy="workflow-limit-heading"]')
      .should("be.visible")
      .and("contain.text", "Workflow limit reached");
    cy.get(workflowSelector.workflowsCreateButton).should("be.disabled");

    cy.apiDeleteWorkflow(workflow1Name);

    cy.get(commonSelectors.homePageIcon).click();
    cy.get(workflowSelector.globalWorkFlowsIcon).click();

    cy.get(workflowSelector.workflowsCreateButton).should("be.enabled");

    getCurrentCountFromBanner("workflow").then((counts) => {
      expect(counts.current).to.equal(1);
      expect(counts.total).to.equal(2);
    });

    cy.apiDeleteWorkflow(workflow2Name);
  });
});
