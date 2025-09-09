import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { workflowsText } from "Texts/workflows";
import { workflowSelector } from "Selectors/workflows";

export const enterJsonInputInStartNode = (jsonValue) => {
  cy.get(workflowSelector.startNode).click({ force: true });
  cy.get(workflowSelector.parametersInputField)
    .click()
    .realType("{")
    .realType('"')
    .realType(workflowsText.jsonKeyPlaceholder)
    .realType('"')
    .realType(":")
    .realType('"')
    .realType(jsonValue || workflowsText.jsonValuePlaceholder)
    .realType('"')
    .realType("}");

  cy.wait(500);
  cy.get("body").click(50, 50);
  cy.wait(500);
};

export const navigateBackToWorkflowsDashboard = () => {
  cy.get(commonSelectors.pageLogo).click();
  cy.get(commonSelectors.backToAppOption).click();
};

export const revealWorkflowToken = (selectors) => {
  cy.get(selectors.workflowTokenField)
    .invoke("text")
    .then((tokenText) => {
      if (tokenText.includes("*")) {
        cy.get(selectors.workflowTokenEyeIcon).click({ force: true });
        cy.wait(300);
        revealWorkflowToken(selectors);
      }
    });
};

export const importWorkflowApp = (
  wfName,
  fixturePath = "cypress/fixtures/exportedApp.json"
) => {
  cy.get(workflowSelector.importWorkFlowsOption).click();
  cy.get(workflowSelector.importWorkFlowsLabel).click();
  cy.get('input[type="file"]').first().selectFile(fixturePath, { force: true });
  cy.wait(2000);
  cy.get(workflowSelector.workFlowNameInputField).clear().type(wfName);
  cy.get(workflowSelector.importWorkFlowsButton).click();
};

export const deleteAppandWorkflowAfterExecution = (wfName, appName) => {
  cy.backToApps();
  cy.deleteApp(appName);
  cy.get(workflowSelector.globalWorkFlowsIcon).click();
  cy.intercept("DELETE", "/api/apps/*").as("appDeleted");
  cy.get(commonSelectors.appCard(wfName))
    .realHover()
    .find(commonSelectors.appCardOptionsButton)
    .realHover()
    .click();
  cy.get(workflowSelector.deleteWorkFlowOption).click();
  cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
  cy.wait("@appDeleted");
};

export const verifyPreviewOutputText = (expectedOutput) => {
  cy.get('[data-cy="preview-button"]').click();
  cy.wait(2000);
  cy.get('[data-cy="inspector-node-data"]')
    .parents(".json-node-element")
    .find(".json-tree-node-icon")
    .click({ force: true });

  cy.get('[data-cy="inspector-node-key"] .json-tree-valuetype', {
    timeout: 5000,
  })
    .invoke("text")
    .should("include", expectedOutput);
};

export const verifyTextInResponseOutputLimited = (expectedText, limit = 5) => {
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
      cy.wrap(icons.slice(0, limit)).each(($el) => {
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
};
