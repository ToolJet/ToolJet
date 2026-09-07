// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// ai.js
//   navigateToLlmKeyPage             llmKey.open          → licensing
//   verifyEnvToggleState             llmKey.verifyEnvToggle → licensing
//   enterAndSaveApiKey               llmKey.save          → licensing
//   verifyKeyInputDisabled           llmKey.verifyInputDisabled → licensing
//   verifyKeyInputEnabled            llmKey.verifyInputEnabled → licensing
//   verifySaveButtonDisabled         llmKey.verifySaveDisabled → licensing
//   verifyKeyMasked                  llmKey.verifyMasked  → licensing
//   verifyNoCreditUI                 aiCredits.verifyNoCreditUI → licensing
//   verifyNoAiCreditSection          aiCredits.verifySectionAbsent → licensing
//   openAiChat                       aiChat.open          → licensing
//   sendAiChatMessage                aiChat.send          → licensing
//   verifyAiChatResponse             aiChat.verifyResponse → licensing
//   ensureEnvToggleOff               llmKey.ensureEnvToggleOff → licensing
//   verifyAiChatWorksWithCredits     aiChat.verifyWithCredits → licensing
//   verifyAiChatWorksWithoutCredits  aiChat.verifyWithoutCredits → licensing
//   verifyApiKeyRequiredInApp        llmKey.verifyRequiredInApp → licensing
//   verifyCopilotInQueryPanel        copilot.verifyInQueryPanel → licensing
//   verifyFixWithAiInStyles          fixWithAi.verifyInStyles → licensing
// └──────────────────────────────────────────────────────────────────┘
import { commonSelectors } from "Selectors/common";
import { aiSelectors } from "Selectors/platform/ai";
import { aiText } from "Texts/platform/ai";


/**
 * @tjType   llmKey.open
 * @tjBlock  licensing
 * @tjUsage  navigateToLlmKeyPage()
 * @tjDom    workspace settings -> LLM key page
 */
export const navigateToLlmKeyPage = () => {
  cy.visit("/settings/llm-key");
  cy.get('[data-cy="card-title"]').should("be.visible").and('contain.text', aiText.llmKeyCardTitle);
};


/**
 * @tjType   llmKey.verifyEnvToggle
 * @tjBlock  licensing
 * @tjUsage  verifyEnvToggleState(true)
 * @tjDom    env toggle on the LLM key page
 */
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


/**
 * @tjType   llmKey.save
 * @tjBlock  licensing
 * @tjUsage  enterAndSaveApiKey('sk-...')
 * @tjDom    key input -> save
 */
export const enterAndSaveApiKey = (apiKey) => {
  cy.get(aiSelectors.llmKeyInput).click();
  cy.clearAndType(aiSelectors.llmKeyInput, apiKey);
  cy.get(aiSelectors.llmKeySaveButton).should("be.enabled").click();
};


/**
 * @tjType   llmKey.verifyInputDisabled
 * @tjBlock  licensing
 * @tjUsage  verifyKeyInputDisabled()
 * @tjDom    key input disabled state
 */
export const verifyKeyInputDisabled = () => {
  cy.get(aiSelectors.llmKeyInput).should("be.disabled");
};

/**
 * @tjType   llmKey.verifyInputEnabled
 * @tjBlock  licensing
 * @tjUsage  verifyKeyInputEnabled()
 * @tjDom    key input enabled state
 */
export const verifyKeyInputEnabled = () => {
  cy.get(aiSelectors.llmKeyInput).should("be.enabled");
};


/**
 * @tjType   llmKey.verifySaveDisabled
 * @tjBlock  licensing
 * @tjUsage  verifySaveButtonDisabled()
 * @tjDom    save button disabled state
 */
export const verifySaveButtonDisabled = () => {
  cy.get(aiSelectors.llmKeySaveButton).should("be.disabled");
};


/**
 * @tjType   llmKey.verifyMasked
 * @tjBlock  licensing
 * @tjUsage  verifyKeyMasked()
 * @tjDom    saved key rendered masked
 */
export const verifyKeyMasked = () => {
  cy.get(aiSelectors.llmKeyInput)
    .invoke("attr", "type")
    .should("eq", "password");
};


/**
 * @tjType   aiCredits.verifyNoCreditUI
 * @tjBlock  licensing
 * @tjUsage  verifyNoCreditUI()
 * @tjDom    zero-credit empty state
 */
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


/**
 * @tjType   aiCredits.verifySectionAbsent
 * @tjBlock  licensing
 * @tjUsage  verifyNoAiCreditSection()
 * @tjDom    credits section absent for the plan
 */
export const verifyNoAiCreditSection = () => {
  cy.get("body").then(($body) => {
    expect($body.find(aiSelectors.aiCreditsSubTab).length).to.eq(0);
  });
};


/**
 * @tjType   aiChat.open
 * @tjBlock  licensing
 * @tjUsage  openAiChat()
 * @tjDom    app builder -> AI chat panel
 */
export const openAiChat = () => {
  cy.get(aiSelectors.aiTabIcon, { timeout: 10000 }).first().click();
  cy.wait(500);
};


/**
 * @tjType   aiChat.send
 * @tjBlock  licensing
 * @tjUsage  sendAiChatMessage('Create a button')
 * @tjDom    chat input -> submit
 */
export const sendAiChatMessage = (message) => {
  cy.get('.cm-line', { timeout: 10000 })
    .should("be.visible")
    .type(message);
  cy.get('.tw-items-end > .tw-font-medium').click();
};


/**
 * @tjType   aiChat.verifyResponse
 * @tjBlock  licensing
 * @tjUsage  verifyAiChatResponse()
 * @tjDom    asserts a response renders
 */
export const verifyAiChatResponse = () => {
  cy.get(".message-wrapper.ai", { timeout: 30000 }).should("contain.text", "Analyzing your request...").and("be.visible");
};


/**
 * @tjType   llmKey.ensureEnvToggleOff
 * @tjBlock  licensing
 * @tjUsage  ensureEnvToggleOff()
 * @tjDom    reads state, flips off only if on
 */
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


/**
 * @tjType   aiChat.verifyWithCredits
 * @tjBlock  licensing
 * @tjUsage  verifyAiChatWorksWithCredits('MyApp')
 * @tjDom    end-to-end chat flow with credits available
 */
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


/**
 * @tjType   aiChat.verifyWithoutCredits
 * @tjBlock  licensing
 * @tjUsage  verifyAiChatWorksWithoutCredits('MyApp')
 * @tjDom    end-to-end chat flow at zero credits
 */
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


/**
 * @tjType   llmKey.verifyRequiredInApp
 * @tjBlock  licensing
 * @tjUsage  verifyApiKeyRequiredInApp('MyApp')
 * @tjDom    asserts the key-required prompt inside the editor
 */
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


/**
 * @tjType   copilot.verifyInQueryPanel
 * @tjBlock  licensing
 * @tjUsage  verifyCopilotInQueryPanel('MyApp')
 * @tjDom    query panel copilot affordance
 */
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


/**
 * @tjType   fixWithAi.verifyInStyles
 * @tjBlock  licensing
 * @tjUsage  verifyFixWithAiInStyles('MyApp')
 * @tjDom    styles panel -> Fix with AI
 */
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
