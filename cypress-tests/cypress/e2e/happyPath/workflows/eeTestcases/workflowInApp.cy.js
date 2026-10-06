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
} from "Support/utils/workflows/workFlows";


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
