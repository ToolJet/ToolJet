import { fake } from "Fixtures/fake";

// The API-driven counterpart to the UI suites: build, wire and execute a
// workflow entirely through the workflow API, then assert the run result and
// that it was logged. No browser interaction with the editor at all.
//
// Note the log assertion is time-based — it checks a relative timestamp, which
// says a run happened recently rather than that it succeeded. See
// known-issues.md in the workflow-cypress-tdd skill.
const data = {};

describe("Workflows - build and execute over the API", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
  });

  it("A workflow built and executed through the API returns its result and logs the run", () => {
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
    cy.apiGetDataSourceId("runjs");

    cy.apiCreateWorkflowNode("runjs", "runjs1", {
      code: "return startTrigger.params",
      parameters: [],
    });

    cy.apiWireWorkflowDefinition({
      processingNodeName: "runjs1",
      processingKind: "runjs",
      defaultParams: '{"dev":"your value"}',
      responseCode: "return runjs1.data",
      responseStatus: "200",
    });

    cy.apiOpenWorkflowByName(data.workflowName);
    cy.apiExecuteWorkflow("your value");

    cy.apiValidateLogs();
    cy.apiValidateLogsWithData("your value");

    cy.apiDeleteWorkflow(data.workflowName);
  });
});
