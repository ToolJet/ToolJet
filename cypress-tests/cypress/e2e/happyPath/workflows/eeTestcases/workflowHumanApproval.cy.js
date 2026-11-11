import { fake } from "Fixtures/fake";
import {
  workflowSelector,
  humanSelector,
  approvalSelector,
  executionsSelector,
} from "Selectors/platform/workflows";
import { humanText } from "Texts/platform/workflows";
import { commonSelectors } from "Selectors/common";
import { dataSourceSelector } from "Selectors/marketplace/dataSource";
import {
  cleanupWorkflows,
  cleanupApps,
  releaseWorkflow,
  wfStartNode,
  wfEdge,
  wfHumanNode,
  wfOutcomeResponse,
  workflowDefinition,
  humanWorkflowDefinition,
} from "Support/utils/workflows/workFlows";
import {
  createHumanWorkflow,
  runUntilWaiting,
  visitApprovals,
  visitExecutions,
  openApprovalRequest,
  chooseOutcomeInDialog,
  resolveInApprovalsTab,
  runFromEditorUntilWaiting,
  chooseOutcomeInDialog as chooseOutcome,
} from "Support/utils/workflows/workflowApprovals";

// The shared instance is often busy; give API and page responses room.
const SLOW_API = {
  responseTimeout: 60000,
  requestTimeout: 60000,
  pageLoadTimeout: 120000,
  defaultCommandTimeout: 45000,
};

const data = {};

