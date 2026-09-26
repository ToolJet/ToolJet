import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { workflowsText } from "Texts/platform/workflows";
import { workflowSelector } from "Selectors/platform/workflows";
import { viewAppCardOptions } from "Support/utils/common";
import {
  openWorkflowsDashboard,
  createWorkflowFromDashboard,
  renameWorkflowFromCard,
  cleanupWorkflows,
  cleanupApps,
} from "Support/utils/workFlows";

// Dashboard CRUD for workflows.
//
// The workflows dashboard renders the same surface as the apps dashboard, so
// these cases mirror dashboard.cy.js "Should verify the app CRUD operation" and
// reuse its helpers and data-cy hooks.
//
// Two things do NOT transfer from the app specs:
//   - the card menu copy differs ("Delete workflow", not "Delete app")
//   - no Clone control is offered on a workflow card
const data = {};

describe("Workflows - dashboard CRUD", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.renamedWorkflow = `${data.workflowName}renamed`;
    data.appName = `${data.workflowName}app`;
  });

  // Teardown lives here, not at the end of each test, so a test that fails
  // part-way still cleans up. Covers both names because several tests rename.
  afterEach(() => {
    cleanupWorkflows([data.workflowName, data.renamedWorkflow]);
    cleanupApps([data.appName]);
  });

  it("A workflow can be created from the workflows dashboard and opens with a start node", () => {
    openWorkflowsDashboard();
    createWorkflowFromDashboard(data.workflowName);

    // A new workflow is seeded with exactly one start node, which cannot be deleted.
    cy.get(workflowSelector.startNode, { timeout: 20000 })
      .should("be.visible")
      .and("have.length", 1);
  });

  it("A created workflow appears on the dashboard and survives reload", () => {
    cy.apiCreateWorkflow(data.workflowName);
    openWorkflowsDashboard();

    cy.get(commonSelectors.appCard(data.workflowName)).should(
      "contain.text",
      data.workflowName
    );

    cy.reload();
    cy.wait(3000);
    cy.get(commonSelectors.appCard(data.workflowName)).should(
      "contain.text",
      data.workflowName
    );
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
    // No clone control is offered on a workflow card. Asserting both possible
    // spellings absent pins the current guarantee and would catch an accidental
    // future exposure.
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
    // Workflows and apps share one listing surface discriminated by type, so a
    // scoping regression would surface each in the other's list.
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
