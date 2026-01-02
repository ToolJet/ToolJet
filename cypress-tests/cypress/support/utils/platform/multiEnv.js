import { multiEnvSelector, commonEeSelectors } from "Selectors/eeCommon";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { appVersionSelectors } from "Selectors/exportImport";
import { appVersionText } from "Texts/exportImport";

export const promoteApp = () => {
    cy.get(commonEeSelectors.promoteButton).click();
    cy.get(commonEeSelectors.promoteButton).eq(1).click();
    cy.waitForAppLoad();
    cy.wait(3000);
};

export const releaseApp = () => {
    cy.get(commonSelectors.releaseButton).click();
    cy.get(commonSelectors.yesButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Version v1 released");
    cy.wait(500);
};

export const launchApp = () => {
    cy.url().then((url) => {
        const parts = url.split("/");
        const value = parts[parts.length - 1];
        cy.log(`Extracted value: ${value}`);
        cy.visit(`/applications/${value}`);
        cy.wait(3000);
    });
};

export const appPromote = (fromEnv, toEnv) => {
    const commonActions = () => {
        cy.get(commonEeSelectors.promoteButton).click();
        cy.get(commonEeSelectors.promoteButton).eq(1).click();
        cy.waitForAppLoad();
        cy.wait(2000);
    };

    const transitions = {
        development: {
            staging: commonActions,
            production: () => {
                commonActions();
                appPromote("staging", "production");
            },
            release: () => {
                commonActions();
                commonActions();
                cy.get(commonSelectors.releaseButton).click();
                cy.get(commonSelectors.yesButton).click();
                cy.wait(500);
            },
        },
        staging: {
            production: commonActions,
            release: () => {
                commonActions();
                cy.get(commonSelectors.releaseButton).click();
                cy.get(commonSelectors.yesButton).click();
                cy.wait(500);
            },
        },
    };

    const transition = transitions[fromEnv]?.[toEnv];

    transition();
};

export const createNewVersion = (value, newVersion = [], version) => {
    cy.get('[data-cy="list-current-env-name"]').click();
    cy.get(multiEnvSelector.envNameList).eq(0).click();
    cy.get(appVersionSelectors.currentVersionField(value)).click();
    cy.get(appVersionSelectors.createNewVersionButton).click();
    cy.get(appVersionSelectors.createVersionInputField).click();
    cy.contains(`[id*="react-select-"]`, version).click();
    cy.get(appVersionSelectors.versionNameInputField).click().type(newVersion[0]);
    cy.get(appVersionSelectors.createNewVersionButton).click();
    cy.waitForAppLoad();
    cy.verifyToastMessage(
        commonSelectors.toastMessage,
        appVersionText.createdToastMessage
    );
    cy.get(appVersionSelectors.currentVersionField(newVersion[0])).should(
        "be.visible"
    );
};

export const selectVersion = (value, newVersion = []) => {
    cy.get(appVersionSelectors.currentVersionField(value)).click();
    cy.get(".react-select__menu-list .app-version-name")
        .contains(newVersion[0])
        .click();
    cy.waitForAppLoad();
};

export const selectEnv = (envName) => {
    const envIndex = {
        development: 0,
        staging: 1,
        production: 2,
    }[envName];

    const isValidEnvName = (envName) => {
        return (
            envName === "development" ||
            envName === "staging" ||
            envName === "production"
        );
    };

    if (isValidEnvName(envName)) {
        cy.get('[data-cy="list-current-env-name"]').click();
        cy.wait(500)
        const envSelector = `${multiEnvSelector.envNameList}:eq(${envIndex})`;
        cy.get(envSelector).click();
        cy.waitForAppLoad();
    }
};


