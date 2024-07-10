import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import {
    logout,
    verifyTooltip,
    navigateToAppEditor,
} from "Support/utils/common";
import { commonText } from "Texts/common";
import { userSignUp } from "Support/utils/onboarding";
import { promoteApp, appPromote, releaseApp } from "Support/utils/multiEnv";

describe("App slug", () => {
    const data = {};
    data.appName = `${fake.companyName} App`;
    data.slug = `${fake.companyName.toLowerCase()}-app`;

    before(() => {
        cy.defaultWorkspaceLogin();
        cy.apiCreateApp(data.appName);
    });

    it("Verify app slug cases in global settings", () => {
        cy.reload();
        navigateToAppEditor(data.appName);
        cy.waitForAppLoad();

        cy.get(commonSelectors.leftSideBarSettingsButton).click();
        cy.get(commonWidgetSelector.appSlugLabel).verifyVisibleElement(
            "have.text",
            "Unique app slug"
        );
        cy.get(commonWidgetSelector.appSlugInput).verifyVisibleElement(
            "have.value",
            Cypress.env("appId")
        );
        cy.get(commonWidgetSelector.appSlugInfoLabel).verifyVisibleElement(
            "have.text",
            "URL-friendly 'slug' consists of lowercase letters, numbers, and hyphens"
        );
        cy.get(commonWidgetSelector.appLinkLabel).verifyVisibleElement(
            "have.text",
            "App link"
        );
        cy.reload();
        cy.get(commonSelectors.leftSideBarSettingsButton).click();
        cy.get(commonWidgetSelector.appLinkField).verifyVisibleElement(
            "have.text",
            `http://localhost:8082/my-workspace/apps/${Cypress.env("appId")}`
        );

        cy.wait(500);
        cy.get(commonWidgetSelector.appSlugInput).clear();
        cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
            "have.text",
            "App slug can't be empty"
        );

        cy.clearAndType(commonWidgetSelector.appSlugInput, "_2#");
        cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
            "have.text",
            "Special characters are not accepted."
        );

        cy.clearAndType(commonWidgetSelector.appSlugInput, "t ");
        cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
            "have.text",
            "Cannot contain spaces"
        );

        cy.clearAndType(commonWidgetSelector.appSlugInput, "T");
        cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
            "have.text",
            "Only lowercase letters are accepted."
        );

        cy.get(commonWidgetSelector.appSlugInput).clear();
        cy.clearAndType(commonWidgetSelector.appSlugInput, data.slug);
        cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
            "have.text",
            "Slug accepted!"
        );
        cy.get(commonWidgetSelector.appLinkSucessLabel).verifyVisibleElement(
            "have.text",
            "Link updated successfully!"
        );
        cy.get(commonWidgetSelector.appLinkField).verifyVisibleElement(
            "have.text",
            `http://localhost:8082/my-workspace/apps/${data.slug}`
        );
        cy.url().should(
            "eq",
            `http://localhost:8082/my-workspace/apps/${data.slug}/home`
        );

        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.url().should(
            "eq",
            `http://localhost:8082/applications/${data.slug}/home?env=development&version=v1`
        );
        cy.go("back");
        cy.waitForAppLoad();
        cy.wait(2000);

        promoteApp();
        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.url().should(
            "eq",
            `http://localhost:8082/applications/${data.slug}/home?env=staging&version=v1`
        );
        cy.go("back");
        cy.waitForAppLoad();
        cy.wait(2000);

        promoteApp();
        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.url().should(
            "eq",
            `http://localhost:8082/applications/${data.slug}/home?env=production&version=v1`
        );
        cy.go("back");
        cy.waitForAppLoad();
        cy.wait(2000);

        releaseApp();

        cy.visitSlug({
            actualUrl: `http://localhost:8082/applications/${data.slug}`,
        });
        cy.url().should(
            "eq",
            `http://localhost:8082/applications/${data.slug}/home`
        );
        cy.visit("/my-workspace");
        cy.wait(500);

        cy.apiCreateApp(data.slug);
        cy.openApp("my-workspace");
        cy.waitForAppLoad();

        cy.get(commonSelectors.leftSideBarSettingsButton).click();
        cy.get(commonWidgetSelector.appSlugInput).clear();
        cy.clearAndType(commonWidgetSelector.appSlugInput, data.slug);
        cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
            "have.text",
            "This app slug is already taken."
        );
    });

    it("Verify app slug cases in share modal", () => {
        data.slug = `${fake.companyName.toLowerCase()}-app`;
        data.appName = `${fake.companyName} App`;

        cy.defaultWorkspaceLogin();
        cy.apiCreateApp(data.appName);
        cy.reload();
        navigateToAppEditor(data.appName);
        cy.waitForAppLoad();

        cy.get(commonSelectors.leftSideBarSettingsButton).click();
        cy.get(commonWidgetSelector.appSlugInput).clear();
        cy.clearAndType(commonWidgetSelector.appSlugInput, data.slug);
        cy.wait(1000);

        appPromote("development", "release");

        cy.get(commonWidgetSelector.shareAppButton).click();
        cy.get(commonWidgetSelector.appNameSlugInput).should(
            "have.value",
            data.slug
        );

        cy.get(commonWidgetSelector.appNameSlugInput).clear();
        cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
            "have.text",
            "App slug can't be empty"
        );

        cy.clearAndType(commonWidgetSelector.appNameSlugInput, "_2#");
        cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
            "have.text",
            "Special characters are not accepted."
        );

        cy.clearAndType(commonWidgetSelector.appNameSlugInput, "t ");
        cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
            "have.text",
            "Cannot contain spaces"
        );

        cy.clearAndType(commonWidgetSelector.appNameSlugInput, "T");
        cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
            "have.text",
            "Only lowercase letters are accepted."
        );

        data.slug = `${fake.companyName.toLowerCase()}-app`;
        cy.get(commonWidgetSelector.appNameSlugInput).clear();
        cy.clearAndType(commonWidgetSelector.appNameSlugInput, data.slug);
        cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
            "have.text",
            "Slug accepted!"
        );
        cy.get(1000);
        cy.get(commonWidgetSelector.modalCloseButton).click();
        cy.url().should(
            "eq",
            `http://localhost:8082/my-workspace/apps/${data.slug}/home`
        );

        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.url().should(
            "eq",
            `http://localhost:8082/applications/${data.slug}/home?env=production&version=v1`
        );
        cy.go("back");
        cy.waitForAppLoad();
        cy.wait(2000);

        cy.visitSlug({
            actualUrl: `http://localhost:8082/applications/${data.slug}`,
        });
        cy.url().should(
            "eq",
            `http://localhost:8082/applications/${data.slug}/home`
        );
        cy.visit("/my-workspace");
        cy.wait(500);

        cy.apiCreateApp(data.slug);
        cy.openApp("my-workspace");
        cy.waitForAppLoad();
        appPromote("development", "release");
        cy.get(commonWidgetSelector.shareAppButton).click();
        cy.clearAndType(commonWidgetSelector.appNameSlugInput, data.slug);
        cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
            "have.text",
            "This app slug is already taken."
        );
    });
});