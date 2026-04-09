import { commonSelectors } from "Selectors/common";
import { aiSelectors } from "Selectors/platform/ai";
import { aiText } from "Texts/platform/ai";


export const navigateToLlmKeyPage = () => {
  cy.visit("/settings/llm-key");
  cy.get('[data-cy="card-title"]').should("be.visible").and('contain.text', aiText.llmKeyCardTitle);
};


export const verifyEnvToggleState = (expectedOn) => {
  if (expectedOn) {
    cy.get(aiSelectors.llmKeyEnvToggle)
      .find("input")
      .should("be.checked");
  } else {
    cy.get(aiSelectors.llmKeyEnvToggle)
      .find("input")
      .should("not.be.checked");
  }
};


export const enterAndSaveApiKey = (apiKey) => {
  cy.get(aiSelectors.llmKeyInput).click();
  cy.clearAndType(aiSelectors.llmKeyInput, apiKey);
  cy.get(aiSelectors.llmKeySaveButton).should("be.enabled").click();
};


export const verifyKeyInputDisabled = () => {
  cy.get(aiSelectors.llmKeyInput).should("be.disabled");
};

export const verifyKeyInputEnabled = () => {
  cy.get(aiSelectors.llmKeyInput).should("be.enabled");
};


export const verifySaveButtonDisabled = () => {
  cy.get(aiSelectors.llmKeySaveButton).should("be.disabled");
};


export const verifyKeyMasked = () => {
  cy.get(aiSelectors.llmKeyInput)
    .invoke("attr", "type")
    .should("eq", "password");
};


export const verifyNoCreditUI = () => {
  cy.get("body").then(($body) => {
    if ($body.find(".credits-button-popup").length > 0) {
      cy.get(".credits-button-popup").should("not.be.visible");
    }
    if ($body.find(".credit-limit-message").length > 0) {
      cy.get(".credit-limit-message").should("not.be.visible");
    }
  });
};


export const verifyNoAiCreditSection = () => {
  cy.get("body").then(($body) => {
    expect($body.find(aiSelectors.aiCreditsSubTab).length).to.eq(0);
  });
};


export const openAiChat = () => {
  cy.get(aiSelectors.aiTabIcon, { timeout: 10000 }).first().click();
  cy.wait(500);
};


export const sendAiChatMessage = (message) => {
  cy.get('.cm-line', { timeout: 10000 })
    .should("be.visible")
    .type(message);
  cy.get('.tw-items-end > .tw-font-medium').click();
};


export const verifyAiChatResponse = () => {
  cy.get(".message-wrapper.ai", { timeout: 30000 }).should("contain.text", "Analyzing your request...").and("be.visible");
};


export const ensureEnvToggleOff = () => {
  cy.get(aiSelectors.llmKeyEnvToggle).then(($toggle) => {
    if ($toggle.find("input").is(":checked")) {
      cy.get(aiSelectors.llmKeyEnvToggle).click({ force: true });
      cy.wait(1000);
      cy.get("body").then(($body) => {
        if ($body.find('[data-cy="confirm-button"]').length > 0) {
          cy.get('[data-cy="confirm-button"]').click();
        } else if ($body.find('[data-cy="continue-button"]').length > 0) {
          cy.get('[data-cy="continue-button"]').click();
        } else if ($body.find("button").filter(":contains('Continue')").length > 0) {
          cy.contains("button", "Continue").click();
        } else if ($body.find("button").filter(":contains('Confirm')").length > 0) {
          cy.contains("button", "Confirm").click();
        }
      });
      cy.get(aiSelectors.llmKeyInput).should("not.be.disabled", { timeout: 15000 });
    }
  });
};


export const verifyAiChatWorksWithCredits = (appName) => {
  cy.apiCreateApp(appName);
  cy.openApp(appName);
  cy.wait(3000);
  openAiChat();
  sendAiChatMessage("Create a simple hello world button");
  verifyAiChatResponse();
  cy.get(':nth-child(3) > .tw-font-medium').click();
  cy.get("body").then(($body) => {
    const hasCreditUI =
      $body.find(".credits-button-popup").length > 0 ||
      $body.text().includes("credits") ||
      $body.text().includes("Credits");
    expect(hasCreditUI).to.be.true;
  });
  cy.apiDeleteApp();
};


export const verifyAiChatWorksWithoutCredits = (appName, message = "Create a simple hello world button", type) => {
  cy.apiCreateApp(appName);
  cy.openApp(appName);
  cy.wait(3000);
  openAiChat();
  sendAiChatMessage(message);
  verifyAiChatResponse();
  verifyNoCreditUI();
  cy.apiDeleteApp();
};


export const verifyApiKeyRequiredInApp = (appName, options = {}) => {
  const message = options.message || aiText.apiKeyRequiredMessage;
  const buttonText = options.buttonText || aiText.connectApiKeyButton;
  cy.apiCreateApp(appName);
  cy.openApp(appName);
  cy.wait(3000);
  openAiChat();
  sendAiChatMessage("Create a simple hello world button");
  cy.contains(message, { timeout: 10000 }).should("be.visible");
  cy.contains(buttonText).should("be.visible");
  cy.contains(aiText.learnMoreButton).should("be.visible");
};


export const verifyCopilotInQueryPanel = (appName, errorMessage = "") => {
  cy.apiCreateApp(appName);
  cy.openApp(appName);
  cy.wait(3000);
  cy.get(aiSelectors.showDsPopoverButton, { timeout: 10000 }).click();
  cy.get('[data-cy="ds-sample data source"]').click();
  cy.hideTooltip();
  cy.get('.codehinter-copilot-btn').click();
  cy.get('.tooltip').invoke('css', 'display', 'none');
  cy.get('#prompt-input').click({ force: true });
  cy.get('#prompt-input').type('get all users');
  cy.get('.submit').click();
  if (errorMessage == "") {
    cy.get('.content').contains('SELECT');
  }
  else {
    cy.verifyToastMessage(commonSelectors.toastMessage, errorMessage);
  }

  cy.apiDeleteApp();
};


export const verifyFixWithAiInStyles = (appName, options = {}) => {
  cy.apiCreateApp(appName);
  cy.openApp(appName);
  cy.wait(3000);
  cy.dragAndDropWidget("Button", 200, 200);
  cy.get('[data-cy="button1-label"]').click();
  cy.wait(500);
  cy.get(':nth-child(2) > .nav-link').click();
  cy.get('[data-cy="background-fx-button"]').click();
  cy.get('[data-cy="background-input-field"] > .check-here > .cm-theme > .cm-editor > .cm-scroller > .cm-content').clear();
  cy.get('[data-cy="background-input-field"] > .check-here > .cm-theme > .cm-editor > .cm-scroller > .cm-content').clearAndTypeOnCodeMirror('{{}}');
  cy.get('[data-cy="alert-info-text"] button').contains('Auto-fix').click();

  if (options.message) {
    cy.contains(options.message, { timeout: 10000 }).should("be.visible");
    cy.contains(options.buttonText || aiText.connectApiKeyButton).should("be.visible");
    cy.contains(aiText.learnMoreButton).should("be.visible");
  } else {
    cy.get('.tw-text-text-default.tw-mb-2').should("contain.text", "backgroundColor");
  }
  cy.apiDeleteApp();
};
