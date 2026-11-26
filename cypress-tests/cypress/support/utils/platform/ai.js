import { commonSelectors } from "Selectors/common";
import { aiSelectors } from "Selectors/platform/ai";
import { aiText } from "Texts/platform/ai";


export const selectProvider = (provider) => {
  const labels = {
    tooljet_managed: "ToolJet managed",
    anthropic: "Anthropic",
    gemini: "Google Gemini",
  };

  // If the env toggle is ON, the provider dropdown is disabled (cursor: not-allowed).
  // Turn the toggle off first to enable the dropdown, select the provider, then
  // re-enable the toggle to restore the env-config state the API call configured.
  cy.get(aiSelectors.llmKeyEnvToggle).then(($toggle) => {
    const isOn = $toggle.find("input").is(":checked");

    if (isOn) {
      // Disable env toggle (opens a confirmation dialog)
      cy.get(aiSelectors.llmKeyEnvToggle).click({ force: true });
      // Wait for the modal dialog to appear and click Continue
      cy.get(".modal.show", { timeout: 5000 })
        .should("be.visible")
        .contains("button", "Continue")
        .click();
      // Wait for env toggle to be unchecked (dropdown now interactive)
      cy.get(aiSelectors.llmKeyEnvToggle).find("input").should("not.be.checked");
      cy.wait(500);
    }

    // When toggle is OFF, [data-cy="llm-provider"] is a wrapper div containing a
    // React Select — click the inner .react-select__control to open the dropdown.
    // When toggle is ON, [data-cy="llm-provider"] is the static disabled div (no need to click).
    cy.get(aiSelectors.llmProviderDropdown).then(($el) => {
      const control = $el.find('.react-select__control');
      if (control.length > 0) {
        cy.wrap(control).click();
      } else {
        cy.wrap($el).click();
      }
    });
    cy.contains(labels[provider]).click({ force: true });
    // Wait for the provider selection to settle and any dropdown overlay to close
    cy.wait(500);

    if (isOn) {
      // Re-enable env toggle to restore the original state (also opens a confirmation dialog)
      cy.get(aiSelectors.llmKeyEnvToggle).find("input").click({ force: true });
      cy.get(".modal.show", { timeout: 5000 })
        .should("be.visible")
        .contains("button", "Continue")
        .click();
      cy.get(aiSelectors.llmKeyEnvToggle).find("input").should("be.checked");
    }
  });
};

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
  cy.get(aiSelectors.llmKeyInput).click({ force: true });
  // Use invoke to set value directly to avoid Cypress parsing { } as special key sequences in JSON
  cy.get(aiSelectors.llmKeyInput)
    .invoke("val", "")
    .then(($el) => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      ).set;
      nativeInputValueSetter.call($el[0], apiKey);
      $el[0].dispatchEvent(new Event("input", { bubbles: true }));
      $el[0].dispatchEvent(new Event("change", { bubbles: true }));
    });
  cy.get(aiSelectors.llmKeySaveButton).should("be.enabled").click();
};


export const verifyKeyInputDisabled = () => {
  // llm-key-input is a <div> wrapper, not an <input>. When the env toggle is ON
  // the div gets cursor:not-allowed — check CSS instead of the disabled attribute.
  cy.get(aiSelectors.llmKeyInput).should("have.css", "cursor", "not-allowed");
};

export const verifyKeyInputEnabled = () => {
  // When toggle is OFF, [data-cy="llm-key-input"] renders as an <input> directly.
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
  cy.get('.tw-items-end .tw-bg-button-primary').click();
};


export const verifyAiChatResponse = () => {
  // Gemini sometimes skips "Analyzing your request..." and goes directly to
  // "Updating your app... Thinking..." — accept any AI processing indicator.
  cy.get(".message-wrapper.ai", { timeout: 30000 })
    .should("be.visible")
    .and(($el) => {
      const text = $el.text();
      expect(
        text.includes("Analyzing your request...") ||
        text.includes("Updating your app") ||
        text.includes("Thinking")
      ).to.be.true;
    });
};


export const ensureEnvToggleOff = () => {
  cy.get(aiSelectors.llmKeyEnvToggle).then(($toggle) => {
    if ($toggle.find("input").is(":checked")) {
      cy.get(aiSelectors.llmKeyEnvToggle).click({ force: true });
      cy.get(".modal.show", { timeout: 5000 })
        .should("be.visible")
        .contains("button", "Continue")
        .click();
      // llm-key-input is a div wrapper — wait until it loses the not-allowed cursor,
      // which signals the env toggle is truly off and the inner input is editable.
      cy.get(aiSelectors.llmKeyInput).should("not.have.css", "cursor", "not-allowed");
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
  // Use the DataSourcePicker landing page card — always present for a fresh app from local constants, no API dependency.
  cy.get('[data-cy="runjs-add-query-card"]', { timeout: 10000 }).click();
  cy.get('.codehinter-copilot-btn', { timeout: 10000 }).click();
  cy.get('.tooltip').invoke('css', 'display', 'none');
  cy.get('#prompt-input').click({ force: true });
  cy.get('#prompt-input').type('write a function that returns a greeting');
  cy.get('.submit').click();
  if (errorMessage == "") {
    cy.get('.content', { timeout: 15000 }).should('be.visible');
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
