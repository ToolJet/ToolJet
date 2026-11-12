import { fake } from "Fixtures/fake";
import {
  wfStartNode,
  wfQueryNode,
  wfHumanNode,
  wfOutcomeResponse,
  wfEdge,
  workflowDefinition,
  createRunjsQueries,
  cleanupWorkflows,
} from "Support/utils/workflows/workFlows";

const SLOW_API = {
  responseTimeout: 60000,
  requestTimeout: 60000,
  pageLoadTimeout: 120000,
  defaultCommandTimeout: 45000,
};

const PAYOUT_NODE_ID = "resp-approved";
const PAYOUT_NODE_NAME = "response_approved";

const data = {};

const asEndUser = (method, path, body) =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({
      method,
      url: `${Cypress.env("server_host")}${path}`,
      headers: {
        ...headers,
        "Content-Type": "application/json",
        "tj-workspace-id": Cypress.env("workspaceId"),
      },
      body,
      failOnStatusCode: false,
    })
  );

const runBody = (extra = {}) => ({
  environmentId: Cypress.env("environmentId"),
  appVersionId: Cypress.env("editingVersionId"),
  userId: Cypress.env("user_id"),
  executeUsing: "version",
  params: {},
  injectedState: {},
  ...extra,
});

const executionIdOf = (res) =>
  res.body?.workflowExecution?.id || res.body?.result?.executionId;

const pendingRequests = () =>
  cy
    .apiListApprovals({ status: "pending", app_id: Cypress.env("workflowId") })
    .its("body.requests");

const assertHumanStepNotSkipped = (res) => {
  if (res.status >= 400) return;
  const executionId = executionIdOf(res);
  expect(executionId, "execution id").to.be.ok;
  cy.apiLogout();
  cy.apiLogin();
  pendingRequests().then((requests) => {
    expect(requests.map((request) => request.executionId)).to.include(executionId);
  });
  cy.apiGetExecutionNode(PAYOUT_NODE_NAME, executionId).then((node) => {
    expect(node?.executed ?? false, "payout step executed").to.equal(false);
  });
};

describe("Workflows - Human step cannot be skipped by a run-only user", SLOW_API, () => {
  beforeEach(() => {
    data.workflowName = `${fake.lastName.toLowerCase()}-skip`;
    data.email = fake.email.toLowerCase();

    cy.apiLogin();
    cy.visit("/");
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
    createRunjsQueries({ calc: "return 1 + 1" }).then((ids) => {
      cy.apiSaveWorkflowDefinition(
        workflowDefinition({
          nodes: [
            wfStartNode(),
            wfQueryNode("calc-node", ids.calc),
            wfHumanNode("human1"),
            wfOutcomeResponse("human1", "approved", 0),
            wfOutcomeResponse("human1", "rejected", 1),
          ],
          edges: [
            wfEdge("start", "calc-node"),
            wfEdge("calc-node", "human1", "success"),
            wfEdge("human1", PAYOUT_NODE_ID, "approved"),
            wfEdge("human1", "resp-rejected", "rejected"),
          ],
          queryIds: [ids.calc],
        })
      );
    });
    cy.apiFullUserOnboarding(fake.firstName, data.email, "end-user");
    cy.apiLogout();
  });

  afterEach(() => {
    cy.apiLogout();
    cy.apiLogin();
    cy.visit("/");
    cleanupWorkflows([data.workflowName]);
  });

  it("A run-only user's normal run parks at the Human step with one approval request", () => {
    cy.apiLogin(data.email);
    cy.visit("/");
    cy.then(() =>
      asEndUser("POST", "/api/workflow_executions", runBody()).then((res) => {
        expect(res.status).to.equal(201);
        expect(res.body.result.executionStatus).to.equal("waiting");
      })
    );
    cy.apiLogout();
    cy.apiLogin();
    pendingRequests().should("have.length", 1);
  });

  // Suspected bug: a client-sent startNodeId is honoured for run-only users, so they can jump past the Human step.
  it("A run-only user cannot skip the Human step by starting from a later step on the run endpoint", () => {
    cy.apiLogin(data.email);
    cy.visit("/");
    cy.then(() =>
      asEndUser(
        "POST",
        "/api/workflow_executions",
        runBody({ startNodeId: PAYOUT_NODE_ID })
      ).then(assertHumanStepNotSkipped)
    );
  });

  // Suspected bug: same startNodeId bypass on the trigger route.
  it("A run-only user cannot skip the Human step by starting from a later step on the trigger endpoint", () => {
    cy.apiLogin(data.email);
    cy.visit("/");
    cy.then(() =>
      asEndUser(
        "POST",
        `/api/workflow_executions/${Cypress.env("editingVersionId")}/trigger`,
        runBody({ startNodeId: PAYOUT_NODE_ID, syncExecution: true })
      ).then(assertHumanStepNotSkipped)
    );
  });
});
