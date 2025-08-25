import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { workflowsText } from "Texts/workflows";
import { workflowSelector } from "Selectors/workflows";
import { deleteDatasource } from "Support/utils/dataSource";

Cypress.Commands.add("createWorkflowApp", (wfName) => {
  cy.get(workflowSelector.globalWorkFlowsIcon).click();
  cy.get(workflowSelector.workflowsCreateButton).click();
  cy.get(workflowSelector.workFlowNameInputField).type(wfName);
  cy.get(workflowSelector.createWorkFlowsButton).click();
});

Cypress.Commands.add("fillStartNodeInput", () => {
  cy.get(workflowSelector.startNode).click({ force: true });

  cy.get(workflowSelector.parametersInputField)
    .click()
    .realType("{")
    .realType('"')
    .realType("key")
    .realType('"')
    .realType(":")
    .realType('"')
    .realType("your value")
    .realType('"')
    .realType("}");

  cy.wait(500);
  cy.get("body").click(50, 50);
  cy.wait(500);
});

Cypress.Commands.add("dataSourceNode", (nodeType) => {
  cy.get(workflowSelector.startNodeHandleRight).trigger("mousedown", {
    button: 0,
    force: true,
  });

  cy.get(".react-flow__pane")
    .trigger("mousemove", {
      clientX: 600,
      clientY: 300,
      force: true,
    })
    .wait(500)
    .trigger("mouseup", { force: true });

  cy.contains(nodeType, { timeout: 5000 })
    .scrollIntoView()
    .click({ force: true });
});

Cypress.Commands.add("verifyTextInResponseOutput", (expectedText) => {
  cy.get(workflowSelector.workflowRunButton).click();
  cy.get(workflowSelector.workflowLogs).should(
    "have.text",
    "A few seconds ago"
  );

  cy.get(workflowSelector.responseNodeOutput).click();
  cy.wait(500);
  cy.get(workflowSelector.optionsColumn).contains("Output").click();

  cy.wait(500);
  cy.get("body").then(($body) => {
    if (
      $body.find("span.node-key").filter((_, el) => el.innerText === "data")
        .length
    ) {
      cy.contains("span.node-key", "data", { timeout: 3000 })
        .click({ force: true })
        .wait(300);
    }
  });

  cy.get("body").then(($body) => {
    const icons = $body.find("span.json-tree-node-icon");
    if (icons.length > 0) {
      cy.wrap(icons).each(($el) => {
        if ($el[0].style.transform === "rotate(0deg)") {
          cy.wrap($el).click({ force: true }).wait(200);
        }
      });
    }
  });

  cy.get(".json-tree-valuetype", { timeout: 3000 }).then(($vals) => {
    const texts = [...$vals].map((el) => el.innerText.trim());
    const match = texts.some((txt) => txt.includes(expectedText));
    expect(
      match,
      `Expected some value to include "${expectedText}", but got:\n\n${texts.join("\n")}`
    ).to.be.true;
  });
});

Cypress.Commands.add("connectNodeToResponse", (nodeTitle, returnStatement) => {
  cy.get(workflowSelector.nodeName(nodeTitle))
    .should("exist")
    .parents(".react-flow__node")
    .as("sourceNode");

  cy.get(workflowSelector.nodeHandleRight(nodeTitle)).trigger("mousedown", {
    button: 0,
    force: true,
  });

  cy.get(".react-flow__pane")
    .trigger("mousemove", { clientX: 800, clientY: 400, force: true })
    .trigger("mouseup", { force: true });

  cy.wait(500);

  cy.contains("Response", { timeout: 5000 }).click({ force: true });
  cy.wait(500);

  cy.get(workflowSelector.nodeName("response1"))
    .parents(".react-flow__node")
    .click({ force: true });

  cy.get('.cm-content[contenteditable="true"]')
    .clearAndTypeOnCodeMirror("")
    .clearAndTypeOnCodeMirror("")
    .clearAndTypeOnCodeMirror(returnStatement);

  cy.get("body").click(50, 50);
  cy.wait(500);
});

Cypress.Commands.add("deleteWorkflow", (wfName) => {
  cy.intercept("DELETE", "/api/apps/*").as("appDeleted");
  cy.backToWorkFlows();
  cy.get(commonSelectors.appCard(wfName))
    .realHover()
    .find(commonSelectors.appCardOptionsButton)
    .realHover()
    .click();
  cy.get(workflowSelector.deleteWorkFlowOption).click();
  cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
  cy.wait("@appDeleted");
});

Cypress.Commands.add("backToWorkFlows", () => {
  cy.get(commonSelectors.pageLogo).click();
  cy.get(commonSelectors.backToAppOption).click();
});

Cypress.Commands.add("revealWorkflowToken", (selectors) => {
  cy.get(selectors.workflowTokenField).invoke("text").then((tokenText) => {
    if (tokenText.includes("*")) {
      cy.get(selectors.workflowTokenEyeIcon).click({ force: true });
      cy.wait(300);
      cy.revealWorkflowToken(selectors); 
    }
  });
})
