import { fake } from "Fixtures/fake";
import { workflowSelector } from "Selectors/platform/workflows";
import { workflowsText } from "Texts/platform/workflows";
import {
  buildLinearWorkflow,
  cleanupWorkflows,
} from "Support/utils/workflows/workFlows";

const data = {};

const openNodeMenu = (nodeName) => {
  cy.get(workflowSelector.nodeName(nodeName))
    .parents(".react-flow__node")
    .find(workflowSelector.nodeMenuTrigger)
    .click({ force: true });
};

const assertRunjsCode = (nodeName) => {
  cy.get(workflowSelector.nodeName(nodeName)).click({ force: true });
  cy.get(workflowSelector.inputField(workflowsText.runjsInputField)).should(
    "contain.text",
    workflowsText.runjsNodeCode
  );
};

describe("Workflows - node menu", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    cy.apiCreateWorkflow(data.workflowName);
    cy.window().then((win) =>
      win.localStorage.setItem(
        `tj_workflow_canvas_locked_${Cypress.env("workflowId")}`,
        "false"
      )
    );
    cy.openWorkflow();

    buildLinearWorkflow({
      blockLabel: workflowsText.runjsNodeLabel,
      nodeName: workflowsText.runjs,
      inputField: workflowsText.runjsInputField,
      query: workflowsText.runjsNodeCode,
      responseReturn: workflowsText.responseNodeQuery,
    });
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
  });

  it("Duplicating a RunJS node copies its code, leaves the original unchanged and the workflow still runs", () => {
    openNodeMenu(workflowsText.runjs);
    cy.get(workflowSelector.nodeMenuDuplicate).click({ force: true });

    cy.get(workflowSelector.nodeName(workflowsText.duplicatedRunjsNodeName), {
      timeout: 10000,
    }).should("exist");

    assertRunjsCode(workflowsText.duplicatedRunjsNodeName);
    assertRunjsCode(workflowsText.runjs);

    cy.verifyTextInResponseOutput(workflowsText.responseNodeExpectedValueText);
  });

  it("Deleting a node from its menu asks for confirmation, keeps it on cancel and removes it with its edges on confirm", () => {
    let edgesBefore;
    cy.get(workflowSelector.canvasEdge).then(($edges) => {
      edgesBefore = $edges.length;
    });

    openNodeMenu(workflowsText.runjs);
    cy.get(workflowSelector.nodeMenuDelete).click({ force: true });
    cy.get(workflowSelector.nodeDeleteMessage)
      .should("be.visible")
      .and("contain.text", workflowsText.nodeDeleteConfirmMessage);

    cy.get(workflowSelector.nodeDeleteCancel).click();
    cy.get(workflowSelector.nodeDeleteMessage).should("not.exist");
    cy.get(workflowSelector.nodeName(workflowsText.runjs)).should("exist");
    cy.get(workflowSelector.canvasEdge).should(($edges) => {
      expect($edges.length).to.equal(edgesBefore);
    });

    openNodeMenu(workflowsText.runjs);
    cy.get(workflowSelector.nodeMenuDelete).click({ force: true });
    cy.get(workflowSelector.nodeDeleteConfirm).click();
    cy.get(workflowSelector.nodeName(workflowsText.runjs)).should("not.exist");
    cy.get("body").should(($body) => {
      expect($body.find(workflowSelector.canvasEdge).length).to.be.lessThan(
        edgesBefore
      );
    });
  });
});
