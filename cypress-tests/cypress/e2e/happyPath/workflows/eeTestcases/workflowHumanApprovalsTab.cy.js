import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import {
  humanSelector,
  approvalSelector,
  executionsSelector,
} from "Selectors/platform/workflows";
import { humanText } from "Texts/platform/workflows";
import { cleanupWorkflows, cleanupFolders } from "Support/utils/workflows/workFlows";
import {
  createHumanWorkflow,
  runUntilWaiting,
  visitApprovals,
  visitExecutions,
  openApprovalRequest,
  chooseOutcomeInDialog,
  pickSelectOption,
  runFromEditorUntilWaiting,
  openWorkflowEditor,
} from "Support/utils/workflows/workflowApprovals";

const SLOW_API = {
  responseTimeout: 60000,
  requestTimeout: 60000,
  pageLoadTimeout: 120000,
  defaultCommandTimeout: 45000,
};

const data = {};

const isoDay = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const rowIds = () =>
  Cypress.$(approvalSelector.anyRow)
    .toArray()
    .map((row) => row.getAttribute("data-cy").replace("approvals-row-", ""));

describe("Workflows - Approvals tab", SLOW_API, () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-appr`;
    data.otherName = `${fake.lastName.toLowerCase()}-apprb`;
    data.folderName = `${fake.lastName.toLowerCase()}-apprfolder`;
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName, data.otherName]);
    cleanupFolders([data.folderName]);
  });

  it("The list opens on Pending requests, newest first, and leaves resolved ones out", () => {
    createHumanWorkflow(data.workflowName);
    runUntilWaiting().then((first) => {
      runUntilWaiting().then((second) => {
        runUntilWaiting().then((third) => {
          cy.apiResolveApproval(third.id, "approved")
            .its("status")
            .should("equal", 201);

          visitApprovals();
          cy.get(approvalSelector.filterStatus).should("contain.text", "Pending");
          cy.get(approvalSelector.row(second.id)).should("be.visible");
          cy.get(approvalSelector.row(first.id)).should("be.visible");
          cy.get(approvalSelector.row(third.id)).should("not.exist");
          cy.then(() => {
            const ids = rowIds();
            expect(ids.indexOf(second.id), "newest first").to.be.lessThan(
              ids.indexOf(first.id)
            );
          });
        });
      });
    });
  });

  it("The filters narrow the list by workflow, status, approver and date", () => {
    createHumanWorkflow(data.workflowName, {
      human: {
        approvers: {
          users: [Cypress.env("user_id")],
          groups: [],
          dynamic: "",
          tokenBypass: true,
        },
      },
    });
    runUntilWaiting().then((mine) => {
      createHumanWorkflow(data.otherName);
      runUntilWaiting().then((other) => {
        cy.apiResolveApproval(other.id, "rejected");

        visitApprovals();
        cy.get(approvalSelector.row(mine.id)).should("be.visible");

        pickSelectOption(
          `${approvalSelector.filterWorkflow} .react-select__control`,
          data.otherName
        );
        cy.get(approvalSelector.row(mine.id)).should("not.exist");
        pickSelectOption(
          `${approvalSelector.filterWorkflow} .react-select__control`,
          data.workflowName
        );
        cy.get(approvalSelector.row(mine.id)).should("be.visible");

        pickSelectOption(
          `${approvalSelector.filterStatus} .react-select__control`,
          "All statuses"
        );
        pickSelectOption(
          `${approvalSelector.filterWorkflow} .react-select__control`,
          data.otherName
        );
        cy.get(approvalSelector.row(other.id)).should("be.visible");
        pickSelectOption(
          `${approvalSelector.filterStatus} .react-select__control`,
          "Pending"
        );
        cy.get(approvalSelector.row(other.id)).should("not.exist");
        cy.get(approvalSelector.empty).should(
          "contain.text",
          humanText.noApprovalsMatch
        );

        pickSelectOption(
          `${approvalSelector.filterWorkflow} .react-select__control`,
          "All workflows"
        );
        cy.get(approvalSelector.filterApprover).type(Cypress.env("user_id"));
        cy.get(approvalSelector.row(mine.id)).should("be.visible");
        cy.get(approvalSelector.row(other.id)).should("not.exist");
        cy.get(approvalSelector.filterApprover).clear();

        cy.get(approvalSelector.filterFrom).type(isoDay(1));
        cy.get(approvalSelector.row(mine.id)).should("not.exist");
        cy.get(approvalSelector.filterFrom).clear().type(isoDay(-1));
        cy.get(approvalSelector.row(mine.id)).should("be.visible");
        cy.get(approvalSelector.filterTo).type(isoDay(-1));
        cy.get(approvalSelector.row(mine.id)).should("not.exist");
      });
    });
  });

  it("The environment filter shows a pending request only for the environment its run used", () => {
    createHumanWorkflow(data.workflowName);
    runUntilWaiting().then((request) => {
      visitApprovals();
      cy.get(approvalSelector.row(request.id)).should("be.visible");

      pickSelectOption(
        `${approvalSelector.filterEnvironment} .react-select__control`,
        "staging"
      );
      cy.get(approvalSelector.row(request.id)).should("not.exist");
      cy.get(approvalSelector.empty).should("contain.text", humanText.noApprovalsMatch);

      pickSelectOption(
        `${approvalSelector.filterEnvironment} .react-select__control`,
        "development"
      );
      cy.get(approvalSelector.row(request.id)).should("be.visible");

      pickSelectOption(
        `${approvalSelector.filterEnvironment} .react-select__control`,
        "All environments"
      );
      cy.get(approvalSelector.row(request.id)).should("be.visible");
    });
  });

  it("A workflow folder limits the requests and the workflow picker to the workflows inside it", () => {
    createHumanWorkflow(data.workflowName);
    const inFolderId = Cypress.env("workflowId");
    runUntilWaiting().then((inFolder) => {
      createHumanWorkflow(data.otherName);
      runUntilWaiting().then((outside) => {
        cy.apiCreateFolder(data.folderName, "workflow").then((folder) => {
          cy.apiAddAppToFolder(folder.id, inFolderId);
        });

        cy.visit(
          `/${Cypress.env("workspaceId")}/workflows/approvals?folder=${data.folderName}`
        );
        cy.get(approvalSelector.page).should("be.visible");
        cy.get(approvalSelector.filterWorkflow).should(
          "contain.text",
          `All workflows in ${data.folderName}`
        );
        cy.get(approvalSelector.row(inFolder.id)).should("be.visible");
        cy.get(approvalSelector.row(outside.id)).should("not.exist");

        cy.get(`${approvalSelector.filterWorkflow} .react-select__control`).click();
        cy.get(".react-select__option")
          .should("contain.text", data.workflowName)
          .and("not.contain.text", data.otherName);
      });
    });
  });

  it("The resolve dialog shows the step's details, one button per outcome and the input defaults", () => {
    createHumanWorkflow(data.workflowName, {
      human: {
        description: "Approve the quarterly budget",
        approvers: {
          users: [Cypress.env("user_id")],
          groups: [],
          dynamic: "",
          tokenBypass: true,
        },
        outcomes: [
          { key: "approved", label: "Approve", color: "#1E823B" },
          { key: "rejected", label: "Reject", color: "#D72D39" },
          { key: "escalate", label: "Escalate", color: "#4368E3" },
        ],
        inputSchema: [
          { name: "reason", type: "text", label: "Reason", required: false, default: "hello" },
          { name: "amount", type: "number", label: "Amount", required: false, default: "7" },
          { name: "urgent", type: "boolean", label: "Urgent", required: false, default: "true" },
          { name: "priority", type: "select", label: "Priority", required: false, options: ["Low", "High"], default: "High" },
        ],
      },
    });
    runUntilWaiting().then((request) => {
      visitApprovals();
      openApprovalRequest(request.id);
      cy.get(approvalSelector.detail)
        .should("contain.text", "human1")
        .and("contain.text", data.workflowName)
        .and("contain.text", "Approve the quarterly budget")
        .and("contain.text", "pending");
      cy.get(approvalSelector.detailApprovers).should("not.be.empty");
      cy.get(approvalSelector.anyOutcomeButton).should("have.length", 3);
      ["Approve", "Reject", "Escalate"].forEach((label, index) =>
        cy
          .get(approvalSelector.anyOutcomeButton)
          .eq(index)
          .should("have.text", label)
      );
      cy.get(approvalSelector.input("reason")).should("have.value", "hello");
      cy.get(approvalSelector.input("amount")).should("have.value", "7");
      cy.get(approvalSelector.input("urgent")).should("be.checked");
      cy.get(approvalSelector.input("priority")).should("have.value", "High");
    });
  });

  it("A required input blocks the decision until it is filled, then the confirmed request leaves the list", () => {
    createHumanWorkflow(data.workflowName, {
      human: {
        inputSchema: [
          { name: "reason", type: "text", label: "Reason", required: true, default: "" },
        ],
      },
    });
    runUntilWaiting().then((request) => {
      visitApprovals();
      openApprovalRequest(request.id);
      cy.get(approvalSelector.outcomeButton("approved")).click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        humanText.requiredInputToast("Reason"),
        false
      );
      cy.get(approvalSelector.detail).should("be.visible");
      cy.apiListApprovals({ status: "pending", app_id: Cypress.env("workflowId") })
        .its("body.requests")
        .should("have.length", 1);

      cy.get(approvalSelector.input("reason")).type("budget is within limits");
      chooseOutcomeInDialog("approved")
        .its("response.statusCode")
        .should("equal", 201);
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        humanText.resolvedToast("Approve")
      );
      cy.get(approvalSelector.detail).should("not.exist");
      cy.get(approvalSelector.row(request.id)).should("not.exist");
    });
  });

  it("A request someone else already resolved shows a clear message and drops out of the list", () => {
    createHumanWorkflow(data.workflowName);
    runUntilWaiting().then((request) => {
      visitApprovals();
      openApprovalRequest(request.id);
      cy.apiResolveApproval(request.id, "approved")
        .its("status")
        .should("equal", 201);

      cy.get(approvalSelector.outcomeButton("rejected")).click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        humanText.notPendingError
      );
      cy.get(approvalSelector.detail).should("not.exist");
      cy.get(approvalSelector.row(request.id)).should("not.exist");
    });
  });

  it("Resolved and cancelled requests show their final state and who resolved them, with nothing left to press", () => {
    createHumanWorkflow(data.workflowName);
    runUntilWaiting().then((resolved) => {
      runUntilWaiting().then((cancelled) => {
        cy.apiResolveApproval(resolved.id, "approved")
          .its("status")
          .should("equal", 201);
        cy.apiCancelApproval(cancelled.id).its("status").should("be.oneOf", [200, 201]);

        visitApprovals();
        pickSelectOption(
          `${approvalSelector.filterStatus} .react-select__control`,
          "Resolved"
        );
        openApprovalRequest(resolved.id);
        cy.get(approvalSelector.detailOutcome)
          .should("contain.text", "Approve")
          .and("contain.text", "by ");
        cy.get(approvalSelector.detail).should("contain.text", "resolved");
        cy.get(approvalSelector.anyOutcomeButton).should("not.exist");
        cy.get(approvalSelector.cancel).should("not.exist");
        cy.get("body").type("{esc}");
        cy.get(approvalSelector.detail).should("not.exist");

        pickSelectOption(
          `${approvalSelector.filterStatus} .react-select__control`,
          "Cancelled"
        );
        openApprovalRequest(cancelled.id);
        cy.get(approvalSelector.detailOutcome).should("contain.text", "cancelled");
        cy.get(approvalSelector.anyOutcomeButton).should("not.exist");
        cy.get(approvalSelector.cancel).should("not.exist");
      });
    });
  });
});

describe("Workflows - waiting runs in Executions and the editor Logs", SLOW_API, () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-wait`;
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
  });

  it("The Executions tab lists a waiting run with its workflow, trigger, version and environment", () => {
    createHumanWorkflow(data.workflowName);
    runUntilWaiting().then((request) => {
      visitExecutions();
      cy.get(executionsSelector.row(request.executionId))
        .should("contain.text", data.workflowName)
        .and("contain.text", humanText.statusWaiting)
        .and("contain.text", "Manual")
        .and("contain.text", Cypress.env("editingVersionName"))
        .and("contain.text", "development");
      cy.get(executionsSelector.stop(request.executionId)).should("be.visible");
    });
  });

  it("Stopping a waiting run from the Executions tab stops the run and cancels its request", () => {
    createHumanWorkflow(data.workflowName);
    runUntilWaiting().then((request) => {
      visitExecutions();
      cy.get(executionsSelector.stop(request.executionId)).click();
      cy.get(executionsSelector.row(request.executionId)).should(
        "contain.text",
        humanText.statusStopped
      );
      cy.get(executionsSelector.stop(request.executionId)).should("not.exist");

      visitApprovals();
      cy.get(approvalSelector.row(request.id)).should("not.exist");
      pickSelectOption(
        `${approvalSelector.filterStatus} .react-select__control`,
        "Cancelled"
      );
      cy.get(approvalSelector.row(request.id)).should("be.visible");
      cy.apiResolveApproval(request.id, "approved")
        .its("status")
        .should("equal", 409);
    });
  });

  it("Stopping a waiting run from the editor Logs panel stops the run and cancels its request", () => {
    createHumanWorkflow(data.workflowName);
    openWorkflowEditor();
    runFromEditorUntilWaiting();
    cy.get(humanSelector.logRunItem)
      .first()
      .should("contain.text", humanText.waitingRunLabel);
    cy.get(humanSelector.terminateRunButton).first().click();
    cy.get(humanSelector.waitingBanner).should("not.exist");
    cy.get(humanSelector.logRunItem)
      .first()
      .should("not.contain.text", humanText.waitingRunLabel);

    cy.then(() =>
      cy
        .apiListApprovals({ status: "cancelled", app_id: Cypress.env("workflowId") })
        .its("body.requests")
        .should("have.length", 1)
    );
    visitApprovals();
    cy.get(approvalSelector.page).should("not.contain.text", data.workflowName);
  });

  it("The editor Logs panel leaves Waiting on its own when the request is resolved, without a reload", () => {
    createHumanWorkflow(data.workflowName);
    openWorkflowEditor();
    runFromEditorUntilWaiting();
    cy.then(() =>
      cy
        .apiListApprovals({ status: "pending", app_id: Cypress.env("workflowId") })
        .its("body.requests.0")
        .then((request) => {
          cy.apiResolveApproval(request.id, "approved")
            .its("status")
            .should("equal", 201);
        })
    );

    cy.get(humanSelector.waitingBanner, { timeout: 60000 }).should("not.exist");
    cy.get(humanSelector.logRunItem)
      .first()
      .should("not.contain.text", humanText.waitingRunLabel);
  });
});
