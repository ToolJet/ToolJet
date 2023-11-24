import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import {
    logout,
    navigateToAppEditor,
    navigateToManageUsers,
} from "Support/utils/common";
import { commonText } from "Texts/common";
import { addNewUserMW } from "Support/utils/userPermissions";
import { userSignUp } from "Support/utils/onboarding";
import { commonEeSelectors } from "Selectors/eeCommon";
import {
    resetAllowPersonalWorkspace,
    inviteUser,
    WorkspaceInvitationLink,
} from "Support/utils/eeCommon";
import { promoteApp, releaseApp } from "Support/utils/multiEnv";

describe("App share functionality", () => {
    const data = {};
    data.appName = `${fake.companyName} App`;
    data.firstName = fake.firstName;
    data.lastName = fake.lastName.replaceAll("[^A-Za-z]", "");
    data.email = fake.email.toLowerCase();
    const slug = data.appName.toLowerCase().replace(/\s+/g, "-");
    const firstUserEmail = data.email;

    beforeEach(() => {
        cy.appUILogin();
    });
    before(() => {
        cy.apiLogin();
        cy.apiCreateApp(data.appName);
        cy.openApp();
        cy.dragAndDropWidget("Table", 250, 250);
        promoteApp();
        promoteApp();
        releaseApp();
        cy.get(commonWidgetSelector.shareAppButton).click();
        cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${slug}`);
        cy.wait(2000);
        cy.get(commonWidgetSelector.modalCloseButton).click();
        cy.get(commonSelectors.editorPageLogo).click();
        logout();
    });

    it("Verify private and public app share funtionality", () => {
        navigateToAppEditor(data.appName);
        cy.wait(1000);
        cy.get(commonWidgetSelector.shareAppButton).click();
        for (const elements in commonWidgetSelector.shareModalElements) {
            cy.get(
                commonWidgetSelector.shareModalElements[elements]
            ).verifyVisibleElement(
                "have.text",
                commonText.shareModalElements[elements]
            );
        }

        cy.get(commonWidgetSelector.copyAppLinkButton).should("be.visible");
        cy.get(commonWidgetSelector.makePublicAppToggle).should("be.visible");
        cy.get(commonWidgetSelector.appLink).should("be.visible");
        cy.get(commonWidgetSelector.appNameSlugInput).should("be.visible");
        cy.get(commonWidgetSelector.modalCloseButton).should("be.visible");

        cy.get(commonWidgetSelector.modalCloseButton).click();
        cy.wait(3000);
        cy.get(commonSelectors.editorPageLogo).click();

        logout();
        cy.wait(1000);
        cy.visit(`/applications/${slug}`);
        cy.wait(1500);

        cy.get(commonSelectors.loginButton).should("be.visible");

        cy.clearAndType(commonSelectors.workEmailInputField, "dev@tooljet.io");
        cy.clearAndType(commonSelectors.passwordInputField, "password");
        cy.get(commonSelectors.loginButton).click();

        cy.wait(500);
        cy.get('[data-cy="draggable-widget-table1"]').should("be.visible");
        cy.get(commonSelectors.viewerPageLogo).click();

        navigateToAppEditor(data.appName);
        cy.wait(2000);
        cy.get(commonWidgetSelector.shareAppButton).click();
        cy.get(commonWidgetSelector.makePublicAppToggle).check();

        cy.get(commonWidgetSelector.iframeLink).should("be.visible");
        cy.get(commonWidgetSelector.iframeLinkLabel).verifyVisibleElement(
            "have.text",
            commonText.iframeLinkLabel
        );
        cy.get(commonWidgetSelector.iframeLink).should("be.visible");
        cy.get('[data-cy="iframe-link-copy-button"]').should("be.visible");
        cy.get(commonWidgetSelector.modalCloseButton).click();
        cy.get(commonSelectors.editorPageLogo).click();

        logout();
        cy.visit(`/applications/${slug}`);
        cy.wait(500);
        cy.get('[data-cy="draggable-widget-table1"]').should("be.visible");
    });

    it("Verify app private and public app visibility for the same workspace user", () => {
        navigateToAppEditor(data.appName);
        cy.wait(2000);
        cy.get(commonWidgetSelector.shareAppButton).click();
        cy.get("body").then(($el) => {
            if (!$el.text().includes("Embedded app link", { timeout: 2000 })) {
                cy.get(commonWidgetSelector.makePublicAppToggle).check();
            }
        });
        cy.get(commonWidgetSelector.modalCloseButton).click();
        cy.get(commonSelectors.editorPageLogo).click();
        navigateToManageUsers();
        cy.wait(1000);
        cy.get("body").then(($el) => {
            if (!$el.text().includes(data.email, { timeout: 2000 })) {
                inviteUser(data.firstName, data.email);
            } else {
                WorkspaceInvitationLink(data.email);
            }
        });
        cy.wait(1000);
        cy.clearAndType(commonSelectors.passwordInputField, "password");
        cy.get(commonSelectors.acceptInviteButton).click();

        logout();
        cy.visit(`/applications/${slug}`);
        cy.get('[data-cy="draggable-widget-table1"]').should("be.visible");

        cy.appUILogin();
        navigateToAppEditor(data.appName);
        cy.wait(2000);
        cy.skipEditorPopover();
        cy.get(commonWidgetSelector.shareAppButton).click();
        cy.get(commonWidgetSelector.makePublicAppToggle).uncheck();
        cy.get(commonWidgetSelector.modalCloseButton).click();
        cy.get(commonSelectors.editorPageLogo).click();

        logout();
        cy.visit(`/applications/${slug}`);

        cy.login(data.email, "password");
        cy.get(commonSelectors.allApplicationLink).verifyVisibleElement(
            "have.text",
            commonText.allApplicationLink
        );
    });

    it("Verify app private and public app visibility for the same instance user", () => {
        resetAllowPersonalWorkspace();
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase();

        logout();
        userSignUp(data.firstName, data.email, "Test");
        cy.visit(`/applications/${slug}`);
        cy.wait(1000);

        cy.clearAndType(commonSelectors.workEmailInputField, data.email);
        cy.clearAndType(commonSelectors.passwordInputField, "password");
        cy.get(commonSelectors.signInButton).click();
        cy.wait(1000);
        cy.get(`[data-cy="workspace-sign-in-sub-header"]`).verifyVisibleElement(
            "have.text",
            "Sign in to your workspace - My workspace"
        );

        cy.visit("/");
        cy.wait(2000);
        logout();
        cy.appUILogin();

        navigateToAppEditor(data.appName);
        cy.wait(2000);
        cy.skipEditorPopover();
        cy.get(commonWidgetSelector.shareAppButton).click();
        cy.get(commonWidgetSelector.makePublicAppToggle).check();
        cy.get(commonWidgetSelector.modalCloseButton).click();
        cy.get(commonSelectors.editorPageLogo).click();

        logout();
        cy.visit(`/applications/${slug}`);
        cy.get('[data-cy="draggable-widget-table1"]').should("be.visible");
        cy.get(commonSelectors.viewerPageLogo).click();
    });
});
