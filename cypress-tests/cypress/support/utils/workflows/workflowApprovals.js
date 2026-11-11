import {
  workflowSelector,
  humanSelector,
  approvalSelector,
  executionsSelector,
} from "Selectors/platform/workflows";
import { humanWorkflowDefinition } from "Support/utils/workflows/workFlows";

// ---------------------------------------------------------------------------
// Setup (API) — the UI is reserved for the action under test.
// ---------------------------------------------------------------------------

// Creates a workflow and saves a Start -> Human -> Response-per-outcome graph.
// `options` is what humanWorkflowDefinition takes ({ human, connect, ... }).
export const createHumanWorkflow = (workflowName, options = {}) => {
  cy.apiCreateWorkflowApp(workflowName);
  cy.apiFetchWorkflowContext();
  cy.apiSaveWorkflowDefinition(humanWorkflowDefinition(options));
};

// Runs the editing version and waits until it is parked on its approval
// request. Resolves with that request (as the approvals list returns it).
export const runUntilWaiting = (params = {}) => {
  cy.apiRunWorkflow({ params }).its("status").should("equal", 201);
  return cy.apiWaitForApproval();
};

export const asUser = (email, password = "password") => {
  cy.apiLogout();
  cy.apiLogin(email, password);
};

// ---------------------------------------------------------------------------
// Approvals tab
// ---------------------------------------------------------------------------

export const visitApprovals = () => {
  cy.intercept("GET", "/api/workflow-approvals*").as("approvalsList");
  cy.visit(`/${Cypress.env("workspaceId")}/workflows/approvals`);
  cy.wait("@approvalsList", { timeout: 90000 });
  cy.get(approvalSelector.page, { timeout: 30000 }).should("be.visible");
};

export const visitExecutions = () => {
  cy.visit(`/${Cypress.env("workspaceId")}/workflows/executions`);
  cy.get(executionsSelector.page, { timeout: 30000 }).should("be.visible");
};

export const openApprovalRequest = (requestId) => {
  cy.get(approvalSelector.row(requestId), { timeout: 20000 })
    .should("be.visible")
    .click();
  cy.get(approvalSelector.detail).should("be.visible");
};

// Clicks the outcome button of the open dialog and waits for the call.
export const chooseOutcomeInDialog = (outcomeKey) => {
  cy.intercept("POST", "/api/workflow-approvals/by-id/*/resolve").as(
    "resolveApproval"
  );
  cy.get(approvalSelector.outcomeButton(outcomeKey)).click();
  return cy.wait("@resolveApproval");
};

// Opens the request from the Approvals tab and resolves it through the dialog.
export const resolveInApprovalsTab = (requestId, outcomeKey) => {
  openApprovalRequest(requestId);
  chooseOutcomeInDialog(outcomeKey).its("response.statusCode").should("equal", 201);
  cy.get(approvalSelector.detail).should("not.exist");
};

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

// Opens the editor and waits for the environment to be resolved: a run
// started before that posts an empty environmentId and gets a 400.
export const openWorkflowEditor = () => {
  cy.intercept("GET", "/api/app-environments/*/versions*").as("editorEnvironment");
  cy.openWorkflow();
  cy.wait("@editorEnvironment", { timeout: 30000 });
};

export const openNodesSidebar = () => {
  cy.get(humanSelector.nodesSidebarIcon).click();
  cy.get(humanSelector.sidebarHumanNode).should("be.visible");
};

export const openHumanSettings = (nodeName = "human1") => {
  cy.get(humanSelector.node(nodeName)).click({ force: true });
  cy.get(humanSelector.modal).should("be.visible");
};

// A step's outcome handles as currently drawn on the canvas.
export const assertOutcomeHandles = (nodeName, outcomeKeys) => {
  cy.get(`[data-cy^="${nodeName}-node-handle-right-"]`).should(
    "have.length",
    outcomeKeys.length
  );
  outcomeKeys.forEach((key) =>
    cy.get(humanSelector.outcomeHandle(nodeName, key)).should("exist")
  );
};

// Run from the editor and wait for the logs panel to show the run.
export const runFromEditorUntilWaiting = (humanName = "human1") => {
  // Running before the editor has drawn the saved graph posts a stale one.
  cy.get(humanSelector.node(humanName), { timeout: 30000 }).should("be.visible");
  cy.intercept("POST", "/api/workflow_executions/*/trigger").as("editorRun");
  cy.get(workflowSelector.workflowRunButton).should("not.be.disabled").click();
  cy.wait("@editorRun", { responseTimeout: 60000 }).then(({ response }) => {
    expect(response.statusCode, JSON.stringify(response.body)).to.equal(201);
  });
  cy.get(humanSelector.logRunItem, { timeout: 30000 })
    .first()
    .should("contain.text", "Waiting for input");
  // The banner belongs to the Human step's own log entry.
  cy.get(humanSelector.nodeColumnItem(humanName)).click();
  cy.get(humanSelector.waitingBanner, { timeout: 30000 }).should("be.visible");
};

// Picks an option of a react-select inside `scopeSelector`.
export const pickSelectOption = (controlSelector, optionText) => {
  cy.get(controlSelector).click();
  const escaped = optionText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  cy.contains(".react-select__option", new RegExp(`^${escaped}$`)).click();
};

// React ignores a plain `.invoke("val")` on controlled inputs (it tracks the
// last value it rendered), so colour inputs are set through the native setter.
export const setNativeInputValue = (selector, value) => {
  cy.get(selector).then(($input) => {
    const input = $input[0];
    const setter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(input),
      "value"
    ).set;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

// Dragging a node from the sidebar onto the canvas needs a real DataTransfer.
export const dragSidebarNodeToCanvas = (sidebarSelector, x = 650, y = 420) => {
  const dataTransfer = new DataTransfer();
  cy.get(sidebarSelector).trigger("dragstart", { dataTransfer });
  cy.get(".react-flow")
    .trigger("dragover", { dataTransfer, clientX: x, clientY: y })
    .trigger("drop", { dataTransfer, clientX: x, clientY: y });
};
