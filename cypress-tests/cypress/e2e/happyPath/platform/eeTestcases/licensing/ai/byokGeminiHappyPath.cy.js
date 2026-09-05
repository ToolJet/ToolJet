import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { aiSelectors } from "Selectors/platform/ai";
import { switchTabs } from "Support/utils/license";
import {
  ensureEnvToggleOff,
  enterAndSaveApiKey,
  navigateToLlmKeyPage,
  selectProvider,
  verifyAiChatWorksWithoutCredits,
  verifyApiKeyRequiredInApp,
  verifyCopilotInQueryPanel,
  verifyEnvToggleState,
  verifyFixWithAiInStyles,
  verifyKeyInputDisabled,
  verifyKeyInputEnabled,
  verifyKeyMasked,
  verifyNoAiCreditSection,
  verifySaveButtonDisabled,
} from "Support/utils/platform/ai";
import { licenseText } from "Texts/license";
import { aiText } from "Texts/platform/ai";

const validGeminiKey = Cypress.env("gemini_api_key");

// Valid JSON structure with wrong credentials — passes client-side validation, fails server-side
const invalidGeminiCredentials = JSON.stringify({
  type: "service_account",
  project_id: "invalid-project-123",
  private_key:
    "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0Z3VS5JJcds3xHn/ygWep4PKinvalid==\n-----END RSA PRIVATE KEY-----",
  client_email: "invalid@invalid-project-123.iam.gserviceaccount.com",
});

// Malformed JSON — fails client-side validation
const malformedGeminiJson = JSON.stringify({
  type: "service_account",
  project_id: "test-project",
  // missing private_key and client_email
});

const licenseTypes = [
  { type: "byok", label: "BYOK Plan" },
  { type: "selfhostai", label: "Self-Hosted AI Plan" },
];

licenseTypes.forEach(({ type, label }) => {
  describe(`Gemini Provider — ${label} - Happy Path`, () => {
    const data = {};

    beforeEach(() => {
      data.appName = `${fake.companyName}-Gemini-${label}-Test`;
      cy.apiLogin();
      cy.apiUpdateLicense(type);
      cy.apiUpdateLLMKey("", type, true);
      navigateToLlmKeyPage();
      selectProvider("gemini");
      cy.wait(2000);
    });

    it("Should verify AI features work with Gemini env-configured key (Toggle ON)", () => {
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

    it("Should show API key required prompt when no Gemini key is configured (Toggle OFF — Empty Key)", () => {
      ensureEnvToggleOff();
      cy.get(aiSelectors.llmKeyInput).clear({ force: true });
      verifySaveButtonDisabled();

      verifyApiKeyRequiredInApp(data.appName, {
        message: aiText.geminiKeyRequiredMessage,
        buttonText: aiText.geminiConnectButton,
      });
      cy.contains(aiText.geminiConnectButton, { timeout: 10000 })
        .should("be.visible")
        .click();
      cy.wait(2000);
      // The button uses React Router navigate('/settings/llm-key') which navigates
      // within the SPA context; navigate explicitly to verify the LLM key page loads.
      navigateToLlmKeyPage();
      cy.apiDeleteApp();
      cy.wait(2000);
      verifyCopilotInQueryPanel(data.appName, aiText.geminiMissingCopilotError);
      verifyFixWithAiInStyles(data.appName, {
        message: aiText.geminiKeyRequiredMessage,
        buttonText: aiText.geminiConnectButton,
      });
    });

    it("Should reject malformed Gemini JSON with inline validation error (Toggle OFF — Invalid Format)", () => {
      ensureEnvToggleOff();
      verifyKeyInputEnabled();
      cy.get(aiSelectors.llmKeyInput).click({ force: true });
      // Use native setter to avoid Cypress parsing { } as special key sequences in JSON
      cy.get(aiSelectors.llmKeyInput).then(($el) => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        ).set;
        nativeInputValueSetter.call($el[0], malformedGeminiJson);
        $el[0].dispatchEvent(new Event("input", { bubbles: true }));
        $el[0].dispatchEvent(new Event("change", { bubbles: true }));
      });
      cy.get(aiSelectors.llmKeySaveButton).click();
      // Client-side validation fires and shows an inline error below the input.
      // The button stays enabled (the user can retry after fixing the JSON).
      cy.contains("Invalid credentials", { timeout: 10000 }).should("be.visible");
    });

    it("Should show error when invalid Gemini credentials are saved (Toggle OFF — Invalid Credentials)", () => {
      ensureEnvToggleOff();
      verifyKeyInputEnabled();
      enterAndSaveApiKey(invalidGeminiCredentials);

      verifyApiKeyRequiredInApp(data.appName, {
        message: aiText.geminiInvalidKeyMessage,
        buttonText: aiText.geminiChangeKeyButton,
      });
      cy.contains(aiText.geminiChangeKeyButton, { timeout: 10000 })
        .should("be.visible")
        .click();
      cy.wait(2000);
      // Navigate explicitly — React Router navigate() within the app builder may not
      // update Cypress's tracked URL, so we confirm by visiting the page directly.
      navigateToLlmKeyPage();
      cy.apiDeleteApp();
      cy.wait(2000);
      verifyCopilotInQueryPanel(data.appName, aiText.geminiInvalidCopilotError);
      verifyFixWithAiInStyles(data.appName, {
        message: aiText.geminiInvalidKeyMessage,
        buttonText: aiText.geminiChangeKeyButton,
      });
    });

    it("Should save valid Gemini credentials and verify AI features work (Toggle OFF — Valid Key)", () => {
      ensureEnvToggleOff();
      verifyKeyInputEnabled();
      enterAndSaveApiKey(validGeminiKey);
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
    });
  });
});
