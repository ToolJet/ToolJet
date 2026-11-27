import { fake } from "Fixtures/fake";
import { aiSelectors } from "Selectors/platform/ai";
import { cloudAiSelectors } from "Selectors/platform/cloudAi";
import { aiText } from "Texts/platform/ai";
import { cloudAiText } from "Texts/platform/cloudAi";
import {
  createFreshCloudWorkspace,
  loginToWorkspace,
  navigateToLlmKeyPage,
  verifyKeyMasked,
} from "Support/utils/platform/ai";

const byokTerms = { ai: { plan: "byok" } };

const getKeySettings = (workspaceId) =>
  cy.getAuthHeaders().then((headers) =>
    cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/ai/key-settings?licenseType=byok`,
        headers: { ...headers, "Tj-Workspace-Id": workspaceId },
      })
      .its("body")
  );

describe("Cloud AI Credits — LLM Key", { retries: 0 }, () => {
  const adminEmail = `cloud-llm-${Date.now()}@tooljet.test`;
  let signupWorkspaceId;
  let workspaceId;

  before(() => {
    cy.apiCloudSignup({ email: adminEmail, name: fake.firstName }).then((signup) => {
      signupWorkspaceId = signup.workspaceId;
    });
  });

  beforeEach(() => {
    createFreshCloudWorkspace(adminEmail, signupWorkspaceId).then((id) => {
      workspaceId = id;
    });
  });

  it("should keep a saved LLM key in its own workspace", () => {
    const firstId = workspaceId;
    cy.apiSetCloudPlan("pro", { workspaceId: firstId, terms: byokTerms });
    createFreshCloudWorkspace(adminEmail, signupWorkspaceId).then((secondId) => {
      const workspaceId = firstId;
      cy.apiSetCloudPlan("pro", { workspaceId: secondId, terms: byokTerms });

      loginToWorkspace(adminEmail, workspaceId);
      cy.apiUpdateLLMKey(`sk-ant-${Date.now()}`, "byok", false, { workspaceId, provider: "anthropic" });

      getKeySettings(workspaceId).then((settings) => {
        expect(settings).to.include({ provider: "anthropic", hasKey: true, supportsEnvConfig: false });
      });

      navigateToLlmKeyPage(workspaceId);
      verifyKeyMasked();
      cy.get(aiSelectors.llmKeyEnvToggle).should("not.exist");

      loginToWorkspace(adminEmail, secondId);
      getKeySettings(secondId).then((settings) => {
        expect(settings.provider).to.equal("tooljet_managed");
      });

      cy.visit(`/${secondId}/settings/llm-key`);
      cy.location("pathname", { timeout: 60000 }).should("eq", `/${secondId}/settings/llm-key`);
      cy.contains("ToolJet managed", { timeout: 20000 }).should("be.visible");
      cy.get(aiSelectors.llmKeyInput).should("not.exist");
    });
  });

  it("should reject environment-variable LLM configuration on Cloud", () => {
    cy.apiSetCloudPlan("pro", { workspaceId, terms: byokTerms });
    cy.apiUpdateLLMKey("", "byok", true, { workspaceId, expectedStatus: 400 }).then((body) => {
      expect(body.message).to.equal(cloudAiText.envConfigUnavailable);
    });
  });

  it("should disable the LLM key menu with an upgrade tooltip on the credits AI plan", () => {
    cy.apiSetCloudPlan("pro", { workspaceId });
    cy.visit(`/${workspaceId}/settings/llm-key`);

    cy.location("pathname", { timeout: 60000 }).should("eq", `/${workspaceId}/settings/white-labelling`);
    cy.get(aiSelectors.llmKeyListItem).should("have.class", "tj-list-item-disabled");
    cy.get(aiSelectors.llmKeyListItem).parent().trigger("mouseover", { force: true });
    cy.get(cloudAiSelectors.tooltip).should("be.visible").and("contain.text", aiText.upgradeTooltip);
  });
});
