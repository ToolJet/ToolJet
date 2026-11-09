import { fake } from "Fixtures/fake";
import { workflowsText } from "Texts/platform/workflows";
import {
  wfStartNode,
  wfQueryNode,
  wfIfNode,
  wfEdge,
  workflowDefinition,
  findExecutionNode,
  createRunjsQueries,
  cleanupWorkflows,
} from "Support/utils/workflows/workFlows";

const data = {};

// Graphs are saved over the API and run with POST /api/workflow_executions.
describe("Workflows - control flow nodes", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-flow`;
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
  });

  it("An if-condition runs only the branch its expression selects", () => {
    createRunjsQueries({
      onTrue: "return 'took true'",
      onFalse: "return 'took false'",
    }).then((ids) => {
      cy.apiSaveWorkflowDefinition(
        workflowDefinition({
          nodes: [
            wfStartNode(),
            wfIfNode("if", "startTrigger.params.route === 'yes'"),
            wfQueryNode("true-node", ids.onTrue),
            wfQueryNode("false-node", ids.onFalse),
          ],
          edges: [
            wfEdge("start", "if"),
            wfEdge("if", "true-node", "true"),
            wfEdge("if", "false-node", "false"),
          ],
          queryIds: [ids.onTrue, ids.onFalse],
        })
      );
    });

    [
      { route: "yes", taken: "onTrue", skipped: "onFalse", value: "took true" },
      { route: "no", taken: "onFalse", skipped: "onTrue", value: "took false" },
    ].forEach(({ route, taken, skipped, value }) => {
      cy.apiRunWorkflow({ params: { route } })
        .its("status")
        .should("equal", 201);
      cy.apiGetWorkflowExecution().its("status").should("equal", "success");
      cy.apiGetWorkflowExecutionNodes().then((nodes) => {
        const ifNode = findExecutionNode(nodes, "ifCondition1");
        expect(ifNode.result.data, `if result for ${route}`).to.equal(
          route === "yes"
        );
        expect(findExecutionNode(nodes, taken).executed).to.equal(true);
        expect(findExecutionNode(nodes, taken).result.data).to.equal(value);
        expect(findExecutionNode(nodes, skipped).executed).to.equal(false);
        expect(findExecutionNode(nodes, skipped).result).to.not.exist;
      });
    });
  });

  it("A looped query runs once per array item and fails on a non-array input", () => {
    createRunjsQueries({ loop1: "return value * 10" }).then((ids) => {
      cy.apiSaveWorkflowDefinition(
        workflowDefinition({
          nodes: [
            wfStartNode(),
            wfQueryNode("loop-node", ids.loop1, "runjs", {
              looped: true,
              iterationValuesCode: "return startTrigger.params.items",
            }),
          ],
          edges: [wfEdge("start", "loop-node")],
          queryIds: [ids.loop1],
        })
      );
    });

    cy.apiRunWorkflow({ params: { items: [1, 2, 3] } });
    cy.apiGetWorkflowExecution().its("status").should("equal", "success");
    cy.apiGetWorkflowExecutionNodes().then((nodes) => {
      expect(findExecutionNode(nodes, "loop1").result.data).to.deep.equal([
        10, 20, 30,
      ]);
    });

    cy.apiRunWorkflow({ params: { items: "not-an-array" } });
    cy.apiGetWorkflowExecution().then((execution) => {
      expect(execution.status).to.equal("failure");
      expect(JSON.stringify(execution.logs)).to.include(
        workflowsText.loopNotArrayError
      );
    });
  });

  it("A query with an error handler routes a failure down its failure branch", () => {
    createRunjsQueries({
      failing: "throw new Error('boom')",
      recover: "return 'recovered'",
      afterSuccess: "return 'should not run'",
    }).then((ids) => {
      cy.apiSaveWorkflowDefinition(
        workflowDefinition({
          nodes: [
            wfStartNode(),
            wfQueryNode("failing-node", ids.failing, "runjs", {
              errorHandler: true,
            }),
            wfQueryNode("recover-node", ids.recover),
            wfQueryNode("success-node", ids.afterSuccess),
          ],
          edges: [
            wfEdge("start", "failing-node"),
            wfEdge("failing-node", "recover-node", "failure"),
            wfEdge("failing-node", "success-node", "success"),
          ],
          queryIds: [ids.failing, ids.recover, ids.afterSuccess],
        })
      );
    });

    cy.apiRunWorkflow();
    cy.apiGetWorkflowExecution().its("status").should("equal", "success");
    cy.apiGetWorkflowExecutionNodes().then((nodes) => {
      expect(findExecutionNode(nodes, "failing").result.status).to.equal(
        "failed"
      );
      expect(findExecutionNode(nodes, "recover").result.data).to.equal(
        "recovered"
      );
      expect(findExecutionNode(nodes, "afterSuccess").executed).to.equal(false);
    });
  });

  it("Without an error handler a failing query fails the run and stops it", () => {
    createRunjsQueries({
      failing: "throw new Error('boom')",
      next: "return 'should not run'",
    }).then((ids) => {
      cy.apiSaveWorkflowDefinition(
        workflowDefinition({
          nodes: [
            wfStartNode(),
            wfQueryNode("failing-node", ids.failing),
            wfQueryNode("next-node", ids.next),
          ],
          edges: [
            wfEdge("start", "failing-node"),
            wfEdge("failing-node", "next-node", "success"),
          ],
          queryIds: [ids.failing, ids.next],
        })
      );
    });

    cy.apiRunWorkflow();
    cy.apiGetWorkflowExecution().then((execution) => {
      expect(execution.status).to.equal("failure");
      expect(JSON.stringify(execution.logs)).to.include("boom");
    });
    cy.apiGetWorkflowExecutionNodes().then((nodes) => {
      expect(findExecutionNode(nodes, "next").executed).to.equal(false);
    });
  });
});
