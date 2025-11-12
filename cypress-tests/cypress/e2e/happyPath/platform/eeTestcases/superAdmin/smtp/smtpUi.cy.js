import { openSMTPSettings, verifySmtpSettingsUI } from "Support/utils/platform/smtp";

describe("Instance Settings - SMTP Settings UI", () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.visit("/");
    });

    it("verifies SMTP settings UI", () => {
        openSMTPSettings();
        verifySmtpSettingsUI();
    });
});
