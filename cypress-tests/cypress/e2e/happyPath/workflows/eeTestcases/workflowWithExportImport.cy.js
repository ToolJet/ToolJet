import { fake } from "Fixtures/fake";
import { workflowsText } from "Texts/platform/workflows";
import {
  buildLinearWorkflow,
  createPostgresDataSource,
  importWorkflowApp,
  verifyTextInResponseOutputLimited,
} from "Support/utils/workFlows";

// Round trip: build a working workflow, export it, delete it, re-import it and
// prove it still executes. The guarantee is that an exported definition stays
// runnable — not merely that a file downloads.
//
// Note the coupling: the import half reads the fixture the export half wrote in
// the same run, so a failure in export surfaces as a confusing import failure.
// See the workflow-cypress-tdd skill for the surface map and known issues.
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
    cy.apiDeleteWorkflow(workflowName);

    // Same name, rebuilt from the exported file: the re-imported workflow must
    // produce the same result as the original.
    importWorkflowApp(workflowName, workflowsText.exportFixturePath);
    cy.verifyTextInResponseOutput(workflowsText.responseNodeExpectedValueText);

    cy.apiDeleteWorkflow(workflowName);
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
    cy.apiDeleteWorkflow(workflowName);

    // The data source binding has to survive the round trip too, otherwise the
    // re-imported query returns nothing.
    importWorkflowApp(workflowName, workflowsText.exportFixturePath);
    verifyTextInResponseOutputLimited(workflowsText.postgresExpectedValue);

    cy.apiDeleteWorkflow(workflowName);
    cy.apiDeleteDataSource(dataSourceName);
    cy.task("deleteFile", workflowsText.exportFixturePath);
  });
});
