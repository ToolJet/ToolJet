import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { workflowSelector } from "Selectors/platform/workflows";
import { viewAppCardOptions } from "Support/utils/common";
import {
  cleanupApps,
  cleanupWorkflows,
  createWorkflowFromDashboard,
  navigateBackToWorkflowsDashboard,
  openWorkflowsDashboard,
  renameWorkflowFromCard,
} from "Support/utils/workflows/workFlows";
import { commonText } from "Texts/common";
import { workflowsText } from "Texts/platform/workflows";

// Dashboard CRUD for workflows.

const data = {};

describe("Workflows - dashboard CRUD", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.renamedWorkflow = `${data.workflowName}renamed`;
    data.appName = `${data.workflowName}app`;
  });


  afterEach(() => {
    cleanupWorkflows([data.workflowName, data.renamedWorkflow]);
    cleanupApps([data.appName]);
  });

  it("A workflow created from the dashboard opens with a start node and stays on the dashboard after reload", () => {
    openWorkflowsDashboard();
    createWorkflowFromDashboard(data.workflowName);

    // A new workflow is seeded with exactly one start node, which cannot be deleted.
    cy.get(workflowSelector.startNode, { timeout: 20000 })
      .should("be.visible")
      .and("have.length", 1);

    navigateBackToWorkflowsDashboard();
    cy.get(commonSelectors.appCard(data.workflowName)).should(
      "contain.text",
      data.workflowName
    );
    cy.reload();
    cy.get(commonSelectors.appCard(data.workflowName), {
      timeout: 20000,
    }).should("contain.text", data.workflowName);
  });

  it("The workflow card menu offers the workflow-specific actions", () => {
    cy.apiCreateWorkflow(data.workflowName);
    openWorkflowsDashboard();

    viewAppCardOptions(data.workflowName);
    cy.get(
      commonSelectors.appCardOptions(workflowsText.renameWorkflowOption)
    ).verifyVisibleElement("have.text", workflowsText.renameWorkflowOption);
    cy.get(
      commonSelectors.appCardOptions(workflowsText.changeIconOption)
    ).verifyVisibleElement("have.text", workflowsText.changeIconOption);
    cy.get(
      commonSelectors.appCardOptions(commonText.addToFolderOption)
    ).verifyVisibleElement("have.text", commonText.addToFolderOption);
    cy.get(
      commonSelectors.appCardOptions(workflowsText.exportWorkflowOption)
    ).verifyVisibleElement("have.text", workflowsText.exportWorkflowOption);
    cy.get(
      commonSelectors.appCardOptions(workflowsText.deleteWorkflowOption)
    ).verifyVisibleElement("have.text", workflowsText.deleteWorkflowOption);
  });

  it("The workflow card menu does not offer Clone", () => {
    cy.apiCreateWorkflow(data.workflowName);
    openWorkflowsDashboard();

    viewAppCardOptions(data.workflowName);
    cy.get(workflowSelector.cardOptions).should("be.visible");
    cy.get(workflowSelector.cardOptions).should(
      "not.contain.text",
      workflowsText.cloneAppOption
    );
    cy.get(workflowSelector.cardOptions).should(
      "not.contain.text",
      workflowsText.cloneWorkflowOption
    );
  });

  it("A renamed workflow keeps its new name on the dashboard", () => {
    cy.apiCreateWorkflow(data.workflowName);
    openWorkflowsDashboard();

    renameWorkflowFromCard(data.workflowName, data.renamedWorkflow);

    cy.get(commonSelectors.appCard(data.renamedWorkflow)).should(
      "contain.text",
      data.renamedWorkflow
    );
    cy.reload();
    cy.wait(3000);
    cy.get(commonSelectors.appCard(data.renamedWorkflow)).should("exist");
    cy.get(commonSelectors.appCard(data.workflowName)).should("not.exist");
  });

  it("An empty or duplicate workflow name is rejected", () => {
    cy.apiCreateWorkflow(data.workflowName);
    openWorkflowsDashboard();

    // Empty name must not be submittable.
    cy.get(workflowSelector.workflowsCreateButton).click();
    cy.get(workflowSelector.workFlowNameInputField).clear();
    cy.get(workflowSelector.createWorkFlowsButton).should("be.disabled");

    // Duplicate name must be refused rather than creating a second workflow
    // sharing the name.
    cy.get(workflowSelector.workFlowNameInputField).type(data.workflowName);
    cy.get(workflowSelector.createWorkFlowsButton).click();
    cy.wait(2000);
    cy.get("body").should("contain.text", "already exists");
  });

  it("Deleting a workflow from the dashboard removes its card after confirmation", () => {
    cy.apiCreateWorkflow(data.workflowName);
    openWorkflowsDashboard();

    // Cancelling the confirmation keeps the workflow.
    viewAppCardOptions(data.workflowName);
    cy.get(
      commonSelectors.appCardOptions(workflowsText.deleteWorkflowOption)
    ).click();
    cy.get(commonSelectors.modalComponent).should("be.visible");
    cy.get(commonSelectors.buttonSelector(commonText.cancelButton)).click();
    cy.get(commonSelectors.appCard(data.workflowName)).should("exist");

    // Confirming removes the card.
    cy.intercept("DELETE", "/api/apps/*").as("workflowDeleted");
    viewAppCardOptions(data.workflowName);
    cy.get(
      commonSelectors.appCardOptions(workflowsText.deleteWorkflowOption)
    ).click();
    cy.get(
      commonSelectors.buttonSelector(commonText.modalYesButton)
    ).click();
    cy.wait("@workflowDeleted");
    cy.get(commonSelectors.appCard(data.workflowName)).should("not.exist");
  });

  it("Workflows and apps do not leak into each other's dashboards", () => {
    cy.apiCreateWorkflow(data.workflowName);
    cy.apiCreateApp(data.appName);

    openWorkflowsDashboard();
    cy.get(commonSelectors.appCard(data.workflowName)).should("exist");
    cy.get(commonSelectors.appCard(data.appName)).should("not.exist");

    cy.visit("/my-workspace");
    cy.wait(3000);
    cy.get(commonSelectors.appCard(data.appName)).should("exist");
    cy.get(commonSelectors.appCard(data.workflowName)).should("not.exist");
  });

  it("Dashboard search matches a workflow by name and reflects a rename", () => {
    cy.apiCreateWorkflow(data.workflowName);
    openWorkflowsDashboard();

    cy.get(commonSelectors.homePageSearchBar).clear().type(data.workflowName);
    cy.wait(2000);
    cy.get(commonSelectors.appCard(data.workflowName)).should("exist");

    cy.get(commonSelectors.homePageSearchBar).clear();
    cy.wait(1000);
    renameWorkflowFromCard(data.workflowName, data.renamedWorkflow);

    cy.get(commonSelectors.homePageSearchBar)
      .clear()
      .type(data.renamedWorkflow);
    cy.wait(2000);
    cy.get(commonSelectors.appCard(data.renamedWorkflow)).should("exist");

    cy.get(commonSelectors.homePageSearchBar).clear().type(data.workflowName);
    cy.wait(2000);
    cy.get(commonSelectors.appCard(data.workflowName)).should("not.exist");
  });
});
