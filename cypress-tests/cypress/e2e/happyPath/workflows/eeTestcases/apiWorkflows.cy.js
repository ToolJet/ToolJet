import { fake } from "Fixtures/fake";
const data = {};

describe("Workflows with API", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

it("Create workflow ,connect nodes and exectue with API", () => {
    cy.apiCreateWorkflowWithNodes(data.workflowName)
    cy.openWorkflow();
    cy.apiExecuteWorkflowAndValidate("your value");
    cy.apiDeleteWorkflow(data.workflowName);
  });
});