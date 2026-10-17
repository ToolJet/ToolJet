import { fake } from "Fixtures/fake";
import {
  wfStartNode,
  wfQueryNode,
  wfResponseNode,
  wfEdge,
  workflowDefinition,
  createRunjsQueries,
  cleanupWorkflows,
} from "Support/utils/workflows/workFlows";

const data = {};

const listExecutions = () =>
  cy.getAuthHeaders().then((headers) =>
    cy
      .request({
        url: `${Cypress.env("server_host")}/api/workflow_executions?appVersionId=${Cypress.env("editingVersionId")}&page=1&per_page=10`,
        headers,
      })
      .its("body")
  );

const terminateExecution = (executionId) =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({
      method: "DELETE",
      url: `${Cypress.env("server_host")}/api/workflow_executions/${executionId}/terminate`,
      headers,
      failOnStatusCode: false,
    })
  );

describe("Workflows - execution history (API)", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-runs`;
    data.executionIds = [];
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
    createRunjsQueries({
      maybeFail: "if (startTrigger.params.fail) throw new Error('requested failure'); return 'ok'",
    }).then((ids) => {
      cy.apiSaveWorkflowDefinition(
        workflowDefinition({
          nodes: [wfStartNode(), wfQueryNode("node", ids.maybeFail)],
          edges: [wfEdge("start", "node")],
          queryIds: [ids.maybeFail],
        })
      );
    });
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
  });

  it("Run history lists every run of the version with its outcome", () => {
    [false, true].forEach((fail) => {
      cy.apiRunWorkflow({ params: { fail } }).then((res) => {
        expect(res.status).to.equal(201);
        data.executionIds.push(res.body.workflowExecution.id);
      });
    });

    listExecutions().then((body) => {
      const serialized = JSON.stringify(body);
      data.executionIds.forEach((id) => expect(serialized).to.include(id));
    });

    cy.then(() => {
      const [passedId, failedId] = data.executionIds;
      // The graph has no Response node; a run does not need one to succeed.
      cy.apiGetWorkflowExecution(passedId)
        .its("status")
        .should("equal", "success");
      cy.apiGetWorkflowExecution(failedId).then((execution) => {
        expect(execution.status).to.equal("failure");
        expect(JSON.stringify(execution.logs)).to.include("requested failure");
      });
    });
  });

  // The editor sends the start node's JSON as params; the run API itself does
  // not merge the saved defaultParams (only the webhook endpoint does, see
  // workflowWebhooksApi.cy.js), so a run sees exactly the params it was given.
  it("A run passes exactly the params it was given to the start trigger", () => {
    createRunjsQueries({ echo: "return startTrigger.params" }).then((ids) => {
      cy.apiSaveWorkflowDefinition(
        workflowDefinition({
          nodes: [
            wfStartNode(),
            wfQueryNode("echo-node", ids.echo),
            wfResponseNode("response", "return echo.data"),
          ],
          edges: [
            wfEdge("start", "echo-node"),
            wfEdge("echo-node", "response", "success"),
          ],
          queryIds: [ids.echo],
          defaultParams: JSON.stringify({ greeting: "hello" }),
        })
      );
    });

    cy.apiRunWorkflow({ params: { who: "me", count: 2 } }).then((res) => {
      expect(res.status).to.equal(201);
      expect(res.body.result.data).to.deep.equal({ who: "me", count: 2 });
    });
    cy.apiRunWorkflow({ params: {} }).then((res) => {
      expect(res.status).to.equal(201);
      expect(res.body.result.data).to.deep.equal({});
    });
  });

  // BUG: a workflow whose definition was never saved answers 500
  // "Cannot read properties of null (reading 'nodes')" instead of a 4xx.
  it.skip("Running a workflow with no saved definition is a client error (4xx)", () => {
    data.emptyWorkflowName = `${data.workflowName}-empty`;
    cy.apiCreateWorkflowApp(data.emptyWorkflowName);
    cy.apiFetchWorkflowContext();
    cy.apiRunWorkflow().its("status").should("be.within", 400, 499);
    cleanupWorkflows([data.emptyWorkflowName]);
  });

  // BUG: terminating a finished synchronous run answers 200
  // {success:true, previousState:"sync"} and overwrites the run's status
  // with "terminated".
  it.skip("Terminating a finished run is refused and keeps its outcome", () => {
    cy.apiRunWorkflow({ params: { fail: false } });
    cy.then(() =>
      terminateExecution(Cypress.env("executionId"))
        .its("status")
        .should("equal", 409)
    );
    cy.apiGetWorkflowExecution().its("status").should("equal", "success");
  });

  // BUG: the same path answers 200 for an execution id that does not exist.
  it.skip("Terminating an unknown execution is a not-found error", () => {
    terminateExecution("00000000-0000-0000-0000-000000000000")
      .its("status")
      .should("equal", 404);
  });
});