// Every case runs a real Start -> Human -> Response graph: the run parks on the
// Human step, a person decides in the Approvals tab, and the run continues down
// the chosen outcome.
describe("Workflows - Human step approvals", SLOW_API, () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-hitl`;
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
  });

  it("A run reaching a Human step pauses as Waiting and raises exactly one request, which shows in Approvals and the Executions tab", () => {
    createHumanWorkflow(data.workflowName);
    runUntilWaiting().then((request) => {
      expect(request.status).to.equal("pending");
      cy.apiWaitForExecutionStatus("waiting").then((execution) => {
        expect(execution.executed).to.equal(false);
      });
      cy.apiListApprovals({ status: "pending", app_id: Cypress.env("workflowId") })
        .its("body.requests")
        .should("have.length", 1);

      visitApprovals();
      cy.get(approvalSelector.row(request.id))
        .should("contain.text", data.workflowName)
        .and("contain.text", "human1")
        .and("contain.text", "pending");

      visitExecutions();
      cy.get(executionsSelector.row(request.executionId))
        .should("contain.text", humanText.statusWaiting)
        .and("contain.text", data.workflowName);
    });
  });

  [
    { outcome: "approved", label: "Approve", skipped: "rejected" },
    { outcome: "rejected", label: "Reject", skipped: "approved" },
  ].forEach(({ outcome, label, skipped }) => {
    it(`Resolving a request as ${label} in the Approvals tab continues only down the ${outcome} branch`, () => {
      createHumanWorkflow(data.workflowName);
      runUntilWaiting().then((request) => {
        visitApprovals();
        openApprovalRequest(request.id);
        cy.get(approvalSelector.detail).should("contain.text", "human1");
        cy.get(approvalSelector.anyOutcomeButton).should("have.length", 2);
        chooseOutcomeInDialog(outcome)
          .its("response.statusCode")
          .should("equal", 201);
        cy.verifyToastMessage(
          commonSelectors.toastMessage,
          humanText.resolvedToast(label)
        );
        cy.get(approvalSelector.detail).should("not.exist");
        cy.get(approvalSelector.row(request.id)).should("not.exist");

        cy.apiWaitForExecutionStatus("success");
        cy.apiGetExecutionNode(`response_${outcome}`).then((node) => {
          expect(node.executed).to.equal(true);
          expect(node.result.data.branch).to.equal(outcome);
          expect(node.result.data.outcome).to.equal(outcome);
        });
        cy.apiGetExecutionNode(`response_${skipped}`).then((node) => {
          expect(node.executed).to.equal(false);
        });
      });
    });
  });

  it("An outcome with nothing connected ends the run as Success without running any other branch", () => {
    createHumanWorkflow(data.workflowName, { connect: ["approved"] });
    runUntilWaiting().then((request) => {
      visitApprovals();
      resolveInApprovalsTab(request.id, "rejected");
      cy.apiWaitForExecutionStatus("success");
      cy.apiGetExecutionNode("response_approved").then((node) => {
        expect(node.executed).to.equal(false);
      });

      visitExecutions();
      cy.get(executionsSelector.row(request.executionId)).should(
        "contain.text",
        humanText.statusSuccess
      );
    });
  });

  it("A later step reads the decision, the approver's input and who resolved it", () => {
    createHumanWorkflow(data.workflowName, {
      human: {
        inputSchema: [
          { name: "note", type: "text", label: "Note", required: false, default: "" },
          { name: "amount", type: "number", label: "Amount", required: false, default: "" },
        ],
      },
      connect: ["approved"],
    });
    runUntilWaiting().then((request) => {
      visitApprovals();
      openApprovalRequest(request.id);
      cy.get(approvalSelector.input("note")).type("looks good");
      cy.get(approvalSelector.input("amount")).type("42");
      chooseOutcome("approved").its("response.statusCode").should("equal", 201);

      cy.apiWaitForExecutionStatus("success");
      cy.apiGetExecutionNode("response_approved").then((node) => {
        expect(node.result.data.outcome).to.equal("approved");
        expect(node.result.data.input).to.deep.equal({
          note: "looks good",
          amount: 42,
        });
        expect(node.result.data.resolvedBy).to.equal(Cypress.env("user_id"));
      });
    });
  });

  it("Two Human steps in one run are resolved separately and each raises its own request", () => {
    const first = wfHumanNode("human1", { position: { x: 300, y: 250 } });
    const second = wfHumanNode("human2", { position: { x: 600, y: 250 } });
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
    cy.apiSaveWorkflowDefinition(
      workflowDefinition({
        nodes: [
          wfStartNode(),
          first,
          second,
          wfOutcomeResponse("human2", "approved", 0),
          wfOutcomeResponse("human2", "rejected", 1),
        ],
        edges: [
          wfEdge("start", "human1"),
          wfEdge("human1", "human2", "approved"),
          wfEdge("human2", "resp-approved", "approved"),
          wfEdge("human2", "resp-rejected", "rejected"),
        ],
      })
    );

    cy.apiRunWorkflow().its("status").should("equal", 201);
    cy.apiWaitForApproval({ nodeName: "human1" }).then((firstRequest) => {
      cy.apiListApprovals({ status: "pending", app_id: Cypress.env("workflowId") })
        .its("body.requests")
        .should("have.length", 1);
      visitApprovals();
      resolveInApprovalsTab(firstRequest.id, "approved");

      cy.apiWaitForApproval({ nodeName: "human2" }).then((secondRequest) => {
        expect(secondRequest.id).to.not.equal(firstRequest.id);
        cy.apiWaitForExecutionStatus("waiting");
        visitApprovals();
        cy.get(approvalSelector.row(secondRequest.id)).should(
          "contain.text",
          "human2"
        );
        cy.get(approvalSelector.row(firstRequest.id)).should("not.exist");
        resolveInApprovalsTab(secondRequest.id, "rejected");
      });
    });
    cy.apiWaitForExecutionStatus("success");
    cy.apiGetExecutionNode("response_rejected").its("executed").should("equal", true);
    cy.apiGetExecutionNode("response_approved").its("executed").should("equal", false);
  });

  it("Editing the Human step while a run waits does not change the pending request", () => {
    createHumanWorkflow(data.workflowName);
    runUntilWaiting().then((request) => {
      cy.apiSaveWorkflowDefinition(
        humanWorkflowDefinition({
          human: {
            outcomes: [
              { key: "approved", label: "Ship it", color: "#1E823B" },
              { key: "rejected", label: "Hold", color: "#D72D39" },
              { key: "later", label: "Later", color: "#4368E3" },
            ],
          },
        })
      );

      visitApprovals();
      openApprovalRequest(request.id);
      cy.get(approvalSelector.anyOutcomeButton).should("have.length", 2);
      cy.get(approvalSelector.outcomeButton("approved")).should(
        "have.text",
        "Approve"
      );
      cy.get(approvalSelector.outcomeButton("later")).should("not.exist");
      chooseOutcome("approved").its("response.statusCode").should("equal", 201);
      cy.apiWaitForExecutionStatus("success");
    });
  });

  it("A Human node with no outcomes fails the run with a clear setup error instead of waiting", () => {
    createHumanWorkflow(data.workflowName, {
      human: { outcomes: [] },
      connect: [],
    });
    cy.apiRunWorkflow().its("status").should("equal", 201);
    cy.apiWaitForExecutionStatus("failure").then((execution) => {
      const messages = execution.logs.map((log) => log.message).join(" | ");
      expect(messages.toLowerCase()).to.include(humanText.setupError);
    });
    cy.then(() =>
      cy
        .apiListApprovals({ app_id: Cypress.env("workflowId") })
        .its("body.requests")
        .should("have.length", 0)
    );

    visitApprovals();
    cy.get(approvalSelector.page).should("not.contain.text", data.workflowName);
    visitExecutions();
    cy.then(() => {
      cy.get(executionsSelector.row(Cypress.env("executionId"))).should(
        "contain.text",
        humanText.statusFailed
      );
    });
  });
});

// A Human step reached through a webhook or an app must hand the caller a
// "waiting" answer — the run is parked, not broken — and still raise a request.
describe("Workflows - Human step reached through a webhook or an app", SLOW_API, () => {
  const draftQuery = () => ({
    version: Cypress.env("editingVersionName"),
    environment: "development",
  });

  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-hitlhook`;
    data.appName = `${data.workflowName}-app`;
    createHumanWorkflow(data.workflowName);
    cy.apiGetWorkflowToken().then((token) => (data.token = token));
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
    cleanupApps([data.appName]);
  });

  it("A sync webhook call gets a waiting answer, not an error, and the request is raised for approval", () => {
    cy.apiSetWorkflowWebhookEnabled(true);
    cy.apiTriggerWorkflowWebhook({
      token: data.token,
      qs: draftQuery(),
    }).then((res) => {
      expect(res.status).to.equal(202);
      expect(res.body.executionStatus).to.equal("waiting");
      expect(res.body.executionId).to.be.a("string");
      expect(res.body.requestId).to.be.a("string");
      Cypress.env("executionId", res.body.executionId);

      visitApprovals();
      cy.get(approvalSelector.row(res.body.requestId)).should(
        "contain.text",
        data.workflowName
      );
      visitExecutions();
      cy.get(executionsSelector.row(res.body.executionId))
        .should("contain.text", humanText.statusWaiting)
        .and("contain.text", "Webhook");
    });
  });

  it("An async webhook call returns an execution id and the run then parks on the Human step", () => {
    cy.apiSetWorkflowWebhookEnabled(true);
    cy.apiTriggerWorkflowWebhook({
      token: data.token,
      qs: draftQuery(),
      async: true,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201]);
      const executionId = res.body.workflow_execution_id;
      expect(executionId).to.be.a("string");
      Cypress.env("executionId", executionId);

      cy.apiWaitForExecutionStatus("waiting", executionId);
      cy.apiWaitForApproval({ executionId }).then((request) => {
        visitApprovals();
        cy.get(approvalSelector.row(request.id)).should("be.visible");
        visitExecutions();
        cy.get(executionsSelector.row(executionId))
          .should("contain.text", humanText.statusWaiting)
          .and("contain.text", "Webhook");
      });
    });
  });

  it("An app running the workflow gets a waiting result, not an error, and the request is raised for approval", () => {
    releaseWorkflow(data.workflowName);
    cy.apiCreateApp(data.appName);
    cy.openApp();
    cy.addWorkflowInApp(data.workflowName);

    cy.intercept("POST", "/api/workflow_executions/*/trigger").as(
      "appWorkflowRun"
    );
    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.wait("@appWorkflowRun").then(({ response }) => {
      expect(response.statusCode, JSON.stringify(response.body)).to.be.oneOf([
        200,
        201,
        202,
      ]);
      expect(JSON.stringify(response.body)).to.include("waiting");
      const executionId =
        response.body.executionId ||
        response.body.result?.executionId ||
        response.body.workflowExecution?.id;
      cy.apiWaitForApproval({ executionId }).then((request) => {
        visitApprovals();
        cy.get(approvalSelector.row(request.id)).should("be.visible");
      });
    });
  });
});
