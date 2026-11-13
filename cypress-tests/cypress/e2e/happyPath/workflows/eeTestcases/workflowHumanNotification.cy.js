import { fake } from "Fixtures/fake";
import {
  approvalSelector,
  executionsSelector,
} from "Selectors/platform/workflows";
import { humanText } from "Texts/platform/workflows";
import {
  cleanupWorkflows,
  wfStartNode,
  wfResponseNode,
  wfEdge,
  workflowDefinition,
} from "Support/utils/workflows/workFlows";
import {
  createHumanWorkflow,
  runUntilWaiting,
  visitApprovals,
  visitExecutions,
} from "Support/utils/workflows/workflowApprovals";

const SLOW_API = {
  responseTimeout: 60000,
  requestTimeout: 60000,
  pageLoadTimeout: 120000,
  defaultCommandTimeout: 45000,
};

const data = {};

// CI has no external receiver, so a second workflow's webhook trigger records the posted body.
const receiverInputs = [
  "nodeName",
  "description",
  "outcomes",
  "inputSchema",
  "requestId",
  "token",
  "resolveUrl",
  "expiresAt",
  "request",
  "node",
  "url",
].map((key) => ({
  key,
  type: ["outcomes", "inputSchema"].includes(key) ? "array" : "string",
  required: false,
}));

const createReceiver = (name) => {
  cy.apiCreateWorkflowApp(name);
  cy.apiFetchWorkflowContext();
  cy.apiSaveWorkflowDefinition({
    ...workflowDefinition({
      nodes: [wfStartNode(), wfResponseNode("resp", "return startTrigger.params")],
      edges: [wfEdge("start", "resp")],
    }),
    workflowInputs: receiverInputs,
  });
  cy.apiSetWorkflowWebhookEnabled(true);
  cy.apiGetWorkflowToken().then((token) => {
    data.receiver = {
      name,
      versionId: Cypress.env("editingVersionId"),
      url: `${Cypress.env("server_host")}/api/v2/webhooks/workflows/${Cypress.env("workflowId")}/trigger?version=${Cypress.env("editingVersionName")}&environment=development`,
      token,
    };
  });
};

const notificationTo = (extra = {}) => ({
  url: data.receiver.url,
  method: "POST",
  headers: { Authorization: `Bearer ${data.receiver.token}` },
  bodyTemplate: "",
  includeResolveUrl: true,
  ...extra,
});

const receivedBody = () =>
  cy.apiWaitForVersionExecutions(data.receiver.versionId).then((runs) =>
    cy
      .apiGetWorkflowExecutionNodes(runs[0].id)
      .then((nodes) => nodes.find((node) => node.type === "output").result.data)
  );

describe("Workflows - Human step notification webhook", SLOW_API, () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.receiverName = `${fake.lastName.toLowerCase()}-hrecv`;
    data.workflowName = `${fake.lastName.toLowerCase()}-hnote`;
    createReceiver(data.receiverName);
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName, data.receiverName]);
  });

  it("The default notification body carries the step's outcomes and inputs but no token, request id, deadline or resolve link", () => {
    createHumanWorkflow(data.workflowName, {
      human: {
        description: "Check the invoice",
        inputSchema: [
          { name: "reason", type: "text", label: "Reason", required: false, default: "" },
        ],
        notification: notificationTo(),
      },
    });
    runUntilWaiting().then((request) => {
      receivedBody().then((body) => {
        expect(body.nodeName).to.equal("human1");
        expect(body.description).to.equal("Check the invoice");
        expect(body.outcomes.map((outcome) => outcome.key)).to.deep.equal([
          "approved",
          "rejected",
        ]);
        expect(body.inputSchema.map((field) => field.name)).to.deep.equal([
          "reason",
        ]);
        ["token", "resolveUrl", "requestId", "expiresAt"].forEach((key) =>
          expect(body, key).to.not.have.property(key)
        );
      });

      visitApprovals();
      cy.get(approvalSelector.row(request.id)).should("contain.text", "pending");
      visitExecutions();
      cy.get(executionsSelector.row(request.executionId)).should(
        "contain.text",
        humanText.statusWaiting
      );
    });
  });

  it("A custom body template is filled with the request's approval values", () => {
    createHumanWorkflow(data.workflowName, {
      human: {
        notification: notificationTo({
          bodyTemplate:
            '{"request":"{{approval.requestId}}","token":"{{approval.token}}","node":"{{approval.nodeName}}","url":"{{approval.resolveUrl}}"}',
        }),
      },
    });
    runUntilWaiting().then((request) => {
      cy.apiGetApprovalToken(request.id).then((token) => {
        receivedBody().then((body) => {
          expect(body.request).to.equal(request.id);
          expect(body.token).to.equal(token);
          expect(body.node).to.equal("human1");
          expect(body.url).to.match(
            new RegExp(`/api/workflow-approvals/${token}$`)
          );
        });
      });

      visitExecutions();
      cy.get(executionsSelector.row(request.executionId)).should(
        "contain.text",
        humanText.statusWaiting
      );
    });
  });
});
