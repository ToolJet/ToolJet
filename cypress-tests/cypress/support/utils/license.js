import { commonSelectors } from "Selectors/common";
import { licenseSelectors } from "Selectors/license";

export const verifyrenewPlanModal = () => {
    cy.get('[data-cy="modal-header"]').verifyVisibleElement(
        "have.text",
        "Renew Your Plan"
    );
    cy.get('[data-cy="modal-close"]').should("be.visible");
    cy.get('[data-cy="modal-message"]').should(($el) => {
        expect($el.contents().first().text().trim()).to.eq(
            "To renew your plan, please reach out to us at"
        );
    });
    cy.get('[data-cy="support-email"]').verifyVisibleElement(
        "have.text",
        "hello@tooljet.com"
    );
    cy.get('[data-cy="copy-icon"]').should("be.visible");
    cy.get('[data-cy="modal-close"]').click();
};

export const verifyExpiredLicenseBanner = () => {
    cy.get(licenseSelectors.enterpriseGradientIcon).should("be.visible");
    cy.get('[data-cy="warning-text-header"] > div').verifyVisibleElement(
        "have.text",
        "Your license has expired! "
    );
    cy.get(licenseSelectors.warningInfoText).verifyVisibleElement(
        "have.text",
        " Renew your subscription to continue accessing ToolJet's premium features"
    );
    cy.get('[data-cy="renew-button"]')
        .verifyVisibleElement("have.text", "Renew")
        .click();
};
