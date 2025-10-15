import { fake } from "Fixtures/fake";
import { workflowsText } from "Texts/workflows";
import { workflowSelector } from "Selectors/workflows";

import {
  enterJsonInputInStartNode,
  verifyPreviewOutputText,
  verifyTextInResponseOutputLimited,
  navigateBackToWorkflowsDashboard,
} from "Support/utils/workFlows";

const data = {};

describe("Workflows features", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.appName = `${data.workflowName}-wf-app`;
    data.childWorkflowName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.parentWorkflowName = `${data.workflowName}-wf-app`;
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Creating workflow with long string input and validating execution", () => {
    cy.createWorkflowApp(data.workflowName);
    enterJsonInputInStartNode(workflowsText.longStringJsonText);
    cy.connectDataSourceNode(workflowsText.runjsNodeLabel);

    cy.get(workflowSelector.nodeName(workflowsText.runjs)).click({
      force: true,
    });

    cy.get(workflowSelector.inputField(workflowsText.runjsInputField))
      .click({ force: true })
      .realType(workflowsText.runjsNodeCode, { delay: 50 });

    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponseNode(
      workflowsText.runjs,
      workflowsText.responseNodeQuery
    );
    cy.verifyTextInResponseOutput(workflowsText.longStringJsonText);
    navigateBackToWorkflowsDashboard();
    cy.apiDeleteWorkflow(data.workflowName);
  });

  it("Creating workflow with Node Preview Validation and execution", () => {
    cy.createWorkflowApp(data.workflowName);
    enterJsonInputInStartNode();
    cy.connectDataSourceNode(workflowsText.runjsNodeLabel);

    cy.get(workflowSelector.nodeName(workflowsText.runjs)).click({
      force: true,
    });

    cy.get(workflowSelector.inputField(workflowsText.runjsInputField))
      .click({ force: true })
      .realType(workflowsText.runjsNodeCode, { delay: 50 });

    verifyPreviewOutputText(workflowsText.jsonValuePlaceholder);

    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponseNode(
      workflowsText.runjs,
      workflowsText.responseNodeQuery
    );
    cy.verifyTextInResponseOutput(workflowsText.jsonValuePlaceholder);
    navigateBackToWorkflowsDashboard();
    cy.apiDeleteWorkflow(data.workflowName);
  });

  // Need to run after bug fixes
  it("Creating workflow inside Workflow and validating execution", () => {
    cy.createWorkflowApp(data.childWorkflowName);
    enterJsonInputInStartNode();
    cy.connectDataSourceNode(workflowsText.runjsNodeLabel);

    cy.get(workflowSelector.nodeName(workflowsText.runjs)).click({
      force: true,
    });

    cy.get(workflowSelector.inputField(workflowsText.runjsInputField))
      .click({ force: true })
      .realType(workflowsText.runjsNodeCode, { delay: 50 });

    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponseNode(
      workflowsText.runjs,
      workflowsText.responseNodeQuery
    );
    cy.verifyTextInResponseOutput(workflowsText.responseNodeExpectedValueText);

    navigateBackToWorkflowsDashboard();

    cy.apiCreateWorkflow(data.parentWorkflowName)
    cy.openWorkflow();
    enterJsonInputInStartNode();
    cy.connectDataSourceNode(workflowsText.workflowNodeLabel);

    cy.get(workflowSelector.nodeName(workflowsText.workflowNode)).click({
      force: true,
    });

    cy.get('input[id^="react-select-"]')
      .eq(1)
      .type(data.childWorkflowName, { force: true });
    cy.get(".react-select__option")
      .contains(data.childWorkflowName)
      .click({ force: true });

    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponseNode(
      workflowsText.workflowNode,
      workflowsText.workflowResponseNodeQuery
    );
    // cy.verifyTextInResponseOutput(workflowsText.responseNodeExpectedValueText);
    navigateBackToWorkflowsDashboard();
    cy.apiDeleteWorkflow(data.childWorkflowName);
    cy.apiDeleteWorkflow(data.parentWorkflowName);
  });

  it("Creating workflow with large datasets and validating execution", () => {
    cy.createWorkflowApp(data.workflowName);
    enterJsonInputInStartNode();
    cy.connectDataSourceNode(workflowsText.runjsNodeLabel);

    cy.get(workflowSelector.nodeName(workflowsText.runjs)).click({
      force: true,
    });

    cy.get(workflowSelector.inputField(workflowsText.runjsInputField))
    .click({ force: true })
    .realType(workflowsText.runjsNodeQueryForLargedataSet, {
      parseSpecialCharSequences: false,
      delay: 0
    });

    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponseNode(
      workflowsText.runjs,
      workflowsText.responseNodeQuery
    );
    verifyTextInResponseOutputLimited(
      workflowsText.responseNodeExpectedValueTextForLargeDataset
    );

    navigateBackToWorkflowsDashboard();
    cy.apiDeleteWorkflow(data.workflowName);
  });
});
