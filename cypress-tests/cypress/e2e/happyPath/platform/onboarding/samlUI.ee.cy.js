import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { commonEeSelectors, ssoEeSelector } from "Selectors/eeCommon";
import { ssoSelector } from "Selectors/manageSSO";
import { navigateToManageSSO, sanitize } from "Support/utils/common";
import { ssoEeText, ssoText } from "Texts/manageSSO";

describe("SAML SSO", () => {
    const data = {};

    beforeEach("", () => {
        data.workspaceName = `${sanitize(fake.firstName)}-saml`;
        data.workspaceSlug = data.workspaceName;

        cy.apiLogin();

        cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug).then(
            (res) => {
                Cypress.env("workspaceId", res.body.organization_id);
            }
        );
    });

    it("Should verify SAML modal elements", () => {
        cy.visit(`/${data.workspaceSlug}`);
        navigateToManageSSO();
        cy.get(ssoEeSelector.saml.card).should("be.visible");
        cy.get(ssoEeSelector.saml.label).verifyVisibleElement("have.text", "SAML");
        cy.get(`${ssoEeSelector.saml.card} > .switch > .slider`).should(
            "be.visible"
        );
        cy.wait(1000);
        cy.get(ssoEeSelector.saml.card).click();

        cy.get(`${ssoEeSelector.saml.toggleInput} > .slider`).should("be.visible");
        cy.get(ssoSelector.statusLabel).verifyVisibleElement(
            "have.text",
            ssoText.disabledLabel
        );

        Object.entries(ssoEeSelector.samlModalElements).forEach(([key, selector]) => {
            cy.get(selector)
                .should('be.visible')
                .verifyVisibleElement(
                    "have.text",
                    ssoEeText.samlModalElements[key]
                );
        });
        cy.get(ssoEeSelector.saml.nameInput).should("be.visible");
        cy.get(ssoEeSelector.saml.metadataInput).should("be.visible");
        cy.get(ssoEeSelector.saml.groupAttributeInput).should("be.visible");

        cy.get(ssoEeSelector.saml.toggleInput).click();
        cy.get(commonEeSelectors.cancelButton).eq(1).click();
        cy.get(ssoEeSelector.saml.card).click();
        cy.get(ssoEeSelector.statusLabel).verifyVisibleElement(
            "have.text",
            ssoText.disabledLabel
        );

        cy.clearAndType(ssoEeSelector.saml.nameInput, "SAML");
        cy.clearAndType(ssoEeSelector.saml.metadataInput, ssoEeText.testclientId);
        cy.clearAndType(
            ssoEeSelector.saml.groupAttributeInput,
            ssoEeText.testclientId
        );

        cy.get('[data-cy="saml-toggle-input"] > .slider').click();
        cy.get(ssoSelector.saveButton).eq(1).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Saved SAML SSO configurations"
        );
        cy.get(ssoEeSelector.statusLabel).verifyVisibleElement(
            "have.text",
            ssoEeText.enabledLabel
        );
        cy.get(ssoEeSelector.redirectUrlLabel).verifyVisibleElement(
            "have.text",
            ssoText.redirectUrlLabel
        );
        cy.get(ssoSelector.redirectUrl).should("be.visible");
        cy.get(ssoEeSelector.saml.copyIcon).should("be.visible");

        cy.apiLogout();
        cy.visit(`/login/${data.workspaceSlug}`);
        cy.get(ssoEeSelector.saml.ssoText).should("be.visible");
    });
});
