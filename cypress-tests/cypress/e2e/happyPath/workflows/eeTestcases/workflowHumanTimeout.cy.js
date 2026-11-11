import { fake } from "Fixtures/fake";
import {
  humanSelector,
  approvalSelector,
  executionsSelector,
} from "Selectors/platform/workflows";
import { humanText } from "Texts/platform/workflows";
import { cleanupWorkflows } from "Support/utils/workflows/workFlows";
import {
  createHumanWorkflow,
  runUntilWaiting,
  visitApprovals,
  visitExecutions,
  openApprovalRequest,
  openHumanSettings,
  pickSelectOption,
} from "Support/utils/workflows/workflowApprovals";

// The shared instance is often busy; give API and page responses room.
const SLOW_API = {
  responseTimeout: 60000,
  requestTimeout: 60000,
  pageLoadTimeout: 120000,
  defaultCommandTimeout: 45000,
};

const data = {};

// Short deadlines keep these fast. The timer runs on the worker through the
// approval-timeout queue, so these cases need a worker, like the rest of HITL.
const SHORT_TIMEOUT_SECONDS = 10;

const timeoutOutcomeField = () =>
  cy
    .contains("label", humanSelector.timeoutOutcomeLabel)
    .closest(".field-group");

const timeoutConfig = (onExpire, timeoutOutcome = "") => ({
  enabled: true,
  durationSeconds: SHORT_TIMEOUT_SECONDS,
  onExpire,
  timeoutOutcome,
});

describe("Workflows - Human step timeout", SLOW_API, () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-htime`;
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
  });

  it("The timeout is off by default and, once switched on, starts at 1 day and fails the run on expiry", () => {
    createHumanWorkflow(data.workflowName);
    cy.openWorkflow();
    openHumanSettings();

    cy.get(humanSelector.timeoutToggle).should("not.be.checked");
    cy.get(humanSelector.timeoutDuration).should("not.exist");

    cy.get(humanSelector.timeoutToggle).check({ force: true });
    cy.get(humanSelector.timeoutDurationValue).should("have.value", "1");
    cy.get(humanSelector.timeoutDuration).should("contain.text", "Days");
    cy.get(humanSelector.onExpireBranch).eq(0).should("be.checked");
    cy.get(humanSelector.onExpireBranch).eq(1).should("not.be.checked");

    cy.apiWaitForHumanNodeData(
      (nodeData) => nodeData.timeout?.enabled === true,
      undefined,
      "the enabled timeout to be saved"
    ).then((nodeData) => {
      expect(nodeData.timeout.durationSeconds).to.equal(86400);
      expect(nodeData.timeout.onExpire).to.equal("fail");
    });
  });

  it("Branching on expiry without a timeout outcome shows a warning until an outcome is picked", () => {
    createHumanWorkflow(data.workflowName, {
      human: { timeout: { ...timeoutConfig("branch", "rejected") } },
      connect: [],
    });
    cy.openWorkflow();
    openHumanSettings();
    timeoutOutcomeField().should("contain.text", "Reject");
    cy.get(humanSelector.timeoutOutcomeWarning).should("not.exist");

    // Removing the chosen outcome leaves the timeout with nothing to branch to.
    cy.get(humanSelector.outcomeRemove(1)).click();
    cy.get(humanSelector.timeoutOutcomeWarning)
      .should("be.visible")
      .and("contain.text", humanText.timeoutOutcomeWarning);

    timeoutOutcomeField().find(".react-select__control").click();
    cy.contains(".react-select__option", /^Approve$/).click();
    cy.get(humanSelector.timeoutOutcomeWarning).should("not.exist");
  });

  it("A request that passes its deadline with Fail is marked Expired and the run fails", () => {
    createHumanWorkflow(data.workflowName, {
      human: { timeout: timeoutConfig("fail") },
    });
    runUntilWaiting().then((request) => {
      cy.apiWaitForApproval({ status: "expired" });
      cy.apiWaitForExecutionStatus("failure");

      visitApprovals();
      pickSelectOption(
        `${approvalSelector.filterStatus} .react-select__control`,
        "Expired"
      );
      openApprovalRequest(request.id);
      cy.get(approvalSelector.detailOutcome).should("contain.text", "expired");
      cy.get(approvalSelector.anyOutcomeButton).should("not.exist");

      visitExecutions();
      cy.get(executionsSelector.row(request.executionId)).should(
        "contain.text",
        humanText.statusFailed
      );
      cy.apiResolveApproval(request.id, "approved")
        .its("status")
        .should("equal", 409);
    });
  });

  it("A request that passes its deadline with Branch is resolved by the system down the timeout outcome", () => {
    createHumanWorkflow(data.workflowName, {
      human: { timeout: timeoutConfig("branch", "rejected") },
    });
    runUntilWaiting().then((request) => {
      cy.apiWaitForApproval({ status: "resolved" }).then((resolved) => {
        expect(resolved.resolvedOutcome).to.equal("rejected");
        expect(resolved.resolvedBy).to.equal(null);
      });
      cy.apiWaitForExecutionStatus("success");
      cy.apiGetExecutionNode("response_rejected").then((node) => {
        expect(node.executed).to.equal(true);
        expect(node.result.data.outcome).to.equal("rejected");
        expect(node.result.data.resolvedBy ?? null).to.equal(null);
      });
      cy.apiGetExecutionNode("response_approved")
        .its("executed")
        .should("equal", false);

      visitApprovals();
      pickSelectOption(
        `${approvalSelector.filterStatus} .react-select__control`,
        "Resolved"
      );
      openApprovalRequest(request.id);
      cy.get(approvalSelector.detailOutcome)
        .should("contain.text", "Reject")
        .and("contain.text", "by the system");

      visitExecutions();
      cy.get(executionsSelector.row(request.executionId)).should(
        "contain.text",
        humanText.statusSuccess
      );
    });
  });
});
