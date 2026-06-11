import { fake } from "Fixtures/fake";
const data = {};

describe("Workflows with API", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Create workflow, connect nodes and execute with API", () => {
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
    cy.apiGetDataSourceId('runjs');
    cy.apiCreateWorkflowNode('runjs', 'runjs1', { code: 'return startTrigger.params', parameters: [] });
    cy.apiWireWorkflowDefinition({
      processingNodeName: 'runjs1',
      processingKind: 'runjs',
      defaultParams: '{"dev":"your value"}',
      responseCode: 'return runjs1.data',
      responseStatus: '200'
    });

    cy.apiOpenWorkflowByName(data.workflowName);
    cy.apiExecuteWorkflow('your value');
    cy.apiValidateLogs();
    cy.apiValidateLogsWithData('your value');
    cy.apiDeleteWorkflow(data.workflowName);
  });
});