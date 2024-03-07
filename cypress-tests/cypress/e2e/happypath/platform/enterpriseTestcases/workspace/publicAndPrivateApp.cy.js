import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import {
    logout,
    navigateToAppEditor,
    navigateToManageUsers,
} from "Support/utils/common";
import { commonText } from "Texts/common";
import { commonEeSelectors } from "Selectors/eeCommon";
import {
    userSignUp,
    allowPersonalWorkspace,
    inviteUser,
    WorkspaceInvitationLink,
    createAnAppWithSlug,
} from "Support/utils/eeCommon";

describe(
    "App share functionality",
    {
        retries: {
            runMode: 2,
        },
    },
    () => {
        const data = {};
        const envVar = Cypress.env("environment");
        beforeEach(() => {
            cy.skipWalkthrough();
        });

        it("Verify private and public app share funtionality", () => {
            data.appName = `${fake.companyName} App1`;
            data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");

            cy.defaultWorkspaceLogin();
            createAnAppWithSlug(data.appName, data.slug);

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

            cy.logoutApi();
            cy.visit(`/applications/${data.slug}`);
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
            cy.wait(500);
            cy.get(commonWidgetSelector.makePublicAppToggle).check();

            cy.get(commonWidgetSelector.iframeLink).should("be.visible");
            cy.get(commonWidgetSelector.iframeLinkLabel).verifyVisibleElement(
                "have.text",
                commonText.iframeLinkLabel
            );
            cy.get(commonWidgetSelector.iframeLink).should("be.visible");
            cy.get('[data-cy="iframe-link-copy-button"]').should("be.visible");
            cy.get(commonWidgetSelector.modalCloseButton).click();

            cy.logoutApi();
            cy.visit(`/applications/${data.slug}`);
            cy.wait(500);
            cy.get('[data-cy="draggable-widget-table1"]').should("be.visible");
        });

        it("Verify app private and public app visibility for the same workspace user", () => {
            data.appName = `${fake.companyName} App2`;
            data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");
            data.firstName = fake.firstName;
            data.email = fake.email.toLowerCase();

            cy.defaultWorkspaceLogin();
            createAnAppWithSlug(data.appName, data.slug);
            cy.get(commonWidgetSelector.shareAppButton).click();
            cy.wait(500);
            cy.get(commonWidgetSelector.makePublicAppToggle).check();
            cy.wait(500);
            cy.get(commonWidgetSelector.modalCloseButton).click();

            cy.backToApps();

            cy.wait(1000);
            navigateToManageUsers();
            inviteUser(data.firstName, data.email);
            cy.clearAndType(commonSelectors.passwordInputField, "password");
            cy.get(commonSelectors.acceptInviteButton).click();
            cy.wait(2000);

            logout();
            cy.visit(`/applications/${data.slug}`);
            cy.wait(1000);
            cy.get('[data-cy="draggable-widget-table1"]').should("be.visible");

            cy.defaultWorkspaceLogin();
            navigateToAppEditor(data.appName);
            cy.get(commonWidgetSelector.shareAppButton).click();
            cy.wait(500);
            cy.get(commonWidgetSelector.makePublicAppToggle).uncheck();
            cy.wait(500);
            cy.get(commonWidgetSelector.modalCloseButton).click();

            cy.wait(1000);

            cy.logoutApi();
            cy.visit(`/applications/${data.slug}`);

            cy.login(data.email, "password");
            cy.get(commonSelectors.allApplicationLink).verifyVisibleElement(
                "have.text",
                commonText.allApplicationLink
            );
        });

        it("Verify app private and public app visibility for the same instance user", () => {
            if (envVar === "Enterprise") {
                allowPersonalWorkspace();
            }

            data.appName = `${fake.companyName} App3`;
            data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");
            data.firstName = fake.firstName;
            data.email = fake.email.toLowerCase();

            cy.defaultWorkspaceLogin();
            createAnAppWithSlug(data.appName, data.slug);
            cy.logoutApi();

            userSignUp(data.firstName, data.email, "Test");
            cy.visit(`/applications/${data.slug}`);
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
            cy.defaultWorkspaceLogin();
            navigateToAppEditor(data.appName);
            cy.get(commonWidgetSelector.shareAppButton).click();
            cy.wait(2000);
            cy.get(commonWidgetSelector.makePublicAppToggle).check();
            cy.wait(1000);
            cy.get(commonWidgetSelector.modalCloseButton).click();

            cy.logoutApi();
            cy.visit(`/applications/${data.slug}`);
            cy.get('[data-cy="draggable-widget-table1"]').should("be.visible");
            cy.get(commonSelectors.viewerPageLogo).click();
        });
    }
);
