import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { commonEeText, ssoEeText } from "Texts/eeCommon";
import {
    verifyTooltip
} from "Support/utils/common";

import {
    verifyPromoteModalUI
} from "Support/utils/eeCommon";


describe("Multi env", () => {
    const data = {};
    data.appName = `${fake.companyName} App`;

    beforeEach(() => {
        cy.appUILogin();
        cy.createApp();
        cy.renameApp(data.appName);
        cy.dragAndDropWidget("Text", 350, 350);
    })
    it("Verify the multi env components UI", () => {
        cy.get('[data-cy="env-container"]').should("be.visible")
        cy.get('[data-cy="list-current-env-name"]').verifyVisibleElement("have.text", "Development").click()
        cy.get('[data-cy="env-arrow"]').should("be.visible")
        cy.get('[data-cy="selected-current-env-name"]').verifyVisibleElement("have.text", " Development")
        cy.get('[data-cy="env-name-list"]').eq(0).verifyVisibleElement("have.text", "Development")
        cy.get('[data-cy="env-name-list"]').eq(1).verifyVisibleElement("have.text", "Staging")
        cy.get('[data-cy="env-name-list"]').eq(2).verifyVisibleElement("have.text", "Production")

        verifyTooltip('[data-cy="env-name-list"]:eq(1)', "There are no versions in this environment")
        verifyTooltip('[data-cy="env-name-list"]:eq(2)', "There are no versions in this environment")

        cy.get('[data-cy="app-version-label"]').should('be.visible')
        cy.get('[data-cy="v1-current-version-text"]').verifyVisibleElement("have.text", "v1").click()
        cy.get('[data-cy="current-version"]').verifyVisibleElement("have.text", "v1")
        cy.get('.col-10 > .app-version-name').verifyVisibleElement("have.text", "v1")
        cy.get('[data-cy="create-new-version-button"]').verifyVisibleElement("have.text", "Create new version")

        verifyPromoteModalUI('v1', "Development", "Staging");
        cy.get('[data-cy="env-change-info-text"]').verifyVisibleElement("have.text", "You won’t be able to edit this version after promotion. Are you sure you want to continue?")
        cy.get('[data-cy="close-button"]').click();
        cy.get('[data-cy="list-current-env-name"]').verifyVisibleElement("have.text", "Development")

        cy.get('[data-cy="promte-button"]').click();
        cy.get('[data-cy="cancel-button"]').click()
        cy.get('[data-cy="list-current-env-name"]').verifyVisibleElement("have.text", "Development")

        cy.get('[data-cy="promte-button"]').click();
        cy.get('[data-cy="promote-button"]').click();

        cy.waitForAppLoad();
        cy.wait(1500)

        cy.get('[data-cy="warning-text"]').verifyVisibleElement("have.text", "App cannot be edited after promotion. Please create a new version from Development to make any changes.")
        cy.get('[data-cy="env-container"]').should("be.visible")
        cy.get('[data-cy="list-current-env-name"]').verifyVisibleElement("have.text", "Staging").click()
        cy.get('[data-cy="env-arrow"]').should("be.visible")
        cy.get('[data-cy="selected-current-env-name"]').verifyVisibleElement("have.text", " Staging")
        cy.get('[data-cy="env-name-list"]').eq(0).verifyVisibleElement("have.text", "Development")
        cy.get('[data-cy="env-name-list"]').eq(1).verifyVisibleElement("have.text", "Staging")
        cy.get('[data-cy="env-name-list"]').eq(2).verifyVisibleElement("have.text", "Production")
        verifyTooltip('[data-cy="env-name-list"]:eq(2)', "There are no versions in this environment")

        cy.get('[data-cy="app-version-label"]').should('be.visible')
        cy.get('[data-cy="v1-current-version-text"]').verifyVisibleElement("have.text", "v1").click()
        cy.get('[data-cy="current-version"]').verifyVisibleElement("have.text", "v1")
        cy.get('.col-10 > .app-version-name').verifyVisibleElement("have.text", "v1")
        cy.get('[data-cy="create-new-version-button"]').verifyVisibleElement("have.text", "Create new version")

        cy.get('.datasource-picker').should('have.class', 'disabled');
        cy.get('[data-cy="show-ds-popover-button"]').should('be.disabled')
        cy.get('.components-container').should('have.class', 'disabled');

        verifyPromoteModalUI('v1', "Staging", "Production");
        cy.get('[data-cy="close-button"]').click();
        cy.get('[data-cy="list-current-env-name"]').verifyVisibleElement("have.text", "Staging")

        cy.get('[data-cy="promte-button"]').click();
        cy.get('[data-cy="cancel-button"]').click()
        cy.get('[data-cy="list-current-env-name"]').verifyVisibleElement("have.text", "Staging")

        cy.get('[data-cy="promte-button"]').click();
        cy.get('[data-cy="promote-button"]').click();
        cy.waitForAppLoad();
        cy.wait(1500)

        cy.get('[data-cy="warning-text"]').verifyVisibleElement("have.text", "App cannot be edited after promotion. Please create a new version from Development to make any changes.")
        cy.get('[data-cy="env-container"]').should("be.visible")
        cy.get('[data-cy="list-current-env-name"]').verifyVisibleElement("have.text", "Production").click()
        cy.get('[data-cy="env-arrow"]').should("be.visible")
        cy.get('[data-cy="selected-current-env-name"]').verifyVisibleElement("have.text", " Production")
        cy.get('[data-cy="env-name-list"]').eq(0).verifyVisibleElement("have.text", "Development")
        cy.get('[data-cy="env-name-list"]').eq(1).verifyVisibleElement("have.text", "Staging")
        cy.get('[data-cy="env-name-list"]').eq(2).verifyVisibleElement("have.text", "Production")

        cy.get('[data-cy="app-version-label"]').should('be.visible')
        cy.get('[data-cy="v1-current-version-text"]').verifyVisibleElement("have.text", "v1").click()
        cy.get('[data-cy="current-version"]').verifyVisibleElement("have.text", "v1")
        cy.get('.col-10 > .app-version-name').verifyVisibleElement("have.text", "v1")
        cy.get('[data-cy="create-new-version-button"]').verifyVisibleElement("have.text", "Create new version")

        cy.get('[data-cy="release-button"]').verifyVisibleElement("have.text", "Release").click()
        cy.get('[data-cy="modal-title"]').verifyVisibleElement("have.text", "Release Version")
        cy.get('[data-cy="close-button"]').should("be.visible")
        cy.get('[data-cy="confirm-dialogue-box-text"]').verifyVisibleElement("have.text", "Are you sure you want to release this version?")
        cy.get('[data-cy="cancel-button"]').verifyVisibleElement("have.text", "Cancel")
        cy.get('[data-cy="yes-button"]').verifyVisibleElement("have.text", "Yes")



        cy.get('[data-cy="close-button"]').click()
        cy.get('[data-cy="list-current-env-name"]').verifyVisibleElement("have.text", "Production")

        cy.get('[data-cy="release-button"]').click()
        cy.get('[data-cy="cancel-button"]').click()
        cy.get('[data-cy="list-current-env-name"]').verifyVisibleElement("have.text", "Production")

        cy.get('[data-cy="release-button"]').click()
        cy.get('[data-cy="yes-button"]').click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Version v1 released"
        );
        cy.wait(500)
        cy.get('[data-cy="warning-text"]').verifyVisibleElement("have.text", "This version of the app is released. Please create a new version in development to make any changes.")
        cy.get('.datasource-picker').should('have.class', 'disabled');
        cy.get('[data-cy="show-ds-popover-button"]').should('be.disabled')
        cy.get('.components-container').should('have.class', 'disabled');
        cy.get('[data-cy="release-button"]').should('have.class', 'disabled');
    })
})