import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { deleteDatasource } from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
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
    data.wfName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.appName = `${data.wfName}-wf-app`;
    data.childWFName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.parentWFName = `${data.wfName}-wf-app`;
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Creating workflow with long string input and validating execution", () => {
    cy.createWorkflowApp(data.wfName);
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
    cy.deleteWorkflow(data.wfName);
  });

  it("Creating workflow with Node Preview Validation and execution", () => {
    cy.createWorkflowApp(data.wfName);
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
    cy.deleteWorkflow(data.wfName);
  });

  // Need to run after bug fixes
  it("Creating workflow inside Workflow and validating execution", () => {
    cy.createWorkflowApp(data.childWFName);
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

    cy.createWorkflowApp(data.parentWFName);
    enterJsonInputInStartNode();
    cy.connectDataSourceNode(workflowsText.workflowNodeLabel);

    cy.get(workflowSelector.nodeName(workflowsText.workflowNode)).click({
      force: true,
    });

    cy.get('input[id^="react-select-"]')
      .eq(1)
      .type(data.childWFName, { force: true });
    cy.get(".react-select__option")
      .contains(data.childWFName)
      .click({ force: true });

    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponseNode(
      workflowsText.workflowNode,
      workflowsText.workflowResponseNodeQuery
    );
    // cy.verifyTextInResponseOutput(workflowsText.responseNodeExpectedValueText);
    cy.deleteWorkflow(data.childWFName);
    cy.deleteWorkflowfromDashboard(data.parentWFName);
  });

  it("Creating workflow with large datasets and validating execution", () => {
    cy.createWorkflowApp(data.wfName);
    enterJsonInputInStartNode();
    cy.connectDataSourceNode(workflowsText.runjsNodeLabel);

    cy.get(workflowSelector.nodeName(workflowsText.runjs)).click({
      force: true,
    });

    cy.get(workflowSelector.inputField(workflowsText.runjsInputField))
      .click({ force: true })
      .type(workflowsText.runjsNodeQueryForLargedataSet, {
        parseSpecialCharSequences: false,
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

    cy.deleteWorkflow(data.wfName);
  });
});
