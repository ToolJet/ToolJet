// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// smtp.js
//   openSMTPSettings                 smtpSettings.open    → superAdmin
//   verifyLabel                      -                    → common
//   verifyInputPlaceholder           -                    → common
//   verifySmtpSettingsUI             smtpSettings.verifyUI → superAdmin
// └──────────────────────────────────────────────────────────────────┘
import {
    smtpSelectors,
    whiteLabelSelectors
} from "Selectors/platform/superAdminSelectors";

import {
    SMTP_TEXT,
    whitelabelText,
} from "Texts/platform/superAdminText";

import {
    openInstanceSettings,
} from "Support/utils/platform/eeCommon";

/**
 * @tjType   smtpSettings.open
 * @tjBlock  superAdmin
 * @tjUsage  openSMTPSettings()
 * @tjDom    instance settings -> SMTP list item
 */
export const openSMTPSettings = () => {
    openInstanceSettings();
    cy.get(smtpSelectors.smtpListItem).click();
};

/**
 * @tjType   -
 * @tjBlock  common
 * @tjUsage  verifyLabel('Host')
 * @tjDom    asserts a <label> with the given text is visible
 */
export const verifyLabel = (text) => cy.contains("label", text).should("be.visible");

/**
 * @tjType   -
 * @tjBlock  common
 * @tjUsage  verifyInputPlaceholder(smtpSelectors.smtpHostInput, 'smtp.example.com')
 * @tjDom    asserts an input's placeholder contains the expected text (case-insensitive)
 */
export const verifyInputPlaceholder = (selector, expected) => {
    cy.get(selector).should("be.visible").and("have.attr", "placeholder")
        .and(($p) => expect(($p || "").toString().toLowerCase()).to.contain(expected));
};

/**
 * @tjType   smtpSettings.verifyUI
 * @tjBlock  superAdmin
 * @tjUsage  verifySmtpSettingsUI()
 * @tjDom    enables SMTP if disabled, then asserts every label, placeholder and button
 */
export const verifySmtpSettingsUI = () => {
    cy.get(smtpSelectors.smtpStatuslabel).then(($label) => {
        const currentState = $label.text().trim();
        if (currentState === SMTP_TEXT.stateEnabled) {
            cy.get(smtpSelectors.smtpEnableToggle).eq(0).click();
            cy.contains(SMTP_TEXT.stateDisabled).should("be.visible");
        }
    });
    cy.get(smtpSelectors.smtpEnableToggle).eq(0).click();
    cy.get(smtpSelectors.smtpStatuslabel)
        .should("have.text", SMTP_TEXT.stateEnabled);

    cy.contains(SMTP_TEXT.envToggle).should("be.visible");
    cy.contains(SMTP_TEXT.envHint).should("be.visible");

    verifyLabel(SMTP_TEXT.host);
    verifyInputPlaceholder(smtpSelectors.smtpHostInput, SMTP_TEXT.hostPlaceholder);
    verifyLabel(SMTP_TEXT.port);
    verifyInputPlaceholder(smtpSelectors.smtpPortInput, SMTP_TEXT.portPlaceholder);
    verifyLabel(SMTP_TEXT.username);
    verifyInputPlaceholder(smtpSelectors.smtpUserInput, SMTP_TEXT.userPlaceholder);
    verifyLabel(SMTP_TEXT.password);
    verifyInputPlaceholder(smtpSelectors.smtpPasswordInput, SMTP_TEXT.passwordPlaceholder);

    cy.contains("label", SMTP_TEXT.senderEmail).should("be.visible").parent().find("input").should("be.visible");
    cy.contains(SMTP_TEXT.docs).should("be.visible");
    cy.get(whiteLabelSelectors.cancelButton).verifyVisibleElement("have.text", whitelabelText.cancelButton);
    cy.get(whiteLabelSelectors.saveButton).verifyVisibleElement("have.text", whitelabelText.saveButton);
};
