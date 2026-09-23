import { fake } from "Fixtures/fake";
import { workflowsText } from "Texts/platform/workflows";
import { workflowSelector } from "Selectors/platform/workflows";
import {
  buildLinearWorkflow,
  enterJsonInputInStartNode,
  verifyPreviewOutputText,
  verifyTextInResponseOutputLimited,
} from "Support/utils/workFlows";

// Payload handling and node preview: what survives a full run, and what the
// preview panel shows before one.
const data = {};

describe("Workflows - payloads and node preview", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.childWorkflowName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
    data.parentWorkflowName = `${data.workflowName}-parent`;
  });

  it("A long string passed through start trigger params survives the run intact", () => {
    cy.apiCreateWorkflow(data.workflowName);
    cy.openWorkflow();

    buildLinearWorkflow({
      startJson: workflowsText.longStringJsonText,
      blockLabel: workflowsText.runjsNodeLabel,
      nodeName: workflowsText.runjs,
      inputField: workflowsText.runjsInputField,
      query: workflowsText.runjsNodeCode,
      responseReturn: workflowsText.responseNodeQuery,
    });

    cy.verifyTextInResponseOutput(workflowsText.longStringJsonText);

    cy.apiDeleteWorkflow(data.workflowName);
  });

  it("Previewing a node shows its output before the workflow is run", () => {
    cy.apiCreateWorkflow(data.workflowName);
    cy.openWorkflow();

    enterJsonInputInStartNode();
    cy.connectDataSourceNode(workflowsText.runjsNodeLabel);

    cy.get(workflowSelector.nodeName(workflowsText.runjs)).click({
      force: true,
    });
    cy.get(workflowSelector.inputField(workflowsText.runjsInputField))
      .click({ force: true })
      .realType(workflowsText.runjsNodeCode, { delay: 50 });

    // Preview is asserted BEFORE the node is wired to a response node and
    // before any run — that is the whole point of this case.
    verifyPreviewOutputText(workflowsText.jsonValuePlaceholder);

    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponseNode(
      workflowsText.runjs,
      workflowsText.responseNodeQuery
    );
    cy.verifyTextInResponseOutput(workflowsText.jsonValuePlaceholder);

    cy.apiDeleteWorkflow(data.workflowName);
  });

  it("A large dataset reaches the response output without breaking the viewer", () => {
    cy.apiCreateWorkflow(data.workflowName);
    cy.openWorkflow();

    buildLinearWorkflow({
      blockLabel: workflowsText.runjsNodeLabel,
      nodeName: workflowsText.runjs,
      inputField: workflowsText.runjsInputField,
      query: workflowsText.runjsNodeQueryForLargedataSet,
      responseReturn: workflowsText.responseNodeQuery,
      // A 30k-element payload: typed with no delay, and special-character
      // sequences left uninterpreted so the code lands verbatim.
      typeOptions: { parseSpecialCharSequences: false, delay: 0 },
    });

    // The viewer cannot expand 30,000 nodes, so expansion is capped.
    verifyTextInResponseOutputLimited(
      workflowsText.responseNodeExpectedValueTextForLargeDataset
    );

    cy.apiDeleteWorkflow(data.workflowName);
  });

  // KNOWN GAP: this case builds the nested-workflow graph but does not assert
  // the child's value comes back — the upstream spec had that assertion
  // commented out pending a fix, and this rewrite deliberately did not change
  // what it asserts.
  it("A workflow can embed another workflow as a node and the graph builds", () => {
    cy.apiCreateWorkflow(data.childWorkflowName);
    cy.openWorkflow();

    buildLinearWorkflow({
      blockLabel: workflowsText.runjsNodeLabel,
      nodeName: workflowsText.runjs,
      inputField: workflowsText.runjsInputField,
      query: workflowsText.runjsNodeCode,
      responseReturn: workflowsText.responseNodeQuery,
    });
    cy.verifyTextInResponseOutput(workflowsText.responseNodeExpectedValueText);

    cy.apiCreateWorkflow(data.parentWorkflowName);
    cy.openWorkflow();
    enterJsonInputInStartNode();
    cy.connectDataSourceNode(workflowsText.workflowNodeLabel);

    cy.get(workflowSelector.nodeName(workflowsText.workflowNode)).click({
      force: true,
    });

    // The child-workflow picker is a react-select with no data-cy hook, so it
    // is addressed positionally. Adding another select to this modal breaks it.
    cy.get(workflowSelector.workflowSelectInput)
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

    cy.apiDeleteWorkflow(data.childWorkflowName);
    cy.apiDeleteWorkflow(data.parentWorkflowName);
  });
});
