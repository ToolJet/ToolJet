import { fake } from "Fixtures/fake";
import { workflowsText } from "Texts/platform/workflows";
import { workflowSelector } from "Selectors/platform/workflows";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { commonText } from "Texts/common";
import { selectAppCardOption, viewAppCardOptions } from "Support/utils/common";
import { navigateBackToWorkflowsDashboard } from "Support/utils/workFlows";

Cypress.Commands.add("createWorkflowApp", (workflowName) => {
  cy.get(workflowSelector.globalWorkFlowsIcon).click();
  cy.get(workflowSelector.workflowsCreateButton).click();
  cy.get(workflowSelector.workFlowNameInputField).type(workflowName);
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
  // The Run button stays disabled until the editor finishes loading the
  // current version into its store — most visible right after an import,
  // which navigates client-side and can otherwise race the trigger request.
  cy.get(workflowSelector.workflowRunButton).should("not.be.disabled");
  cy.get(workflowSelector.workflowRunButton).click();
  cy.get(workflowSelector.workflowLogs).should(
    "have.text",
    workflowsText.workflowRunhelperText
  );
  cy.verifyResponseNodeOutput(expectedText);
});

Cypress.Commands.add("verifyResponseNodeOutput", (expectedText) => {
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

Cypress.Commands.add("deleteWorkflow", (workflowName) => {
  cy.intercept("DELETE", "/api/apps/*").as("appDeleted");
  navigateBackToWorkflowsDashboard();
  cy.get(commonSelectors.appCard(workflowName))
    .realHover()
    .find(commonSelectors.appCardOptionsButton)
    .realHover()
    .click();
  cy.get(workflowSelector.deleteWorkFlowOption).click();
  cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
  cy.wait("@appDeleted");
});

Cypress.Commands.add("deleteWorkflowfromDashboard", (workflowName) => {
  cy.intercept("DELETE", "/api/apps/*").as("appDeleted");
  cy.get(commonSelectors.appCard(workflowName))
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
  (workflowName, fixtureFile = "cypress/fixtures/exportedApp.json") => {
    navigateBackToWorkflowsDashboard();

    // Open the card menu with a real hover, the same way the dashboard specs do.
    // The previous synthetic trigger('mouseover') + force-click could leave two
    // export options in the DOM when more than one workflow card was on screen,
    // and click() refuses a subject with more than one element.
    viewAppCardOptions(workflowName);

    cy.get(commonSelectors.appCardOptions(workflowsText.exportWFOption))
      .click();

    // Export now opens a "Select a version to export" modal instead of
    // downloading immediately; the current version is pre-selected, so
    // confirming exports it.
    cy.get('[data-cy="modal-component"]').should("be.visible");
    cy.get('[data-cy="export-selected-version-button"]').click();

    cy.wait(2000);

    cy.exec("ls -t ./cypress/downloads/ | head -1").then((result) => {
      const downloadedAppExportFileName = result.stdout.trim();
      const filePath = `./cypress/downloads/${downloadedAppExportFileName}`;
      cy.readFile(filePath, { timeout: 15000 }).then((json) => {
        cy.writeFile(fixtureFile, json);
      });
    });
    
    cy.deleteWorkflowfromDashboard(workflowName);
  }
);

Cypress.Commands.add("addWorkflowInApp", (workflowName) => {
  cy.get(workflowSelector.showDSPopoverButton).click();
  // The data-source popover is a plain list, not a react-select, so there is no
  // search-then-pick step: "Run Workflow" is a top-level option with its own
  // data-cy. The previous version typed into a generated `.css-4e90k9` class
  // and clicked a react-select option, neither of which exists any more.
  cy.get(workflowSelector.workflowDataSourceOption).click();
  cy.get(workflowSelector.queryRenameInput).clear().type(workflowName);
  cy.get(workflowSelector.workflowDropdown).parent()
  .find('.react-select__control')
  .click();
  cy.get(workflowSelector.workflowSelectInput).realType(workflowName);
  cy.get(workflowSelector.workflowSelectOption).contains(workflowName).click();
});
