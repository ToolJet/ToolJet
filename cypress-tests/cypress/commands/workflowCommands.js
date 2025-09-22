import { fake } from "Fixtures/fake";
import { workflowsText } from "Texts/workflows";
import { workflowSelector } from "Selectors/workflows";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { commonText } from "Texts/common";
import { selectAppCardOption } from "Support/utils/common";
import { navigateBackToWorkflowsDashboard } from "Support/utils/workFlows";

Cypress.Commands.add("createWorkflowApp", (wfName) => {
  cy.get(workflowSelector.globalWorkFlowsIcon).click();
  cy.get(workflowSelector.workflowsCreateButton).click();
  cy.get(workflowSelector.workFlowNameInputField).type(wfName);
  cy.get(workflowSelector.createWorkFlowsButton).click();
});

Cypress.Commands.add("connectDataSourceNode", (nodeType) => {
  cy.get(workflowSelector.startNodeHandleRight).trigger("mousedown", {
    button: 0,
    force: true,
  });

  cy.get(".react-flow__pane")
    .trigger("mousemove", { clientX: 600, clientY: 300, force: true })
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
    workflowsText.workflowRunhelperText
  );

  cy.get('[data-cy="response1-node-name"]').click();
  cy.wait(500);
  cy.get('[data-cy="tab-output"]').click();

  cy.wait(500);
  cy.get("body").then(($body) => {
    if (
      $body
        .find("span.node-key")
        .filter((_, el) => el.innerText === workflowsText.responseNodeKey)
        .length
    ) {
      cy.contains("span.node-key", workflowsText.responseNodeKey, {
        timeout: 3000,
      })
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

Cypress.Commands.add(
  "connectNodeToResponseNode",
  (nodeTitle, returnStatement) => {
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

    cy.contains(workflowsText.responseNodeLabel, { timeout: 5000 }).click({
      force: true,
    });
    cy.wait(500);

    cy.get(workflowSelector.nodeName(workflowsText.responseNodeName))
      .parents(".react-flow__node")
      .click({ force: true });

    cy.get('.cm-content[contenteditable="true"]')
      .clearAndTypeOnCodeMirror("")
      .clearAndTypeOnCodeMirror("")
      .clearAndTypeOnCodeMirror(returnStatement);

    cy.get("body").click(50, 50);
    cy.wait(500);
  }
);

Cypress.Commands.add("deleteWorkflow", (wfName) => {
  cy.intercept("DELETE", "/api/apps/*").as("appDeleted");
  navigateBackToWorkflowsDashboard();
  cy.get(commonSelectors.appCard(wfName))
    .realHover()
    .find(commonSelectors.appCardOptionsButton)
    .realHover()
    .click();
  cy.get(workflowSelector.deleteWorkFlowOption).click();
  cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
  cy.wait("@appDeleted");
});

Cypress.Commands.add("deleteWorkflowfromDashboard", (wfName) => {
  cy.intercept("DELETE", "/api/apps/*").as("appDeleted");
  cy.get(commonSelectors.appCard(wfName))
    .realHover()
    .find(commonSelectors.appCardOptionsButton)
    .realHover()
    .click();
  cy.get(workflowSelector.deleteWorkFlowOption).click();
  cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
  cy.wait("@appDeleted");
});

Cypress.Commands.add(
  "exportWorkflowApp",
  (wfName, fixtureFile = "cypress/fixtures/exportedApp.json") => {
    navigateBackToWorkflowsDashboard();

    selectAppCardOption(
      wfName,
      commonSelectors.appCardOptions(workflowsText.exportWFOption)
    );
    cy.wait(2000);

    cy.exec("ls -t ./cypress/downloads/ | head -1").then((result) => {
      const downloadedAppExportFileName = result.stdout.trim();
      const filePath = `./cypress/downloads/${downloadedAppExportFileName}`;
      cy.readFile(filePath, { timeout: 15000 }).then((json) => {
        cy.writeFile(fixtureFile, json);
      });
    });
    cy.deleteWorkflowfromDashboard(wfName);
  }
);

Cypress.Commands.add("addWorkflowInApp", (wfName) => {
  cy.get(workflowSelector.showDSPopoverButton).click();
  cy.get(workflowSelector.workflowSearchInput).type(
    workflowsText.workflowLabel
  );
  cy.contains(`[id*="react-select-"]`, workflowsText.workflowLabel).click();
  cy.get(workflowSelector.queryRenameInput).clear().type(wfName);
  cy.get(workflowSelector.workflowDropdown).parent()
  .find('.react-select__control')
  .click();
  cy.get(workflowSelector.workflowSelectInput).realType(wfName);
  cy.get(workflowSelector.workflowSelectOption).contains(wfName).click();
});
