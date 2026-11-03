import { fake } from "Fixtures/fake";
import {
  buildLinearWorkflow,
  cleanupDataSources,
  cleanupWorkflows,
  createPostgresDataSource,
  importWorkflowApp,
  verifyTextInResponseOutputLimited,
} from "Support/utils/workflows/workFlows";
import { workflowsText } from "Texts/platform/workflows";


const data = {};

describe("Workflows - export and import round trip", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });


  afterEach(() => {
    cleanupWorkflows([data.workflowName, `${data.workflowName}-runjs`, `${data.workflowName}-pg`]);
    cleanupDataSources([`cypress-${data.dataSourceName}-manual-pgsql`]);
  });

  it("A RunJS workflow survives an export/import round trip and still executes", () => {
    const workflowName = `${data.workflowName}-runjs`;

    cy.apiCreateWorkflow(workflowName);
    cy.openWorkflow();

    buildLinearWorkflow({
      blockLabel: workflowsText.runjsNodeLabel,
      nodeName: workflowsText.runjs,
      inputField: workflowsText.runjsInputField,
      query: workflowsText.runjsNodeCode,
      responseReturn: workflowsText.responseNodeQuery,
    });
    cy.verifyTextInResponseOutput(workflowsText.responseNodeExpectedValueText);


    cy.exportWorkflowApp(workflowName);

    importWorkflowApp(workflowName, workflowsText.exportFixturePath);
    cy.verifyTextInResponseOutput(workflowsText.responseNodeExpectedValueText);

    cy.task("deleteFile", workflowsText.exportFixturePath);
  });

  it("A Postgres workflow survives an export/import round trip, including its data source binding", () => {
    const workflowName = `${data.workflowName}-pg`;
    const dataSourceName = `cypress-${data.dataSourceName}-manual-pgsql`;
    createPostgresDataSource(dataSourceName);

    cy.apiCreateWorkflow(workflowName);
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

    cy.exportWorkflowApp(workflowName);

    importWorkflowApp(workflowName, workflowsText.exportFixturePath);
    verifyTextInResponseOutputLimited(workflowsText.postgresExpectedValue);

    cy.task("deleteFile", workflowsText.exportFixturePath);
  });
});
