import { multiEnvSelector, commonEeSelectors } from "Selectors/eeCommon";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";

export const promoteApp = () => {
    cy.get(commonEeSelectors.promoteButton).click();
    cy.get(commonEeSelectors.promoteButton).eq(1).click();
    cy.waitForAppLoad();
    cy.wait(1500);
};

export const releaseApp = () => {
    cy.get(commonSelectors.releaseButton).click();
    cy.get(commonSelectors.yesButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Version v1 released");
    cy.wait(500);
};

export const launchApp = () => {
    cy.url().then((url) => {
        const parts = url.split('/');
        const value = parts[parts.length - 1];
        cy.log(`Extracted value: ${value}`);
        // cy.get(commonSelectors.editorPageLogo).click();
        // cy.wait(1000)

        cy.visit(`/applications/${value}`)
        cy.wait(3000);
    });
}