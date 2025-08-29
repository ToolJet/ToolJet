import { fake } from "Fixtures/fake";
import { workflowsText } from "Texts/workflows";
import { workflowSelector } from "Selectors/workflows";
import {
  dataSourceNode,
  verifyTextInResponseOutput,
  connectNodeToResponse,
  createWorkflowApp,
  fillStartNodeInput,
  deleteWorkflow,
  revealWorkflowToken,
} from "Support/utils/workFlows";

const data = {};

describe("Workflows with Datasource", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.wfName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Creating workflows with runjs, triggering via webhook, and validating execution", () => {

    cy.createWorkflowApp(data.wfName);
    cy.fillStartNodeInput();
    cy.dataSourceNode("Run JavaScript code");

    cy.get(workflowSelector.nodeName(workflowsText.runjs)).click({ force: true });
    cy.get(workflowSelector.inputField(workflowsText.runjsInputField))
      .click({ force: true })
      .realType('return "Verifying webbhooks response"', { delay: 50 });

    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponse(workflowsText.runjs, "return runjs1.data");
    cy.verifyTextInResponseOutput("Verifying webbhooks response");

    cy.get(workflowSelector.workflowTriggerIcon).click();
    cy.get(workflowSelector.workflowWebhookListRow).click();
    cy.get(workflowSelector.workflowWebhookToggle).click();

    cy.get(workflowSelector.workflowEndpointUrl)
      .invoke("text")
      .then((url) => {
        cy.revealWorkflowToken(workflowSelector);
        cy.get(workflowSelector.workflowTokenField)
          .invoke("text")
          .then((token) => {
            cy.request({
              method: "POST",
              url: url.trim(),
              headers: { Authorization: `Bearer ${token.trim()}` },
            }).then((res) => {
              expect(res.status).to.eq(201);
              expect(res.body).to.eq("Verifying webbhooks response");
            });
          });
      });
    cy.deleteWorkflow(data.wfName);
  });
});