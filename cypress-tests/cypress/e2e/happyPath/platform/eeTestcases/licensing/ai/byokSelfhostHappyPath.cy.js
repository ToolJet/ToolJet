import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { aiSelectors } from "Selectors/platform/ai";
import { switchTabs } from "Support/utils/license";
import {
  ensureEnvToggleOff,
  enterAndSaveApiKey,
  navigateToLlmKeyPage,
  verifyAiChatWorksWithoutCredits,
  verifyApiKeyRequiredInApp,
  verifyCopilotInQueryPanel,
  verifyEnvToggleState,
  verifyFixWithAiInStyles,
  verifyKeyInputDisabled,
  verifyKeyInputEnabled,
  verifyKeyMasked,
  verifyNoAiCreditSection,
  verifySaveButtonDisabled
} from "Support/utils/platform/ai";
import { licenseText } from "Texts/license";
import { aiText } from "Texts/platform/ai";

const validApiKey = Cypress.env("anthropic_api_key");
const invalidApiKey = "sk-ant-invalid-key-12345";

const licenseTypes = [
  { type: "byok", label: "BYOK Plan" },
  { type: "selfhostai", label: "Self-Hosted AI Plan" },
];

licenseTypes.forEach(({ type, label }) => {
  describe(`${label} - Happy Path`, () => {
    const data = {};

    beforeEach(() => {
      data.appName = `${fake.companyName}-${label}-Test`;
      cy.apiLogin();
      cy.apiUpdateLicense(type);
      cy.apiUpdateLLMKey("", type, true);
      navigateToLlmKeyPage();
      cy.wait(2000);
    });

    it("Should verify AI features work with env-configured key (Toggle ON)", () => {
      cy.get(aiSelectors.cardTitle)
        .should("be.visible")
        .and("contain.text", aiText.llmKeyCardTitle);
      verifyEnvToggleState(true);
      verifyKeyInputDisabled();
      verifySaveButtonDisabled();
      verifyAiChatWorksWithoutCredits(data.appName, "Create a table component");
      cy.wait(3000);
      verifyCopilotInQueryPanel(data.appName);
    });

    it("Should show API key required prompt when no key is configured (Toggle OFF — Empty Key)", () => {
      ensureEnvToggleOff();
      cy.get(aiSelectors.llmKeyInput).clear({ force: true });
      verifySaveButtonDisabled();

      verifyApiKeyRequiredInApp(data.appName);
      cy.contains(aiText.connectApiKeyButton, { timeout: 10000 })
        .should("be.visible")
        .click();
      cy.wait(2000);
      cy.url().should("include", "llm-key");
      cy.apiDeleteApp();
      cy.wait(2000);
      verifyCopilotInQueryPanel(
        data.appName,
        "ANTHROPIC_API_KEY is not configured.",
      );
      verifyFixWithAiInStyles(data.appName, {
        message: aiText.apiKeyRequiredMessage,
        buttonText: aiText.connectApiKeyButton,
      });
    });

    it("Should show error when an invalid API key is saved (Toggle OFF — Invalid Key)", () => {
      ensureEnvToggleOff();
      verifyKeyInputEnabled();
      enterAndSaveApiKey(invalidApiKey);

      verifyApiKeyRequiredInApp(data.appName, {
        message:
          "The Anthropic API key added is invalid please update your api key",
        buttonText: "Change your API key",
      });
      cy.contains("Change your API key", { timeout: 10000 })
        .should("be.visible")
        .click();
      cy.wait(2000);
      cy.url().should("include", "llm-key");
      cy.apiDeleteApp();
      cy.wait(2000);
      verifyCopilotInQueryPanel(
        data.appName,
        "Invalid ANTHROPIC_API_KEY provided, please check your credentials.",
      );
      verifyFixWithAiInStyles(data.appName, {
        message:
          "The Anthropic API key added is invalid please update your api key",
        buttonText: "Change your API key",
      });
    });

    it("Should save a valid API key and verify AI features work (Toggle OFF — Valid Key)", () => {
      ensureEnvToggleOff();
      verifyKeyInputEnabled();
      enterAndSaveApiKey(validApiKey);
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        aiText.llmKeySaveSuccess,
      );
      verifyKeyMasked();
      cy.contains("License").click();
      switchTabs(licenseText.limitsTabTitle);
      verifyNoAiCreditSection();
      verifyAiChatWorksWithoutCredits(
        data.appName,
        "Add a text input component",
      );
      cy.wait(3000);
      verifyCopilotInQueryPanel(data.appName);
      verifyFixWithAiInStyles(data.appName);

      cy.get(aiSelectors.aiTabIcon, { timeout: 10000 }).first().click();
      type === "byok"
        ? cy.get(".tw-px-2").should("have.text", "Generate mode")
        : cy.get(".tw-px-2").should("not.exist");
    });
  });
});
