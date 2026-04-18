import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { viewAppCardOptions } from "Support/utils/common";
import { commonText } from "Texts/common";

import { importSelectors } from "Selectors/exportImport";
import { importText } from "Texts/exportImport";

describe("App creation", () => {
    const data = {};
    const appFile = "cypress/fixtures/templates/one_version.json";

    beforeEach(() => {
        cy.defaultWorkspaceLogin();
        cy.skipWalkthrough();
        cy.viewport(2000, 1900);
    });

    it("Should verify create, rename and clone app flow", () => {
        data.appName = `${fake.companyName}-App`;
        data.rename = `New-${data.appName}`;
        data.cloneAppName = `cloned-${data.appName}`;

        cy.get(commonSelectors.appCreateButton).click();
        cy.get(commonSelectors.createAppTitle).verifyVisibleElement(
            "have.text",
            commonText.createApp,
        );
        cy.get(commonSelectors.appNameLabel).verifyVisibleElement(
            "have.text",
            commonText.appName,
        );
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.attr",
            "placeholder",
            commonText.enterAppName,
        );
        cy.get(commonSelectors.appNameInfoLabel).verifyVisibleElement(
            "have.text",
            commonText.appNameInfoLabel,
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            commonText.cancelButton,
        );
        cy.get(commonSelectors.createAppButton).verifyVisibleElement(
            "have.text",
            "Create app",
        );
        cy.get(commonSelectors.createAppButton).should("be.disabled");

        cy.clearAndType(commonSelectors.appNameInput, data.appName);
        cy.wait(1000);
        cy.get(commonSelectors.cancelButton, { timeout: 20000 }).click();

        cy.get(commonSelectors.appCreateButton).click();
        cy.clearAndType(commonSelectors.appNameInput, data.appName);
        cy.get(commonSelectors.createAppButton, { timeout: 20000 })
            .should("be.enabled")
            .click();

        cy.backToApps();
        cy.wait(1000);
        viewAppCardOptions(data.appName);
        cy.get(commonSelectors.appCardOptions("Rename app")).verifyVisibleElement(
            "have.text",
            commonText.renameApp,
        );
        cy.get(commonSelectors.appCardOptions("Rename app")).click();
        cy.get(commonSelectors.renameApptitle).verifyVisibleElement(
            "have.text",
            commonText.renameApp,
        );
        cy.get(commonSelectors.appNameLabel).verifyVisibleElement(
            "have.text",
            commonText.appName,
        );
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            data.appName,
        );
        cy.get(commonSelectors.appNameInfoLabel).verifyVisibleElement(
            "have.text",
            commonText.appNameInfoLabel,
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            commonText.cancelButton,
        );
        cy.get(commonSelectors.renameAppButton).verifyVisibleElement(
            "have.text",
            commonText.renameApp,
        );
        cy.get(commonSelectors.renameAppButton).should("be.disabled");
        cy.clearAndType(commonSelectors.appNameInput, data.rename);
        cy.wait(1000);
        cy.get(commonSelectors.cancelButton, { timeout: 20000 }).click();

        viewAppCardOptions(data.appName);
        cy.get(commonSelectors.appCardOptions("Rename app")).click();
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            data.appName,
        );
        cy.clearAndType(commonSelectors.appNameInput, data.rename);
        cy.wait(2000);
        cy.get(commonSelectors.renameAppButton, { timeout: 20000 })
            .should("be.enabled")
            .click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "App name has been updated!",
        );

        cy.get('[data-cy="icon-home"]').click();
        cy.wait(1000);
        cy.get('[data-cy="icon-dashboard"]').click();
        viewAppCardOptions(data.rename);
        cy.get(commonSelectors.appCardOptions(commonText.cloneAppOption)).click();
        cy.get(commonSelectors.cloneAppTitle).verifyVisibleElement(
            "have.text",
            commonText.cloneAppOption,
        );
        cy.get(commonSelectors.appNameLabel).verifyVisibleElement(
            "have.text",
            commonText.appName,
        );
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            `${data.rename}_Copy`,
        );
        cy.get(commonSelectors.appNameInfoLabel).verifyVisibleElement(
            "have.text",
            commonText.appNameInfoLabel,
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            commonText.cancelButton,
        );
        cy.get(commonSelectors.cloneAppButton).verifyVisibleElement(
            "have.text",
            commonText.cloneAppOption,
        );
        cy.get(commonSelectors.cloneAppButton).should("be.enabled");
        cy.clearAndType(commonSelectors.appNameInput, data.cloneAppName);
        cy.wait(1000);
        cy.get(commonSelectors.cancelButton, { timeout: 20000 }).click();

        viewAppCardOptions(data.rename);
        cy.get(commonSelectors.appCardOptions(commonText.cloneAppOption)).click();
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            `${data.rename}_Copy`,
        );
        cy.clearAndType(commonSelectors.appNameInput, data.cloneAppName);
        cy.wait(1000);
        cy.get(commonSelectors.cloneAppButton, { timeout: 20000 })
            .should("be.enabled")
            .click();

        cy.wait(2000);
        cy.backToApps();
        cy.wait(1000);

        cy.get(commonSelectors.appCreateButton, { timeout: 20000 }).click();
        cy.clearAndType(commonSelectors.appNameInput, data.rename);
        cy.wait(1000);
        cy.get(commonSelectors.createAppButton, { timeout: 20000 }).click();
        cy.get(commonSelectors.appNameErrorLabel).verifyVisibleElement(
            "have.text",
            "App name already exists",
        );
        cy.get(commonSelectors.createAppButton).should("be.disabled");
    });

    it("Should verify the import app flow", () => {
        data.appName = `${fake.companyName}-App`;

        cy.get(importSelectors.dropDownMenu).click();
        cy.get(importSelectors.importOptionInput).eq(0).selectFile(appFile, {
            force: true,
        });

        cy.get(importSelectors.importAppTitle).verifyVisibleElement(
            "have.text",
            "Import app",
        );
        cy.get(commonSelectors.appNameLabel).verifyVisibleElement(
            "have.text",
            commonText.appName,
        );
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            "one_version",
        );
        cy.get(commonSelectors.appNameInfoLabel).verifyVisibleElement(
            "have.text",
            commonText.appNameInfoLabel,
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            commonText.cancelButton,
        );
        cy.get(commonSelectors.importAppButton).verifyVisibleElement(
            "have.text",
            "Import app",
        );
        cy.get(commonSelectors.importAppButton).should("be.enabled");

        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            "one_version",
        );
        cy.clearAndType(commonSelectors.appNameInput, data.appName);
        cy.wait(2000);
        cy.get(commonSelectors.cancelButton, { timeout: 20000 }).click();

        cy.get(commonSelectors.breadcrumbPageTitle).click({ force: true });
        cy.wait(1000);
        cy.get(importSelectors.dropDownMenu, { timeout: 20000 }).click();
        cy.get('[data-cy="button-import-an-app"]').click();
        cy.get(importSelectors.importOptionInput).eq(0).selectFile(appFile, {
            force: true,
        });
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            "one_version",
        );
        cy.clearAndType(commonSelectors.appNameInput, data.appName);
        cy.wait(2000);
        cy.get(commonSelectors.importAppButton, { timeout: 20000 })
            .should("be.enabled")
            .click();
        cy.get(".go3958317564")
            .should("be.visible")
            .and("have.text", importText.appImportedToastMessage);
        cy.backToApps();
    });

    it("should verify the templates app creation", () => {
        data.appName = `${fake.companyName}-App`;

        cy.get(importSelectors.dropDownMenu).click();
        cy.get(commonSelectors.chooseFromTemplateButton).click();
        cy.clearAndType('[data-cy="search-input-field"]', "Admin panel");
        cy.get('[data-cy="admin-panel-tooljet-db-list-item"]', {
            timeout: 20000,
        }).click();
        cy.get('[data-cy="create-application-from-template-button"]', {
            timeout: 20000,
        }).click();

        cy.wait(1000);
        cy.get(commonSelectors.CreateAppFromTemplateButton).verifyVisibleElement(
            "have.text",
            "Create app",
        );
        cy.get(commonSelectors.appNameLabel).verifyVisibleElement(
            "have.text",
            commonText.appName,
        );
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            "Admin Panel (ToolJet Database)",
        );
        cy.get(commonSelectors.appNameInfoLabel).verifyVisibleElement(
            "have.text",
            commonText.appNameInfoLabel,
        );
        cy.get(commonSelectors.cancelButton, {
            timoeut: 2000,
        }).verifyVisibleElement("have.text", commonText.cancelButton);
        cy.get(
            '[data-cy="create-from-template-front-end-button"]',
        ).verifyVisibleElement("have.text", "Create app");
        cy.get('[data-cy="create-from-template-front-end-button"]').should(
            "be.enabled",
        );

        cy.clearAndType(commonSelectors.appNameInput, data.appName);
        cy.get(commonSelectors.cancelButton, { timeout: 20000 }).click();
        cy.wait(2000);

        cy.get(importSelectors.dropDownMenu).click();
        cy.get(commonSelectors.chooseFromTemplateButton).click();
        cy.get('[data-cy="bug-tracker-list-item"]').click();
        cy.get('[data-cy="create-application-from-template-button"]', {
            timeout: 20000,
        }).click();
        cy.clearAndType(commonSelectors.appNameInput, data.appName);
        cy.wait(1000);
        cy.get('[data-cy="create-from-template-front-end-button"]', {
            timeout: 20000,
        })
            .should("be.enabled")
            .click();
        cy.get('[data-cy="page-logo"]', { timeout: 20000 }).should("be.visible");
    });
});
