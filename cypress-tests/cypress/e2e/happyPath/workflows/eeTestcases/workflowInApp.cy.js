import { fake } from "Fixtures/fake";
import { workflowsText } from "Texts/platform/workflows";
import {
  buildLinearWorkflow,
  createPostgresDataSource,
  verifyTextInResponseOutputLimited,
  previewWorkflowQueryInApp,
  cleanupWorkflows,
  cleanupApps,
  cleanupDataSources,
} from "Support/utils/workFlows";

// A workflow is consumed from an app as a query. Each case checks the workflow
// works on its own, then that an app running it gets the workflow's result.
const data = {};

describe("Workflows - running from an app", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.appName = `${data.workflowName}-wf-app`;
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  // Teardown runs here so a test that fails part-way still cleans up — a leaked
  // workflow or data source breaks later specs on the same instance. Workflows
  // go first: a data source still used by a workflow query can't be deleted.
  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
    cleanupApps([data.appName]);
    cleanupDataSources([`cypress-${data.dataSourceName}-manual-pgsql`]);
  });

  it("An app runs an API-built workflow and receives its result, and the run is logged", () => {
    // start → runjs1 (returns the start params) → response, built over the API.
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
    cy.apiGetDataSourceId("runjs");
    cy.apiCreateWorkflowNode("runjs", "runjs1", {
      code: workflowsText.runjsNodeCode,
      parameters: [],
    });
    cy.apiWireWorkflowDefinition({
      processingNodeName: "runjs1",
      processingKind: "runjs",
      defaultParams: '{"dev":"your value"}',
      responseCode: workflowsText.responseNodeQuery,
      responseStatus: "200",
    });

    // Run directly first: the run succeeds and its logs carry the data. This
    // has to happen before cy.openApp, which overwrites the version ids used.
    cy.apiExecuteWorkflow(workflowsText.jsonValuePlaceholder);
    cy.apiValidateLogs();
    cy.apiValidateLogsWithData(workflowsText.jsonValuePlaceholder);

    cy.apiCreateApp(data.appName);
    cy.openApp();
    cy.addWorkflowInApp(data.workflowName);

    // The app passes no params, so the workflow runs on its default params.
    previewWorkflowQueryInApp(workflowsText.jsonValuePlaceholder).then(
      (result) => {
        expect(result.executionStatus).to.equal("completed");
        expect(result.data).to.deep.equal({
          dev: workflowsText.jsonValuePlaceholder,
        });
      }
    );
  });

  it("An app runs a Postgres-backed workflow and receives its rows", () => {
    const dataSourceName = `cypress-${data.dataSourceName}-manual-pgsql`;
    createPostgresDataSource(dataSourceName);

    cy.apiCreateWorkflow(data.workflowName);
    cy.openWorkflow();

    buildLinearWorkflow({
      blockLabel: dataSourceName,
      nodeName: workflowsText.postgresqlNodeName,
      inputField: workflowsText.pgsqlQueryInputField,
      query: workflowsText.postgresNodeQuery,
      responseReturn: workflowsText.postgresResponseNodeQuery,
      clearBeforeTyping: true,
    });
    verifyTextInResponseOutputLimited(workflowsText.postgresExpectedValue);

    cy.apiCreateApp(data.appName);
    cy.openApp();
    cy.addWorkflowInApp(data.workflowName);

    previewWorkflowQueryInApp(workflowsText.postgresExpectedValue)
      .its("executionStatus")
      .should("equal", "completed");
  });
});
