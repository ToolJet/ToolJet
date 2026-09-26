import { fake } from "Fixtures/fake";
import { workflowsText } from "Texts/platform/workflows";
import { workflowSelector } from "Selectors/platform/workflows";
import {
  buildLinearWorkflow,
  revealWorkflowToken,
} from "Support/utils/workFlows";

// A webhook is a public entry point into a workflow. This case drives it for
// real — it enables the webhook in the UI, reads back the endpoint and token,
// then fires an actual HTTP request from outside the app.
//
// Only the happy path is covered. The disabled state and a bad/revoked token
// are both untested.
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

    // Confirm the workflow works when run from the editor before trusting the
    // webhook path — otherwise a webhook failure is ambiguous.
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
