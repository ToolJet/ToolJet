import { fake } from "Fixtures/fake";
import { workflowSelector } from "Selectors/platform/workflows";
import {
  buildLinearWorkflow,
  revealWorkflowToken,
} from "Support/utils/workflows/workFlows";
import { workflowsText } from "Texts/platform/workflows";

const data = {};

describe("Workflows - webhook trigger", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
  });

  it("An enabled webhook triggers the workflow and returns its result", () => {
    cy.apiCreateWorkflow(data.workflowName);
    cy.openWorkflow();

    buildLinearWorkflow({
      blockLabel: workflowsText.runjsNodeLabel,
      nodeName: workflowsText.runjs,
      inputField: workflowsText.runjsInputField,
      query: workflowsText.runjsCodeForWebhooks,
      responseReturn: workflowsText.responseNodeQuery,
    });

    cy.verifyTextInResponseOutput(workflowsText.runjsExpectedValueForWebhooks);

    cy.get(workflowSelector.workflowTriggerIcon).click();
    cy.get(workflowSelector.workflowWebhookListRow).click();
    cy.get(workflowSelector.workflowWebhookToggle).click();

    cy.get(workflowSelector.workflowEndpointUrl)
      .invoke("text")
      .then((url) => {
        // The token is masked until revealed, and the reveal needs retrying.
        revealWorkflowToken(workflowSelector);

        cy.get(workflowSelector.workflowTokenField)
          .invoke("text")
          .then((token) => {
            cy.request({
              method: "POST",
              url: url.trim(),
              headers: { Authorization: `Bearer ${token.trim()}` },
            }).then((res) => {
              expect(res.status).to.eq(workflowsText.expectedStatusCodeText);
              expect(res.body).to.eq(
                workflowsText.runjsExpectedValueForWebhooks
              );
            });
          });
      });

    cy.apiDeleteWorkflow(data.workflowName);
  });
});
