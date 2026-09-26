import { fake } from "Fixtures/fake";
import { dataSourceSelector } from "Selectors/marketplace/dataSource";
import { workflowsText } from "Texts/platform/workflows";
import {
  buildLinearWorkflow,
  createPostgresDataSource,
  verifyTextInResponseOutputLimited,
  cleanupWorkflows,
  cleanupApps,
} from "Support/utils/workFlows";

// A workflow is consumed from an app as a query. These cases assert the
// app-side path: add the workflow to an app and run it from there.
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

  // Teardown also runs here so a test that fails part-way still cleans up.
  // Without it a failed case leaks its workflow onto the shared instance, and
  // later specs that open card menus then see more than one workflow card.
  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
    cleanupApps([data.appName]);
  });

  it("An app can run a RunJS-backed workflow", () => {
    cy.apiCreateWorkflow(data.workflowName);
    cy.openWorkflow();

    buildLinearWorkflow({
      blockLabel: workflowsText.runjsNodeLabel,
      nodeName: workflowsText.runjs,
      inputField: workflowsText.runjsInputField,
      query: workflowsText.runjsNodeCode,
      responseReturn: workflowsText.responseNodeQuery,
    });
    cy.verifyTextInResponseOutput(workflowsText.responseNodeExpectedValueText);

    // The workflow works standalone; now prove an app can drive it.
    cy.apiCreateApp(data.appName);
    cy.openApp();
    cy.addWorkflowInApp(data.workflowName);
    cy.get(dataSourceSelector.queryPreviewButton).click();

    // KNOWN GAP: the completion toast is not asserted. The upstream spec had
    // that assertion commented out pending a fix, and this rewrite did not
    // change what it asserts.
  });

  it("An app can run a Postgres-backed workflow", () => {
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
    cy.get(dataSourceSelector.queryPreviewButton).click();

    // KNOWN GAP: see the RunJS case above.

    // The data source can't be deleted while a workflow still references it
    // through this query node, so the workflow goes first.
    cy.apiDeleteWorkflow(data.workflowName);
    cy.apiDeleteDataSource(dataSourceName);
  });
});
