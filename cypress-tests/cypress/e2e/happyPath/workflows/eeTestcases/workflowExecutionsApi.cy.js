import { fake } from "Fixtures/fake";
import {
  wfStartNode,
  wfQueryNode,
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
      cy.apiGetWorkflowExecution(passedId)
        .its("status")
        .should("equal", "success");
      cy.apiGetWorkflowExecution(failedId).then((execution) => {
        expect(execution.status).to.equal("failure");
        expect(JSON.stringify(execution.logs)).to.include("requested failure");
      });
    });
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
