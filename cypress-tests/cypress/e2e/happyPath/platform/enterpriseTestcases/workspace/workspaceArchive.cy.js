import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import {
    logout,
    navigateToAppEditor,
    navigateToManageUsers,
} from "Support/utils/common";
import { commonText } from "Texts/common";
import {
    commonEeSelectors,
    instanceSettingsSelector,
    workspaceSelector,
} from "Selectors/eeCommon";
import {
    userSignUp,
    allowPersonalWorkspace,
    inviteUser,
    WorkspaceInvitationLink,
    createAnAppWithSlug,
    openInstanceSettings,
    archiveWorkspace,
} from "Support/utils/eeCommon";
import { updateWorkspaceName } from "Support/utils/userPermissions";
import { promoteApp, releaseApp } from "Support/utils/multiEnv";


describe("Workspace archive", () => {
    const data = {};

    it("Workspace archive functionality", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase();
        data.workspaceName = fake.firstName.toLowerCase();
        data.appName = `${fake.companyName} App1`;
        data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");

        userSignUp(data.firstName, data.email, "Test");
        updateWorkspaceName(data.email);
        logout();

        cy.defaultWorkspaceLogin();
        openInstanceSettings();
        cy.get(instanceSettingsSelector.allWorkspaceTab)
            .verifyVisibleElement("have.text", "All workspaces")
            .click();
        cy.get(commonSelectors.pageTitle).should(($el) => {
            expect($el.contents().last().text().trim()).to.eq("Workspaces");
        });
        cy.get(workspaceSelector.activelink).should(($el) => {
            expect($el.contents().first().text().trim()).to.eq("Active (");
        });
        cy.get(workspaceSelector.archivedLik).should(($el) => {
            expect($el.contents().first().text().trim()).to.eq("Archived (");
        });
        cy.get(commonEeSelectors.searchBar).verifyVisibleElement(
            "have.attr",
            "placeholder",
            "Search active workspace"
        );
        cy.get(commonEeSelectors.nameHeader).verifyVisibleElement(
            "have.text",
            "Workspace name"
        );
        cy.clearAndType(commonEeSelectors.searchBar, "My workspace");

        cy.get(".current-workspace-tag").verifyVisibleElement(
            "have.text",
            "Current workspace"
        );
        cy.get(workspaceSelector.userStatusChange).eq(0).should("be.visible");
        cy.get(workspaceSelector.workspaceStatusChange)
            .eq(0)
            .verifyVisibleElement("have.text", "Archive");
        cy.get(commonEeSelectors.paginationSection).should("be.visible");

        cy.clearAndType(commonEeSelectors.searchBar, data.email);
        cy.get(workspaceSelector.workspaceStatusChange).eq(0).click();

        cy.get(commonEeSelectors.modalTitle)
            .eq(1)
            .verifyVisibleElement("have.text", "Archive workspace");
        cy.get(commonSelectors.workspaceName).verifyVisibleElement(
            "have.text",
            data.email
        );
        cy.get(commonWidgetSelector.modalCloseButton).should("be.visible");
        cy.get(commonEeSelectors.modalMessage).verifyVisibleElement(
            "have.text",
            "Archiving the workspace will revoke user access and all associate content. Are you sure you want to continue?"
        );
        cy.get(commonEeSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(commonEeSelectors.confirmButton).verifyVisibleElement(
            "have.text",
            "Archive"
        );
        cy.wait(1000);
        cy.get(commonEeSelectors.confirmButton).click();

        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            `${data.email} \n was successfully archived`
        );

        cy.get(workspaceSelector.archivedLik).click();
        cy.clearAndType(commonEeSelectors.searchBar, data.email);
        cy.get(workspaceSelector.workspaceStatusChange)
            .eq(0)
            .verifyVisibleElement("have.text", "Unarchive");
        cy.logoutApi();
        cy.visit("/");
        cy.clearAndType(commonSelectors.workEmailInputField, data.email);
        cy.clearAndType(commonSelectors.passwordInputField, "password");
        cy.get(commonSelectors.signInButton).click();

        cy.get(workspaceSelector.switchWsModalTitle).verifyVisibleElement(
            "have.text",
            "Archived workspace"
        );
        cy.get(workspaceSelector.switchWsModalMessage).verifyVisibleElement(
            "have.text",
            "This workspace has been archived. Contact superadmin to know more."
        );

        cy.apiLogin();
        cy.visit("/");
        openInstanceSettings();
        cy.get(instanceSettingsSelector.allWorkspaceTab).click();
        cy.get(workspaceSelector.archivedLik).click();
        cy.clearAndType(commonEeSelectors.searchBar, data.email);
        cy.get(workspaceSelector.workspaceStatusChange).eq(0).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            `${data.email} \n was successfully unarchived`
        );
        cy.get(workspaceSelector.activelink).click();
        cy.clearAndType(commonEeSelectors.searchBar, data.email);
        cy.get(workspaceSelector.workspaceStatusChange)
            .eq(0)
            .verifyVisibleElement("have.text", "Archive");

        cy.apiLogin(data.email);
        cy.apiCreateWorkspace(data.firstName, data.workspaceName);
        cy.visit(`${data.workspaceName}`);
        logout();

        cy.apiLogin();
        cy.visit("/");
        openInstanceSettings();
        archiveWorkspace(data.firstName);
        cy.logoutApi();

        cy.visit(`${data.workspaceName}`);
        cy.clearAndType(commonSelectors.workEmailInputField, data.email);
        cy.clearAndType(commonSelectors.passwordInputField, "password");
        cy.get(commonSelectors.signInButton).click();
        cy.wait(4000);

        cy.get(workspaceSelector.switchWsModalTitle).verifyVisibleElement(
            "have.text",
            "Archived workspace"
        );
        cy.get(workspaceSelector.switchWsModalMessage).verifyVisibleElement(
            "have.text",
            "This workspace has been archived. Select an active workspace to continue this session."
        );

        cy.get(workspaceSelector.workspaceName(data.email)).should("be.visible");
        cy.get(workspaceSelector.workspaceInput(data.email)).check();
        cy.get(commonSelectors.continueButton).click();
        cy.wait(2000);

        cy.skipWalkthrough();
        cy.createApp(data.appName);
        cy.dragAndDropWidget("Table", 250, 250);
        promoteApp();
        promoteApp();
        releaseApp();
        cy.get(commonWidgetSelector.shareAppButton).click();
        cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug}`);
        cy.get(commonWidgetSelector.makePublicAppToggle).check();
        cy.wait(2000);
        cy.get(commonWidgetSelector.modalCloseButton).click();
        cy.backToApps();
        logout();

        cy.clearAndType(commonSelectors.workEmailInputField, "dev@tooljet.io");
        cy.clearAndType(commonSelectors.passwordInputField, "password");
        cy.get(commonSelectors.signInButton).click();
        openInstanceSettings();
        archiveWorkspace(data.email);
        cy.get(workspaceSelector.switchWsModalTitle)
            .eq(0)
            .verifyVisibleElement("have.text", "Archive current workspace");
        cy.get(workspaceSelector.switchWsModalMessage)
            .eq(0)
            .verifyVisibleElement(
                "have.text",
                "The current workspace will be archived. Select an active workspace to continue this session."
            );
        cy.get('[data-cy="my-workspace-workspace-input"]').check();
        cy.get(commonSelectors.continueButton).click();
        cy.wait(2000);
        cy.url().should("eq", "http://localhost:8082/my-workspace");
        openInstanceSettings();
        cy.clearAndType(commonSelectors.inputUserSearch, data.email);
        cy.get(instanceSettingsSelector.viewButton(data.firstName)).click();
        cy.get(commonEeSelectors.modalTitle).verifyVisibleElement(
            "have.text",
            "No active workspace"
        );
        cy.get(commonEeSelectors.modalMessage).verifyVisibleElement(
            "have.text",
            "User is not part of any active workspaces. Invite them to a workspace so they can begin exploring!"
        );

        cy.logoutApi();

        cy.visit(`/applications/${data.slug}`);
        cy.get(workspaceSelector.switchWsModalTitle).verifyVisibleElement(
            "have.text",
            "Archived workspace"
        );
        cy.get(workspaceSelector.switchWsModalMessage).verifyVisibleElement(
            "have.text",
            "Your workspace and all app in it have been archived. Contact super admin to know more"
        );

        cy.defaultWorkspaceLogin();
        openInstanceSettings();
        cy.get(instanceSettingsSelector.allWorkspaceTab).click();
        cy.get(workspaceSelector.archivedLik).click();
        cy.clearAndType(commonEeSelectors.searchBar, data.firstName);
        cy.get(workspaceSelector.workspaceStatusChange).eq(0).click();

        cy.appPrivacy(data.appName, false);
        cy.logoutApi();
        cy.apiLogin(data.email);
        cy.visit(`/applications/${data.slug}`);
        cy.get(workspaceSelector.switchWsModalTitle).verifyVisibleElement(
            "have.text",
            "Archived workspace"
        );
        cy.get(workspaceSelector.switchWsModalMessage).verifyVisibleElement(
            "have.text",
            "Your workspace and all app in it have been archived. Contact super admin to know more"
        );
    });
});
