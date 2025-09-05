import { fake } from "Fixtures/fake";
import { workflowsText } from "Texts/workflows";
import { workflowSelector } from "Selectors/workflows";

import {
  connectDataSourceNode,
  verifyTextInResponseOutput,
  connectNodeToResponseNode,
  createWorkflowApp,
  fillStartNodeJsonInput,
  deleteWorkflow,
  revealWorkflowToken,
} from "Support/utils/workFlows";

const data = {};

describe("Workflows with Webhooks", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.wfName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Creating workflows with runjs, triggering via webhook, and validating execution", () => {
    createWorkflowApp(data.wfName);
    fillStartNodeJsonInput();
    connectDataSourceNode(workflowsText.runjsNode);

    cy.get(workflowSelector.nodeName(workflowsText.runjs)).click({ force: true });

    cy.get(workflowSelector.inputField(workflowsText.runjsInputField))
      .click({ force: true })
      .realType(workflowsText.runjsCodeForWebhooks, { delay: 50 });

    cy.get("body").click(50, 50);
    cy.wait(500);

    connectNodeToResponseNode(workflowsText.runjs, workflowsText.runjsResponse);
    verifyTextInResponseOutput(workflowsText.runjsExpectedValueForWebhooks);

    cy.get(workflowSelector.workflowTriggerIcon).click();
    cy.get(workflowSelector.workflowWebhookListRow).click();
    cy.get(workflowSelector.workflowWebhookToggle).click();

    cy.get(workflowSelector.workflowEndpointUrl)
      .invoke("text")
      .then((url) => {
        revealWorkflowToken(workflowSelector);
        cy.get(workflowSelector.workflowTokenField)
          .invoke("text")
          .then((token) => {
            cy.request({
              method: "POST",
              url: url.trim(),
              headers: { Authorization: `Bearer ${token.trim()}` },
            }).then((res) => {
              expect(res.status).to.eq(workflowsText.expectedStatus);
              expect(res.body).to.eq(workflowsText.runjsExpectedValueForWebhooks);
            });
          });
      });
    deleteWorkflow(data.wfName);
  });
});
