import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { viewAppCardOptions } from "Support/utils/common";
import { commonText } from "Texts/common";

import { importSelectors } from "Selectors/exportImport";
import { importText } from "Texts/exportImport";

describe("App creation", () => {
    const data = {};
    const appFile = "cypress/fixtures/templates/test-app.json";

    beforeEach(() => {
        cy.defaultWorkspaceLogin();
        cy.skipWalkthrough();
    });

    it("Should verify create, rename and clone app flow", () => {
        data.appName = `${fake.companyName}-App`;
        data.rename = `New-${data.appName}`;
        data.cloneAppName = `cloned-${data.appName}`;

        cy.get(commonSelectors.appCreateButton).click();
        cy.get(commonSelectors.createAppTitle).verifyVisibleElement(
            "have.text",
            commonText.createApp
        );
        cy.get(commonSelectors.appNameLabel).verifyVisibleElement(
            "have.text",
            commonText.appName
        );
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.attr",
            "placeholder",
            commonText.enterAppName
        );
        cy.get(commonSelectors.appNameInfoLabel).verifyVisibleElement(
            "have.text",
            commonText.appNameInfoLabel
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            commonText.cancelButton
        );
        cy.get(commonSelectors.createAppButton).verifyVisibleElement(
            "have.text",
            "+ Create app"
        );
        cy.get(commonSelectors.createAppButton).should("be.disabled");
        cy.get(commonWidgetSelector.modalCloseButton).should("be.visible");

        cy.clearAndType(commonSelectors.appNameInput, data.appName);
        cy.get(commonWidgetSelector.modalCloseButton).click();

        cy.get(commonSelectors.appCreateButton).click();
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.attr",
            "placeholder",
            commonText.enterAppName
        );
        cy.clearAndType(commonSelectors.appNameInput, data.appName);
        cy.get(commonSelectors.cancelButton).click();

        cy.get(commonSelectors.appCreateButton).click();
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.attr",
            "placeholder",
            commonText.enterAppName
        );
        cy.clearAndType(commonSelectors.appNameInput, data.appName);
        cy.get(commonSelectors.createAppButton).should("be.enabled").click();
        cy.go("back");
        cy.visit("/my-workspace");

        cy.wait(1000);
        viewAppCardOptions(data.appName);
        cy.get(commonSelectors.appCardOptions("Rename app")).verifyVisibleElement(
            "have.text",
            commonText.renameApp
        );
        cy.get(commonSelectors.appCardOptions("Rename app")).click();
        cy.get(commonSelectors.renameApptitle).verifyVisibleElement(
            "have.text",
            commonText.renameApp
        );
        cy.get(commonSelectors.appNameLabel).verifyVisibleElement(
            "have.text",
            commonText.appName
        );
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            data.appName
        );
        cy.get(commonSelectors.appNameInfoLabel).verifyVisibleElement(
            "have.text",
            commonText.appNameInfoLabel
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            commonText.cancelButton
        );
        cy.get(commonSelectors.renameAppButton).verifyVisibleElement(
            "have.text",
            commonText.renameApp
        );
        cy.get(commonSelectors.renameAppButton).should("be.disabled");
        cy.get(commonWidgetSelector.modalCloseButton).should("be.visible");

        cy.clearAndType(commonSelectors.appNameInput, data.rename);
        cy.get(commonWidgetSelector.modalCloseButton).click();

        viewAppCardOptions(data.appName);
        cy.get(commonSelectors.appCardOptions("Rename app")).click();
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            data.appName
        );
        cy.clearAndType(commonSelectors.appNameInput, data.rename);
        cy.get(commonSelectors.cancelButton).click();

        viewAppCardOptions(data.appName);
        cy.get(commonSelectors.appCardOptions("Rename app")).click();
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            data.appName
        );
        cy.clearAndType(commonSelectors.appNameInput, data.rename);
        cy.get(commonSelectors.renameAppButton).should("be.enabled").click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "App name has been updated!"
        );

        viewAppCardOptions(data.rename);
        cy.get(commonSelectors.appCardOptions(commonText.cloneAppOption)).click();
        cy.get(commonSelectors.cloneAppTitle).verifyVisibleElement(
            "have.text",
            commonText.cloneAppOption
        );
        cy.get(commonSelectors.appNameLabel).verifyVisibleElement(
            "have.text",
            commonText.appName
        );
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            `${data.rename}_Copy`
        );
        cy.get(commonSelectors.appNameInfoLabel).verifyVisibleElement(
            "have.text",
            commonText.appNameInfoLabel
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            commonText.cancelButton
        );
        cy.get(commonSelectors.cloneAppButton).verifyVisibleElement(
            "have.text",
            commonText.cloneAppOption
        );
        cy.get(commonSelectors.cloneAppButton).should("be.enabled");
        cy.get(commonWidgetSelector.modalCloseButton).should("be.visible");

        cy.clearAndType(commonSelectors.appNameInput, data.rename);
        cy.get(commonWidgetSelector.modalCloseButton).click();

        viewAppCardOptions(data.rename);
        cy.get(commonSelectors.appCardOptions(commonText.cloneAppOption)).click();
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            `${data.rename}_Copy`
        );
        cy.clearAndType(commonSelectors.appNameInput, data.cloneAppName);
        cy.get(commonSelectors.cancelButton).click();

        viewAppCardOptions(data.rename);
        cy.get(commonSelectors.appCardOptions(commonText.cloneAppOption)).click();
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            `${data.rename}_Copy`
        );
        cy.clearAndType(commonSelectors.appNameInput, data.cloneAppName);
        cy.get(commonSelectors.cloneAppButton).should("be.enabled").click();
        cy.go("back");
        cy.visit("/my-workspace");

        cy.get(commonSelectors.appCreateButton).click();
        cy.clearAndType(commonSelectors.appNameInput, data.rename);
        cy.get(commonSelectors.createAppButton).click();
        cy.get(commonSelectors.appNameErrorLabel).verifyVisibleElement(
            "have.text",
            "App name already exists"
        );
        cy.get(commonSelectors.createAppButton).should("be.disabled");
    });
    it("Should verify the import app flow", () => {
        data.appName = `${fake.companyName}-App`;

        cy.get(importSelectors.dropDownMenu).click();
        cy.get(importSelectors.importOptionInput).eq(0).selectFile(appFile, {
            force: true,
        });

        cy.get(commonSelectors.importAppTitle).verifyVisibleElement(
            "have.text",
            "Import app"
        );
        cy.get(commonSelectors.appNameLabel).verifyVisibleElement(
            "have.text",
            commonText.appName
        );
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            "test-app"
        );
        cy.get(commonSelectors.appNameInfoLabel).verifyVisibleElement(
            "have.text",
            commonText.appNameInfoLabel
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            commonText.cancelButton
        );
        cy.get(commonSelectors.importAppButton).verifyVisibleElement(
            "have.text",
            "Import app"
        );
        cy.get(commonSelectors.importAppButton).should("be.enabled");
        cy.get(commonWidgetSelector.modalCloseButton).should("be.visible");

        cy.clearAndType(commonSelectors.appNameInput, data.appName);
        cy.get(commonWidgetSelector.modalCloseButton).click();

        cy.get(importSelectors.dropDownMenu).click();
        cy.get(importSelectors.importOptionInput).eq(0).selectFile(appFile, {
            force: true,
        });
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            "test-app"
        );
        cy.clearAndType(commonSelectors.appNameInput, data.appName);
        cy.get(commonSelectors.cancelButton).click();

        cy.get(importSelectors.dropDownMenu).click();
        cy.get(importSelectors.importOptionInput).eq(0).selectFile(appFile, {
            force: true,
        });
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            "test-app"
        );
        cy.clearAndType(commonSelectors.appNameInput, data.appName);
        cy.get(commonSelectors.importAppButton).should("be.enabled").click();
        cy.get(".go3958317564")
            .should("be.visible")
            .and("have.text", importText.appImportedToastMessage);
        cy.go("back");
        cy.visit("/my-workspace");
    });
    it("should verify the templates app creation", () => {
        data.appName = `${fake.companyName}-App`;

        cy.get(importSelectors.dropDownMenu).click();
        cy.get(commonSelectors.chooseFromTemplateButton).click();
        cy.get(".d-flex > .tj-primary-btn").click();

        cy.get(commonSelectors.CreateAppFromTemplateButton).verifyVisibleElement(
            "have.text",
            "Create new app from template"
        );
        cy.get(commonSelectors.appNameLabel).verifyVisibleElement(
            "have.text",
            commonText.appName
        );
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.value",
            "Applicant tracking system"
        );
        cy.get(commonSelectors.appNameInfoLabel).verifyVisibleElement(
            "have.text",
            commonText.appNameInfoLabel
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            commonText.cancelButton
        );
        cy.get(commonSelectors.createAppButton).verifyVisibleElement(
            "have.text",
            "+ Create app"
        );
        cy.get(commonSelectors.createAppButton).should("be.enabled");
        cy.get(commonWidgetSelector.modalCloseButton).should("be.visible");

        cy.clearAndType(commonSelectors.appNameInput, data.appName);
        cy.get(commonWidgetSelector.modalCloseButton).click();

        cy.get(importSelectors.dropDownMenu).click();
        cy.get(commonSelectors.chooseFromTemplateButton).click();
        cy.get(".d-flex > .tj-primary-btn").click();
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.attr",
            "placeholder",
            commonText.enterAppName
        );
        cy.clearAndType(commonSelectors.appNameInput, data.appName);
        cy.get(commonSelectors.cancelButton).click();

        cy.get(importSelectors.dropDownMenu).click();
        cy.get(commonSelectors.chooseFromTemplateButton).click();
        cy.get(".d-flex > .tj-primary-btn").click();
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
            "have.attr",
            "placeholder",
            commonText.enterAppName
        );
        cy.clearAndType(commonSelectors.appNameInput, data.appName);
        cy.get(commonSelectors.createAppButton).should("be.enabled").click();
    });
});
