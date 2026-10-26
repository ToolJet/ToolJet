import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { workflowSelector } from "Selectors/platform/workflows";
import { licenseSelectors } from "Selectors/platform/license";
import {
  getCurrentCountFromLimitCounter,
  verifyLimitCounter,
  verifyLimitReachedModal,
} from "Support/utils/license";

describe("License - App & Workflow Limits", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.intercept("GET", "/api/license/access").as("getLicenseAccess");
    cy.apiDeleteAllApps();
  });

  it("should show the limit counter approaching the app limit and the limit-reached modal at the limit", () => {
    const app1Name = `${fake.companyName}-Limit-1`;
    const app2Name = `${fake.companyName}-Limit-2`;

    for (let i = 0; i < 9; i++) {
      cy.apiCreateApp(`${app1Name}-${i}`);
    }
    cy.visit("/my-workspace");
    cy.wait("@getLicenseAccess");
    cy.wait(2000);

    cy.get(commonSelectors.appCreateButton).should("be.enabled").click();
    cy.get(commonSelectors.createAppTitle).should("be.visible");
    verifyLimitCounter();
    getCurrentCountFromLimitCounter().then((counts) => {
      expect(counts.current).to.be.gte(9);
      expect(counts.total).to.equal(10);
    });
    cy.get(commonWidgetSelector.modalCloseButton).click();

    cy.apiCreateApp(app2Name);
    cy.get(commonSelectors.homePageIcon).click();
    cy.get(commonSelectors.dashboardIcon).click();

    cy.get(commonSelectors.appCreateButton).should("be.enabled").click();
    verifyLimitReachedModal("App limit reached", {
      bodyText: "You've reached your limit for applications (10/10).",
    });
    cy.get(commonSelectors.createAppTitle).should("not.exist");
    cy.get(licenseSelectors.limitCounter).should("not.exist");
    
    cy.apiGetAppIdByName(`${app1Name}-5`).then((id) => {
      cy.apiDeleteApp(id);
    });
    cy.get(commonSelectors.homePageIcon).click();
    cy.get(commonSelectors.dashboardIcon).click();

    cy.get(commonSelectors.appCreateButton).should("be.enabled").click();
    cy.get(licenseSelectors.limitReachedModal).should("not.exist");
    cy.get(licenseSelectors.limitCounter).should("be.visible");
    getCurrentCountFromLimitCounter().then((counts) => {
      expect(counts.current).to.equal(9);
      expect(counts.total).to.equal(10);
    });
    cy.get(commonWidgetSelector.modalCloseButton).click();

    cy.apiGetAppIdByName(app2Name).then((id) => {
      cy.apiDeleteApp(id);
    });
    cy.apiDeleteAllApps();
  });

  it("should show the limit counter approaching the workflow limit and the limit-reached modal at the limit", () => {
    const workflow1Name = `${fake.companyName}-Workflow-1`;
    const workflow2Name = `${fake.companyName}-Workflow-2`;

    cy.apiDeleteAllWorkflows();
    cy.apiCreateWorkflow(workflow1Name);
    cy.visit("my-workspace/workflows");
    cy.wait("@getLicenseAccess");
    cy.wait(2000);

    cy.get(workflowSelector.workflowsCreateButton).should("be.enabled").click();
    verifyLimitCounter();
    getCurrentCountFromLimitCounter().then((counts) => {
      expect(counts.current).to.be.gte(1);
      expect(counts.total).to.equal(2);
    });
    cy.get(commonWidgetSelector.modalCloseButton).click();

    cy.apiCreateWorkflow(workflow2Name);
    cy.get(commonSelectors.homePageIcon).click();
    cy.get(workflowSelector.globalWorkFlowsIcon).click();

    cy.get(workflowSelector.workflowsCreateButton).should("be.enabled").click();
    verifyLimitReachedModal("Workflow limit reached", {
      bodyText: "You've reached your limit for workflows (2/2).",
    });
    cy.get(licenseSelectors.limitCounter).should("not.exist");

    cy.apiDeleteWorkflow(workflow1Name);
    cy.get(commonSelectors.homePageIcon).click();
    cy.get(workflowSelector.globalWorkFlowsIcon).click();

    cy.get(workflowSelector.workflowsCreateButton).should("be.enabled").click();
    cy.get(licenseSelectors.limitReachedModal).should("not.exist");
    cy.get(licenseSelectors.limitCounter).should("be.visible");
    getCurrentCountFromLimitCounter().then((counts) => {
      expect(counts.current).to.equal(1);
      expect(counts.total).to.equal(2);
    });
    cy.get(commonWidgetSelector.modalCloseButton).click();

    cy.apiDeleteWorkflow(workflow2Name);
  });
});
